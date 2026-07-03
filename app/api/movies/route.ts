import { NextResponse } from "next/server";
import type { MovieCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { movieCreateSchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";
import { devFilms } from "@/lib/dev-films";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as MovieCategory | null;

  try {
    const movies = await prisma.movie.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ releaseYear: "desc" }, { createdAt: "desc" }],
    });
    if (movies.length > 0) {
      return NextResponse.json({ movies });
    }
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ movies: devFilms(category ?? undefined), source: "dev-fallback" });
    }
    return NextResponse.json({ movies });
  } catch {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ movies: devFilms(category ?? undefined), source: "dev-fallback" });
    }
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = movieCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const slugBase = data.slug ?? slugify(data.title);
  let slug = slugBase || "film";
  const existingSlug = await prisma.movie.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const movie = await prisma.$transaction(async (tx) => {
    if (data.isLatestRelease) {
      await tx.movie.updateMany({
        where: { isLatestRelease: true },
        data: { isLatestRelease: false },
      });
    }
    return tx.movie.create({ data: { ...data, slug } });
  });

  return NextResponse.json({ movie }, { status: 201 });
}
