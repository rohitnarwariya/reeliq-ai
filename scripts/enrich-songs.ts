/**
 * enrich-songs.ts
 *
 * Reads all songs from trending_songs in Supabase.
 * For songs missing bpm or energy, fetches audio features from the Spotify API
 * and saves bpm + energy back to the database.
 *
 * Usage:
 *   npx tsx scripts/enrich-songs.ts
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env.local (Next.js convention)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ─── Types ────────────────────────────────────────────────────────

interface AudioTrack {
  id: string;
  song_name: string | null;
  artist_name: string | null;
  spotify_url: string | null;
  bpm: number | null;
  energy: number | null;
  niche: string | null;
  mood: string | null;
  trend_score: number | null;
  created_at: string | null;
}

interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
}

interface SpotifyAudioFeatures {
  energy: number;
  tempo: number;
}

// ─── Clients ──────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

if (!spotifyClientId || !spotifyClientSecret) {
  console.error(
    "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET. Add them to .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Spotify Auth ─────────────────────────────────────────────────

async function getSpotifyAccessToken(): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${spotifyClientId}:${spotifyClientSecret}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!response.ok) {
    throw new Error(
      `Spotify auth failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as SpotifyAuthResponse;
  return data.access_token;
}

// ─── Spotify Search ───────────────────────────────────────────────

async function searchSpotifyTrack(
  audioName: string,
  artistName: string | null,
  accessToken: string
): Promise<string | null> {
  const query = artistName
    ? `track:${audioName} artist:${artistName}`
    : `track:${audioName}`;

  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
    query
  )}&type=track&limit=1`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.warn(`  Spotify search failed for "${query}": ${response.status}`);
    return null;
  }

  const data = await response.json();
  const tracks: SpotifyTrack[] = data?.tracks?.items ?? [];

  if (tracks.length === 0) {
    // Try without artist
    if (artistName) {
      return searchSpotifyTrack(audioName, null, accessToken);
    }
    return null;
  }

  return tracks[0].id;
}

// ─── Spotify Audio Features ───────────────────────────────────────

async function getAudioFeatures(
  spotifyTrackId: string,
  accessToken: string
): Promise<SpotifyAudioFeatures | null> {
  const url = `https://api.spotify.com/v1/audio-features/${spotifyTrackId}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.warn(
      `  Audio features failed for ${spotifyTrackId}: ${response.status}`
    );
    return null;
  }

  const data = (await response.json()) as SpotifyAudioFeatures;
  return { energy: data.energy, tempo: data.tempo };
}

// ─── Extract Spotify Track ID from URL ────────────────────────────

function extractSpotifyId(spotifyUrl: string | null): string | null {
  if (!spotifyUrl) return null;
  // e.g. https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
  const match = spotifyUrl.match(/\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching all songs from trending_songs...\n");

  const { data: songs, error } = await supabase
    .from("trending_songs")
    .select("*");

  if (error) {
    console.error("Failed to fetch trending_songs:", error.message);
    process.exit(1);
  }

  const allSongs = (songs || []) as AudioTrack[];
  console.log(`Found ${allSongs.length} total songs.\n`);

  // Filter songs that need enrichment
  const needsEnrichment = allSongs.filter(
    (song) => song.bpm === null || song.energy === null
  );

  if (needsEnrichment.length === 0) {
    console.log("All songs already have bpm and energy. Nothing to do.");
    return;
  }

  console.log(`${needsEnrichment.length} songs need enrichment.\n`);

  // Get Spotify access token
  console.log("Authenticating with Spotify...");
  const accessToken = await getSpotifyAccessToken();
  console.log("Authenticated.\n");

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const song of needsEnrichment) {
    const name = song.song_name || "Unknown";

    // Try to get track ID from existing spotify_url first
    let spotifyTrackId = extractSpotifyId(song.spotify_url);

    // If no URL, search by name + artist
    if (!spotifyTrackId) {
      process.stdout.write(`  Searching: "${name}"... `);
      spotifyTrackId = await searchSpotifyTrack(
        name,
        song.artist_name,
        accessToken
      );

      if (!spotifyTrackId) {
        console.log(`❌ Not found on Spotify`);
        failed++;
        continue;
      }
      console.log(`found (${spotifyTrackId})`);
    } else {
      console.log(`  Using existing Spotify ID: ${spotifyTrackId}`);
    }

    // Fetch audio features
    process.stdout.write(`  Fetching features... `);
    const features = await getAudioFeatures(spotifyTrackId, accessToken);

    if (!features) {
      console.log(`❌ No features available`);
      failed++;
      continue;
    }

    // Convert tempo (BPM) to integer and energy (0-1) to 0-100 scale
    const bpm = Math.round(features.tempo);
    const energy = Math.round(features.energy * 100);

    // Save to Supabase
    const { error: updateError } = await supabase
      .from("trending_songs")
      .update({ bpm, energy })
      .eq("id", song.id);

    if (updateError) {
      console.log(`❌ Update failed: ${updateError.message}`);
      failed++;
      continue;
    }

    console.log(`✓ Updated`);
    console.log(`    Song:    ${name}`);
    console.log(`    BPM:     ${bpm}`);
    console.log(`    Energy:  ${energy}/100`);
    console.log();
    updated++;

    // Small delay to avoid rate limiting (Spotify allows ~300 requests/minute)
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  // Summary
  console.log("═══════════════════════════════════════");
  console.log(`  Updated:  ${updated}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log("═══════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});