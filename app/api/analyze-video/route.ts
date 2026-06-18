import { NextRequest, NextResponse } from "next/server";

/* ─── Types ──────────────────────────────────────────────────────── */

export interface VideoAnalysisResponse {
  duration: number;
  fps: number;
  motion_intensity: number;
  brightness_variance: number;
  scene_changes: number;
}

export interface AnalyzeVideoBody {
  videoUrl: string;
}

/* ─── Placeholder analysis ─────────────────────────────────────────
 *
 *  This endpoint is prepared for future FFmpeg integration.
 *  Currently returns zeroed placeholder values so the frontend
 *  can integrate without breaking and without requiring OpenAI.
 *
 *  When FFmpeg is added, replace the body of `analyzeVideo` with
 *  real frame extraction + motion/brightness/scene-change logic.
 * ────────────────────────────────────────────────────────────────── */

async function analyzeVideo(_videoUrl: string): Promise<VideoAnalysisResponse> {
  // TODO: integrate FFmpeg / sharp / canvas-based frame sampling here.
  return {
    duration: 0,
    fps: 0,
    motion_intensity: 0,
    brightness_variance: 0,
    scene_changes: 0,
  };
}

/* ─── Route handler ──────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<AnalyzeVideoBody>;

    if (!body?.videoUrl || typeof body.videoUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid field: videoUrl (string)" },
        { status: 400 }
      );
    }

    const result = await analyzeVideo(body.videoUrl);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("analyze-video error:", error);
    return NextResponse.json(
      { error: "Failed to analyze video." },
      { status: 500 }
    );
  }
}