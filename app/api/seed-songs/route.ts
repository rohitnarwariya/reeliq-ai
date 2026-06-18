import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const GENRES = ["Phonk", "Lo-fi", "Pop", "Hip Hop", "Motivational", "Cinematic", "Travel", "Vlog"] as const;

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

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSongName(): string {
  const style = Math.random();
  if (style < 0.6) return `${pick(TITLE_PREFIXES)} ${pick(TITLE_SUFFIXES)}`;
  if (style < 0.85) return `${pick(TITLE_PREFIXES)}${randInt(1, 99)}`;
  return `${pick(TITLE_SUFFIXES)} of ${pick(TITLE_PREFIXES)}`;
}

function genreToMood(genre: string): string {
  const map: Record<string, string> = {
    Phonk: "Aggressive", "Lo-fi": "Calm", Pop: "Energetic",
    "Hip Hop": "Energetic", Motivational: "Energetic", Cinematic: "Cinematic",
    Travel: "Calm", Vlog: "Energetic",
  };
  return map[genre] || "Energetic";
}

function genreToBpmRange(genre: string): [number, number] {
  const map: Record<string, [number, number]> = {
    Phonk: [130, 160], "Lo-fi": [70, 95], Pop: [110, 130],
    "Hip Hop": [80, 110], Motivational: [120, 140], Cinematic: [60, 90],
    Travel: [90, 115], Vlog: [100, 125],
  };
  return map[genre] || [100, 130];
}

export async function POST() {
  try {
    const rows = Array.from({ length: 300 }, (_, i) => {
      const genre = GENRES[i % GENRES.length];
      const mood = genreToMood(genre);
      const [bpmMin, bpmMax] = genreToBpmRange(genre);
      return {
        song_name: generateSongName(),
        artist_name: pick(ARTISTS),
        spotify_url: null,
        mood,
        energy: randInt(40, 90),
        bpm: randInt(bpmMin, bpmMax),
        trend_score: randInt(30, 100),
      };
    });

    const BATCH_SIZE = 50;
    let totalInserted = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("trending_songs").insert(batch);
      if (error) {
        console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
      } else {
        totalInserted += batch.length;
      }
    }

    return NextResponse.json({ success: true, inserted: totalInserted }, { status: 200 });
  } catch (error) {
    console.error("seed-songs error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Seeder failed." },
      { status: 500 }
    );
  }
}