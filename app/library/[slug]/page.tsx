import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FilmDetail } from "@/components/library/FilmDetail";
import { getMovie } from "@/lib/movies";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const movie = await getMovie(params.slug);
  if (!movie) return { title: "Film not found" };
  return {
    title: movie.title,
    description: movie.synopsis ?? movie.tagline ?? undefined,
  };
}

export default async function LibraryFilmPage({
  params,
}: {
  params: { slug: string };
}) {
  const movie = await getMovie(params.slug);
  if (!movie) notFound();

  let awardWinner = false;
  try {
    const achievement = await prisma.achievement.findFirst({
      where: { movieTitle: { equals: movie.title, mode: "insensitive" } },
    });
    awardWinner = Boolean(achievement);
  } catch {
    /* db unavailable */
  }

  return <FilmDetail movie={movie} awardWinner={awardWinner} />;
}
