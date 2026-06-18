import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ─── Spotify playlist IDs ──────────────────────────────────────── */
const PLAYLISTS = {
  "Viral 50 Global": "37i9dQZEVXbLiRSAsKsINs",
  "Top 50 Global": "37i9dQZEVXbMDoHDwVN2tF",
  "Trending India": "37i9dQZEVXbLZ52iTPGhOD",
};

/* ─── Auth ──────────────────────────────────────────────────────── */

async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify auth failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

/* ─── Fetch playlist tracks ─────────────────────────────────────── */

async function fetchPlaylistTracks(accessToken: string, playlistId: string): Promise<any[]> {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch playlist ${playlistId}: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.items ?? [];
}

/* ─── Extract normalized song record ───────────────────────────── */

function extractTrack(item: any): {
  song_name: string;
  artist_name: string;
  spotify_url: string;
  popularity: number | null;
} | null {
  const track = item?.track;
  if (!track) return null;

  const name = track.name;
  if (!name) return null;

  const artists = track.artists ?? [];
  const artistName = artists.map((a: any) => a?.name).filter(Boolean).join(", ") || "Unknown Artist";

  const spotifyUrl = track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`;

  return {
    song_name: name,
    artist_name: artistName,
    spotify_url: spotifyUrl,
    popularity: typeof track.popularity === "number" ? track.popularity : null,
  };
}

/* ─── Map popularity to trend_score (0-100) ─────────────────────── */

function popularityToTrendScore(popularity: number | null): number {
  if (popularity === null || popularity === undefined) return 0;
  return Math.min(100, Math.max(0, popularity));
}

/* ─── Route handler ─────────────────────────────────────────────── */

/* ─── Core sync logic (shared by GET and POST) ──────────────────── */

async function syncTrendingSongs(): Promise<{
  inserted: number;
  duplicatesSkipped: number;
  tracksFound: number;
  tracksPrepared: number;
  spotifyError: string | null;
  supabaseError: string | null;
}> {
  let spotifyError: string | null = null;
  let supabaseError: string | null = null;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalTracksFound = 0;
  let totalTracksPrepared = 0;

  console.log("[spotify/trending] Starting sync...");
  console.log("[spotify/trending] Playlists:", Object.keys(PLAYLISTS));

  let accessToken: string | null = null;
  try {
    accessToken = await getSpotifyToken();
    console.log("[spotify/trending] Spotify access token obtained.");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown auth error";
    console.error("[spotify/trending] Spotify auth failed:", message);
    spotifyError = message;
    return { inserted: 0, duplicatesSkipped: 0, tracksFound: 0, tracksPrepared: 0, spotifyError, supabaseError: null };
  }

  const moodPool = ["Calm", "Energetic", "Aggressive", "Cinematic", "Emotional"];
  const energyPool = [45, 55, 65, 75, 85];

  for (const [playlistName, playlistId] of Object.entries(PLAYLISTS)) {
    try {
      const items = await fetchPlaylistTracks(accessToken, playlistId);
      const extracted = items.map(extractTrack).filter((t): t is NonNullable<typeof t> => t !== null);
      const rows = extracted.map((t) => ({
        song_name: t.song_name,
        artist_name: t.artist_name,
        spotify_url: t.spotify_url,
        mood: moodPool[Math.floor(Math.random() * moodPool.length)],
        energy: energyPool[Math.floor(Math.random() * energyPool.length)],
        bpm: Math.round(80 + Math.random() * 100),
        trend_score: popularityToTrendScore(t.popularity),
      }));

      totalTracksFound += items.length;
      totalTracksPrepared += rows.length;

      console.log(`[spotify/trending] Playlist: ${playlistName} (${playlistId})`);
      console.log(`[spotify/trending]   Tracks returned: ${items.length}`);
      if (extracted.length > 0) {
        console.log(`[spotify/trending]   First track: ${extracted[0].song_name} — ${extracted[0].artist_name}`);
      }

      if (rows.length === 0) continue;

      // Find duplicates by spotify_url
      const urls = rows.map((r) => r.spotify_url);
      const { data: existing } = await supabase
        .from("trending_songs")
        .select("spotify_url")
        .in("spotify_url", urls);

      const existingUrls = new Set((existing ?? []).map((e) => e.spotify_url));
      const newRows = rows.filter((r) => !existingUrls.has(r.spotify_url));
      const skipped = rows.length - newRows.length;

      if (newRows.length > 0) {
        const { error } = await supabase.from("trending_songs").insert(newRows);
        if (error) {
          console.error(`[spotify/trending] Supabase insert failed for ${playlistName}:`, error.message);
          supabaseError = error.message;
          continue;
        }
      }

      totalInserted += newRows.length;
      totalSkipped += skipped;
      console.log(`[spotify/trending]   Inserted: ${newRows.length}, Skipped: ${skipped}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[spotify/trending] Error processing playlist ${playlistName}:`, message);
      if (!spotifyError) spotifyError = message;
    }
  }

  console.log(`[spotify/trending] Sync complete. inserted=${totalInserted}, skipped=${totalSkipped}`);
  return {
    inserted: totalInserted,
    duplicatesSkipped: totalSkipped,
    tracksFound: totalTracksFound,
    tracksPrepared: totalTracksPrepared,
    spotifyError,
    supabaseError,
  };
}

/* ─── Route handlers ─────────────────────────────────────────────── */

export async function GET() {
  try {
    const result = await syncTrendingSongs();
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    console.error("spotify/trending GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch trending songs.",
        tracksFound: 0,
        tracksPrepared: 0,
        inserted: 0,
        duplicatesSkipped: 0,
        spotifyError: error instanceof Error ? error.message : "Unknown error",
        supabaseError: null,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await syncTrendingSongs();
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    console.error("spotify/trending POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch trending songs.",
        tracksFound: 0,
        tracksPrepared: 0,
        inserted: 0,
        duplicatesSkipped: 0,
        spotifyError: error instanceof Error ? error.message : "Unknown error",
        supabaseError: null,
      },
      { status: 500 }
    );
  }
}
