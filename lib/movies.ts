import { prisma } from "./prisma";
import type { Movie, MovieCategory } from "@prisma/client";
import {
  devFilms,
  devFilmBySlug,
  devLatestFilm,
} from "./dev-films";

export type { Movie, MovieCategory };

const useDevFallback = process.env.NODE_ENV !== "production";

async function withDbFallback<T>(query: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await query();
  } catch (err) {
    if (useDevFallback) {
      console.warn("[movies] Database unavailable — using dev fallback catalogue.", err);
      return fallback();
    }
    throw err;
  }
}

export async function getLatestMovie(): Promise<Movie | null> {
  return withDbFallback(
    async () => {
      const flagged = await prisma.movie.findFirst({
        where: { isLatestRelease: true },
        orderBy: { releaseYear: "desc" },
      });
      if (flagged) return flagged;
      return await prisma.movie.findFirst({
        orderBy: [{ releaseYear: "desc" }, { createdAt: "desc" }],
      });
    },
    () => devLatestFilm()
  );
}

export async function listMovies(category?: MovieCategory): Promise<Movie[]> {
  return withDbFallback(
    async () => {
      const rows = await prisma.movie.findMany({
        where: category ? { category } : undefined,
        orderBy: [{ publishedAt: "desc" }, { releaseYear: "desc" }],
      });
      if (rows.length === 0 && useDevFallback) {
        console.warn("[movies] Database connected but empty — using dev fallback catalogue.");
        return devFilms(category);
      }
      return rows;
    },
    () => devFilms(category)
  );
}

export async function listMoviesForLibrary(): Promise<Movie[]> {
  return withDbFallback(
    async () => {
      const rows = await prisma.movie.findMany({
        where: { youtubeId: { not: null } },
        orderBy: { publishedAt: "asc" },
      });
      if (rows.length === 0 && useDevFallback) return devFilms();
      return rows;
    },
    () => devFilms()
  );
}

export async function getMovieBySlug(slug: string): Promise<Movie | null> {
  return withDbFallback(
    () => prisma.movie.findUnique({ where: { slug } }),
    () => devFilmBySlug(slug)
  );
}

export async function getMovie(idOrSlug: string): Promise<Movie | null> {
  return withDbFallback(
    async () => {
      const bySlug = await prisma.movie.findUnique({ where: { slug: idOrSlug } });
      if (bySlug) return bySlug;
      return await prisma.movie.findUnique({ where: { id: idOrSlug } });
    },
    () => devFilmBySlug(idOrSlug)
  );
}

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const count = await prisma.movie.count();
    return count > 0;
  } catch {
    return false;
  }
}
