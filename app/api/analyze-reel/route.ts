import { NextRequest, NextResponse } from "next/server";

/* ─── Types ──────────────────────────────────────────────────────── */

export interface ReelAnalysis {
  mood: string;
  editing_style: string;
  recommended_music_type: string;
  recommended_bpm_range: string;
  reasoning: string;
}

export interface AnalyzeReelBody {
  videoUrl: string;
}

/* ─── Heuristic reel analyzer (placeholder for future AI/ML) ──────
 *
 *  This function simulates the output of an expert Instagram reel analyst.
 *  It inspects the uploaded video's URL and derives music recommendations
 *  from filename cues and file-size heuristics until real AI inference
 *  (OpenAI Vision, TensorFlow.js, etc.) is wired in.
 * ────────────────────────────────────────────────────────────────── */

async function analyzeReel(videoUrl: string): Promise<ReelAnalysis> {
  const urlLower = videoUrl.toLowerCase();

  // Derive rough signals from filename / URL
  const isHighEnergy = /high|fast|intense|viral|trending|party|club|workout|gym/.test(urlLower);
  const isCalm = /calm|chill|relax|peace|slow|nature|travel|vlog/.test(urlLower);
  const isCinematic = /cinematic|movie|film|scene|drama|epic/.test(urlLower);
  const isAggressive = /aggressive|hard|edm|bass|drop|fight|action/.test(urlLower);
  const isShort = /short|reel|15|30/.test(urlLower);

  let mood: string;
  let editingStyle: string;
  let recommendedMusicType: string;
  let recommendedBpmRange: string;

  if (isAggressive) {
    mood = "Aggressive";
    editingStyle = "Fast Cuts";
    recommendedMusicType = "EDM / Bass Music";
    recommendedBpmRange = "140-160";
  } else if (isHighEnergy) {
    mood = "Energetic";
    editingStyle = isShort ? "Fast Cuts" : "High Energy";
    recommendedMusicType = "Pop / Electronic";
    recommendedBpmRange = "120-140";
  } else if (isCinematic) {
    mood = "Cinematic";
    editingStyle = "Slow Cinematic";
    recommendedMusicType = "Orchestral / Ambient";
    recommendedBpmRange = "80-100";
  } else if (isCalm) {
    mood = "Calm";
    editingStyle = "Storytelling";
    recommendedMusicType = "Lo-Fi / Acoustic";
    recommendedBpmRange = "90-110";
  } else {
    mood = "Energetic";
    editingStyle = "Dynamic";
    recommendedMusicType = "Pop / House";
    recommendedBpmRange = "115-130";
  }

  const reasoning = `Detected ${mood.toLowerCase()} mood with ${editingStyle.toLowerCase()} editing based on video filename and metadata heuristics. Recommended ${recommendedMusicType.toLowerCase()} in the ${recommendedBpmRange} BPM range to match pacing.`;

  return {
    mood,
    editing_style: editingStyle,
    recommended_music_type: recommendedMusicType,
    recommended_bpm_range: recommendedBpmRange,
    reasoning,
  };
}

/* ─── Route handler ──────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<AnalyzeReelBody>;

    if (!body?.videoUrl || typeof body.videoUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid field: videoUrl (string)" },
        { status: 400 }
      );
    }

    const analysis = await analyzeReel(body.videoUrl);

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error("analyze-reel error:", error);
    return NextResponse.json(
      { error: "Failed to analyze reel." },
      { status: 500 }
    );
  }
}