import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ─── Types ──────────────────────────────────────────────────────── */

export interface ProfilePayload {
  user_id: string;
  full_name: string;
  instagram_handle?: string | null;
  instagram_url?: string | null;
  niche: string;
  follower_range: string;
}

export interface ProfileResponse {
  id?: string;
  user_id: string;
  full_name: string;
  instagram_handle?: string | null;
  instagram_url?: string | null;
  niche: string;
  follower_range: string;
}

/* ─── GET: fetch current user profile ───────────────────────────── */

export async function GET() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json(data as ProfileResponse, { status: 200 });
  } catch (error) {
    console.error("profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile." },
      { status: 500 }
    );
  }
}

/* ─── POST: create/update profile ────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<ProfilePayload>;

    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const instagramHandle = typeof body.instagram_handle === "string" ? body.instagram_handle.trim() : null;
    const instagramUrl = typeof body.instagram_url === "string" ? body.instagram_url.trim() : null;
    const niche = typeof body.niche === "string" ? body.niche.trim() : "";
    const followerRange = typeof body.follower_range === "string" ? body.follower_range.trim() : "";

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!niche) {
      return NextResponse.json({ error: "Niche is required." }, { status: 400 });
    }

    const payload: ProfilePayload = {
      user_id: user.id,
      full_name: fullName,
      instagram_handle: instagramHandle,
      instagram_url: instagramUrl,
      niche,
      follower_range: followerRange,
    };

    // Upsert profile by user_id
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("profile POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as ProfileResponse, { status: 200 });
  } catch (error) {
    console.error("profile POST error:", error);
    return NextResponse.json(
      { error: "Failed to save profile." },
      { status: 500 }
    );
  }
}