import { NextResponse } from "next/server";
import { getLatestMovie } from "@/lib/movies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/movies/latest — the movie powering the hero.
export async function GET() {
  const movie = await getLatestMovie();
  if (!movie) {
    return NextResponse.json({ movie: null }, { status: 200 });
  }
  return NextResponse.json({ movie });
}
