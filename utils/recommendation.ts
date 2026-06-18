/* ─── Recommendation scoring helper ───────────────────────────────
 *
 *  Pure functions for ranking trending_songs against an AI reel analysis.
 *  Used by app/Dashboard/page.tsx and any future consumer.
 * ────────────────────────────────────────────────────────────────── */

export interface SongInput {
  id: string;
  song_name: string;
  artist_name: string;
  spotify_url: string;
  bpm: number | null | undefined;
  energy: number | null | undefined;
  mood: string | null | undefined;
  trend_score: number | null | undefined;
}

export interface ReelAnalysisInput {
  mood: string | null | undefined;
  recommended_bpm_range: string | null | undefined;
  energy_score?: number | null | undefined;
}

export interface ScoredSongOutput extends SongInput {
  moodScore: number;
  energyScore: number;
  bpmScore: number;
  trendBonus: number;
  matchScore: number;
  reason: string;
}

/* ─── Safely coerce to number ──────────────────────────────────── */
function num(value: number | string | null | undefined, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/* ─── Parse BPM range string like "120-140" ──────────────────── */
export function parseBpmRange(rangeStr: string | null | undefined): { min: number; max: number } | null {
  if (!rangeStr) return null;
  const match = rangeStr.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

export function isBpmInRange(bpm: number, range: { min: number; max: number }): boolean {
  return bpm >= range.min && bpm <= range.max;
}

/* ─── Main scoring function ────────────────────────────────────── */
export function scoreSong(song: SongInput, analysis: ReelAnalysisInput): ScoredSongOutput {
  const songEnergy = num(song.energy, 50);
  const reelEnergy = num(analysis.energy_score, 50);

  // 1. Mood match: exact match = 30, else 0
  const songMood = (song.mood || "Calm").toLowerCase();
  const reelMood = (analysis.mood || "Calm").toLowerCase();
  const moodScore = songMood === reelMood ? 30 : 0;

  // 2. Energy match: closer to reel energy = higher score (0-100)
  const energyDiff = Math.abs(songEnergy - reelEnergy);
  const energyScore = Math.max(0, 100 - energyDiff);

  // 3. BPM match: inside recommended range = +30, else 0
  const bpm = num(song.bpm, 0);
  const range = parseBpmRange(analysis.recommended_bpm_range);
  const bpmInRange = range ? isBpmInRange(bpm, range) : false;
  const bpmScore = bpmInRange ? 30 : 0;

  // 4. Trend bonus: trend_score * 0.2
  const trendBonus = num(song.trend_score, 0) * 0.2;

  // 5. Final match score (sum of components)
  const matchScore = Math.min(100, Math.round(moodScore + energyScore + bpmScore + trendBonus));

  // 6. Reason text
  const parts: string[] = [];
  if (moodScore > 0) parts.push("Mood matches perfectly.");
  else parts.push("Mood differs from reel.");

  if (energyScore >= 80) parts.push("Excellent energy match.");
  else if (energyScore >= 50) parts.push("Good energy match.");
  else parts.push("Moderate energy match.");

  if (bpmInRange) parts.push("BPM fits recommended range.");
  if (trendBonus > 10) parts.push("Trending song with bonus.");

  return {
    ...song,
    moodScore,
    energyScore,
    bpmScore,
    trendBonus,
    matchScore,
    reason: parts.join(" "),
  };
}

/* ─── Rank and limit to top N ──────────────────────────────────── */
export function rankSongs(songs: SongInput[], analysis: ReelAnalysisInput, topN = 10): ScoredSongOutput[] {
  const scored = songs.map((song) => scoreSong(song, analysis));
  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, topN);
}