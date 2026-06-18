import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/* ─── Types ──────────────────────────────────────────────────────── */

export interface AnalysisRequestBody {
  duration: number;
  fps: number;
  pace_score: number;
  energy_score: number;
  motion_intensity: number;
  brightness_variance?: number;
  frames?: string[]; // base64-encoded JPEG frames
}

export interface AIAnalysisResponse {
  mood: string;
  editing_style: string;
  content_type: string;
  visual_intensity: number;
  creator_niche: string;
  music_type: string;
  recommended_bpm_range: string;
  reasoning: string;
}

/* ─── OpenAI client ─────────────────────────────────────────────── */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o"; // Vision-capable model

/* ─── Prompt ───────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are an expert Instagram reel analyst.

Analyze the provided reel frames and metadata, then return ONLY valid JSON in this exact schema:

{
  "mood": "",
  "editing_style": "",
  "content_type": "",
  "visual_intensity": 0,
  "creator_niche": "",
  "music_type": "",
  "recommended_bpm_range": "",
  "reasoning": ""
}

Allowed mood values: Calm, Energetic, Aggressive, Cinematic, Emotional
Allowed editing_style values: Slow Cinematic, Storytelling, Fast Cuts, High Energy, Vlog Style
content_type should be one of: lifestyle, gaming, fitness, fashion, food, travel, education, entertainment, motivation, cinematic
visual_intensity must be a number from 0 to 100 representing how visually intense the reel is.
creator_niche should be a short descriptor of the creator/category (e.g. "fitness influencer", "travel vlogger", "food blogger", "gaming commentator").
music_type should describe the ideal genre/vibe (e.g. "Lo-Fi Hip Hop", "EDM", "Orchestral", "Pop", "Ambient").
recommended_bpm_range must be a range like "120-140"
reasoning must be a concise 2-3 sentence explanation referencing visual cues.`;

/* ─── Build messages for OpenAI vision ──────────────────────────── */

function buildVisionMessages(body: AnalysisRequestBody) {
  const userContent: OpenAI.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `Analyze these key frames from an Instagram reel along with its metadata.

Reel metadata:
- Duration: ${body.duration}s
- FPS: ${body.fps}
- Pace Score: ${body.pace_score}/100
- Energy Score: ${body.energy_score}/100
- Motion Intensity: ${body.motion_intensity}/100
- Brightness Variance: ${body.brightness_variance ?? 0}

The frames are ordered from start (0%) to end (100%) of the reel.`,
    },
  ];

  if (body.frames && body.frames.length > 0) {
    for (const frame of body.frames) {
      userContent.push({
        type: "image_url",
        image_url: { url: frame, detail: "low" },
      });
    }
  }

  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userContent },
  ];
}

/* ─── Safe JSON parser ──────────────────────────────────────────── */

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/* ─── Fallback analysis when OpenAI fails or is not configured ─── */

function fallbackAnalysis(body: AnalysisRequestBody): AIAnalysisResponse {
  const mood = body.energy_score >= 65 ? "Energetic" : body.energy_score >= 45 ? "Cinematic" : "Calm";
  const editingStyle = body.pace_score >= 70 ? "High Energy" : body.pace_score >= 50 ? "Storytelling" : "Slow Cinematic";
  return {
    mood,
    editing_style: editingStyle,
    content_type: "lifestyle",
    visual_intensity: Math.min(100, Math.max(0, Math.round(body.motion_intensity ?? 0))),
    creator_niche: "creator",
    music_type: mood === "Energetic" ? "Pop / Electronic" : mood === "Calm" ? "Lo-Fi / Acoustic" : "Ambient",
    recommended_bpm_range: body.pace_score >= 70 ? "120-140" : "90-110",
    reasoning: `Fallback analysis based on metadata: energy score ${body.energy_score}/100 and pace score ${body.pace_score}/100 indicate a ${editingStyle.toLowerCase()} reel with ${mood.toLowerCase()} tone.`,
  };
}

