import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { filename } = await request.json();

  let niche = "motivation";

  if (
    filename.toLowerCase().includes("gym") ||
    filename.toLowerCase().includes("fitness")
  ) {
    niche = "fitness";
  }

  if (
    filename.toLowerCase().includes("travel") ||
    filename.toLowerCase().includes("trip")
  ) {
    niche = "travel";
  }

  return NextResponse.json({
    niche,
  });
}