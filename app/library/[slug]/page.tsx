import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FilmDetail } from "@/components/library/FilmDetail";
import { getMovie, listAwardTitles, listMovies } from "@/lib/movies";
import { withMedia } from "@/lib/film-media";

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

  const awardWinner = (await listAwardTitles()).includes(movie.title.toLowerCase());

  // Nearest films in time (same year first), excluding this one.
  const all = await listMovies();
  const related = all
    .filter((m) => m.id !== movie.id && m.youtubeId)
    .sort(
      (a, b) =>
        Math.abs(a.releaseYear - movie.releaseYear) - Math.abs(b.releaseYear - movie.releaseYear)
    )
    .slice(0, 8);

  return <FilmDetail movie={movie} awardWinner={awardWinner} related={await withMedia(related)} />;
}