/* ─── Route handler ──────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    console.log("[analyze-reel-ai] Request received.");
    const body = (await request.json()) as Partial<AnalysisRequestBody>;

    // Validate required numeric fields
    const duration = typeof body.duration === "number" ? body.duration : 0;
    const fps = typeof body.fps === "number" ? body.fps : 0;
    const paceScore = typeof body.pace_score === "number" ? body.pace_score : 0;
    const energyScore = typeof body.energy_score === "number" ? body.energy_score : 0;
    const motionIntensity = typeof body.motion_intensity === "number" ? body.motion_intensity : 0;
    const brightnessVariance = typeof body.brightness_variance === "number" ? body.brightness_variance : 0;
    const frameCount = Array.isArray(body.frames) ? body.frames.length : 0;

    console.log("[analyze-reel-ai] Metrics received:", {
      duration, fps, paceScore, energyScore, motionIntensity, brightnessVariance, frameCount,
    });

    if (!process.env.OPENAI_API_KEY) {
      console.warn("[analyze-reel-ai] Missing OPENAI_API_KEY. Using fallback.");
      return NextResponse.json(fallbackAnalysis({ duration, fps, pace_score: paceScore, energy_score: energyScore, motion_intensity: motionIntensity, brightness_variance: brightnessVariance }), { status: 200 });
    }

    const messages = buildVisionMessages({
      duration,
      fps,
      pace_score: paceScore,
      energy_score: energyScore,
      motion_intensity: motionIntensity,
      brightness_variance: brightnessVariance,
      frames: Array.isArray(body.frames) ? body.frames : undefined,
    });

    console.log("[analyze-reel-ai] OpenAI request started. Model:", MODEL, "Frames:", frameCount);

    let completion: OpenAI.ChatCompletion;
    try {
      completion = await openai.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" },
      });
    } catch (openaiError) {
      console.error("[analyze-reel-ai] OpenAI request failed:", openaiError);
      const fallback = fallbackAnalysis({ duration, fps, pace_score: paceScore, energy_score: energyScore, motion_intensity: motionIntensity, brightness_variance: brightnessVariance });
      return NextResponse.json({ ...fallback, _devError: openaiError instanceof Error ? openaiError.message : String(openaiError) }, { status: 200 });
    }

    console.log("[analyze-reel-ai] OpenAI response received.");

    const rawContent = completion.choices[0]?.message?.content ?? "";
    console.log("[analyze-reel-ai] Parsed response:", rawContent);

    const parsed = extractJSON(rawContent);

    if (!parsed || typeof parsed !== "object") {
      console.error("[analyze-reel-ai] Failed to parse OpenAI response as JSON.");
      const fallback = fallbackAnalysis({ duration, fps, pace_score: paceScore, energy_score: energyScore, motion_intensity: motionIntensity, brightness_variance: brightnessVariance });
      return NextResponse.json({ ...fallback, _devRaw: rawContent }, { status: 200 });
    }

    const obj = parsed as Record<string, unknown>;

    const result: AIAnalysisResponse = {
      mood: typeof obj.mood === "string" ? obj.mood : "Energetic",
      editing_style: typeof obj.editing_style === "string" ? obj.editing_style : "Dynamic",
      content_type: typeof obj.content_type === "string" ? obj.content_type : "lifestyle",
      visual_intensity: typeof obj.visual_intensity === "number" ? Math.min(100, Math.max(0, obj.visual_intensity)) : 50,
      creator_niche: typeof obj.creator_niche === "string" ? obj.creator_niche : "creator",
      music_type: typeof obj.music_type === "string" ? obj.music_type : "Pop / Electronic",
      recommended_bpm_range: typeof obj.recommended_bpm_range === "string" ? obj.recommended_bpm_range : "115-130",
      reasoning: typeof obj.reasoning === "string" ? obj.reasoning : "Analysis unavailable.",
    };

    const responseBody: AIAnalysisResponse & Record<string, unknown> = { ...result };
    if (process.env.NODE_ENV === "development") {
      responseBody._devRaw = rawContent;
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("[analyze-reel-ai] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze reel with AI.",
        ...fallbackAnalysis({ duration: 0, fps: 0, pace_score: 0, energy_score: 0, motion_intensity: 0 }),
        _devError: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}