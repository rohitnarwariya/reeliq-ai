/**
 * seed-songs.ts
 *
 * Generates 300 synthetic songs and inserts them into the
 * trending_songs table in Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed-songs.ts
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── Configuration ─────────────────────────────────────────────── */

const GENRES = ["Phonk", "Lo-fi", "Pop", "Hip Hop", "Motivational", "Cinematic", "Travel", "Vlog"] as const;

const MOODS = ["Calm", "Energetic", "Aggressive", "Cinematic", "Emotional"] as const;

const ARTISTS = [
  "Phonk Masters", "Lo-Fi Beats", "Pop Nation", "Hip Hop Collective",
  "Motivation Daily", "Cinematic Orchestra", "Travel Tunes", "Vlog Vibes",
  "Beat Lab", "Sound Wave", "Rhythm Republic", "Tone House",
  "Echo Chamber", "Bass Drop", "Melody Makers", "Groove Factory",
];

const TITLE_PREFIXES = [
  "Midnight", "Summer", "Neon", "Ocean", "Desert", "City Lights",
  "Mountain", "Sunset", "Dream", "Fire", "Ice", "Shadow",
  "Crystal", "Golden", "Silver", "Electric", "Silent", "Broken",
];

const TITLE_SUFFIXES = [
  "Drive", "Vibes", "Session", "Mix", "Edition", "Project",
  "Story", "Journey", "Rush", "Flow", "Pulse", "Wave",
  "Beat", "Rhythm", "Echo", "Drop", "Vibe", "Groove",
];

/* ─── Helpers ───────────────────────────────────────────────────── */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSongName(): string {
  const style = Math.random();
  if (style < 0.6) {
    return `${pick(TITLE_PREFIXES)} ${pick(TITLE_SUFFIXES)}`;
  } else if (style < 0.85) {
    return `${pick(TITLE_PREFIXES)}${randInt(1, 99)}`;
  } else {
    return `${pick(TITLE_SUFFIXES)} of ${pick(TITLE_PREFIXES)}`;
  }
}

function genreToMood(genre: string): string {
  const map: Record<string, string> = {
    Phonk: "Aggressive",
    "Lo-fi": "Calm",
    Pop: "Energetic",
    "Hip Hop": "Energetic",
    Motivational: "Energetic",
    Cinematic: "Cinematic",
    Travel: "Calm",
    Vlog: "Energetic",
  };
  return map[genre] || "Energetic";
}

function genreToBpmRange(genre: string): [number, number] {
  const map: Record<string, [number, number]> = {
    Phonk: [130, 160],
    "Lo-fi": [70, 95],
    Pop: [110, 130],
    "Hip Hop": [80, 110],
    Motivational: [120, 140],
    Cinematic: [60, 90],
    Travel: [90, 115],
    Vlog: [100, 125],
  };
  return map[genre] || [100, 130];
}

function generateSongRow(index: number) {
  const genre = GENRES[index % GENRES.length];
  const mood = genreToMood(genre);
  const [bpmMin, bpmMax] = genreToBpmRange(genre);
  const bpm = randInt(bpmMin, bpmMax);
  const energy = randInt(40, 90);
  const popularity = randInt(30, 100);

  return {
    song_name: generateSongName(),
    artist_name: pick(ARTISTS),
    spotify_url: null,
    mood,
    energy,
    bpm,
    trend_score: popularity,
  };
}

/* ─── Main ──────────────────────────────────────────────────────── */

async function main() {
  console.log("Generating 300 synthetic songs...\n");

  const rows = Array.from({ length: 300 }, (_, i) => generateSongRow(i));

  // Group by genre for logging
  const genreCount: Record<string, number> = {};
  for (const row of rows) {
    genreCount[row.mood] = (genreCount[row.mood] || 0) + 1;
  }
  console.log("Generated song breakdown by mood:");
  for (const [mood, count] of Object.entries(genreCount)) {
    console.log(`  ${mood}: ${count}`);
  }
  console.log("");

  console.log("Inserting into trending_songs...\n");

  // Insert in batches of 50 to avoid payload size limits
  const BATCH_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("trending_songs").insert(batch);

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
      console.error("Skipping this batch.\n");
    } else {
      totalInserted += batch.length;
      console.log(`Batch ${i / BATCH_SIZE + 1}: inserted ${batch.length} songs.`);
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  Total inserted: ${totalInserted}`);
  console.log("═══════════════════════════════════════");
}

main().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});