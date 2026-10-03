import { prisma } from "./prisma";
import type { Movie, MovieCategory } from "@prisma/client";
import {
  devFilms,
  devFilmBySlug,
  devLatestFilm,
} from "./dev-films";
import { PINNED_LATEST, externalMovies } from "./external-films";
import { upsertExternalFilms } from "./external-films-db";

export type { Movie, MovieCategory };

/** Offline catalogue when Postgres is unreachable: always in dev; in production only when opted in (local audits). */
const useDevFallback =
  process.env.NODE_ENV !== "production" || process.env.FMAC_OFFLINE_CATALOGUE === "1";

/**
 * Once per server process, write the external films (lib/external-films.ts) into the DB and
 * apply the pinned latest release — so a deploy fixes the database without a manual script.
 * Failures are logged and not retried; `withExternalFilms` still covers reads.
 */
let externalSync: Promise<void> | null = null;
function syncExternalFilmsOnce(): Promise<void> {
  externalSync ??= upsertExternalFilms(prisma).catch((err) => {
    console.warn("[movies] Could not sync external films into the database.", err);
  });
  return externalSync;
}

/**
 * Read-time safety net: add external films missing from `rows` and make the pinned
 * film the only latest release, whatever the database says.
 */
function withExternalFilms(rows: Movie[]): Movie[] {
  const have = new Set(rows.map((m) => m.youtubeId).filter(Boolean));
  const merged = [...rows, ...externalMovies().filter((m) => !have.has(m.youtubeId))];
  const pinnedId = PINNED_LATEST?.youtubeId;
  if (!pinnedId) return merged;
  return merged.map((m) => ({ ...m, isLatestRelease: m.youtubeId === pinnedId }));
}

/**
 * Short-lived in-memory cache for catalogue reads (production only), so most page views skip
 * Postgres entirely. Admin writes call `invalidateMovieCache()`; anything else ages out.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

export function invalidateMovieCache() {
  cache.clear();
}

async function withDbFallback<T>(key: string, query: () => Promise<T>, fallback: () => T): Promise<T> {
  if (process.env.NODE_ENV !== "production") return runQuery(query, fallback);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as Promise<T>;
  const value = runQuery(query, fallback);
  cache.set(key, { at: Date.now(), value });
  // Never keep a failure around.
  value.catch(() => cache.delete(key));
  return value;
}

async function runQuery<T>(query: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    await syncExternalFilmsOnce();
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
    "latest",
    async () => {
      if (PINNED_LATEST) {
        const pinned = await prisma.movie.findUnique({ where: { youtubeId: PINNED_LATEST.youtubeId } });
        return withExternalFilms(pinned ? [pinned] : []).find((m) => m.isLatestRelease) ?? null;
      }
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
    `list:${category ?? "all"}`,
    async () => {
      const rows = await prisma.movie.findMany({
        where: category ? { category } : undefined,
        orderBy: [{ publishedAt: "desc" }, { releaseYear: "desc" }],
      });
      if (rows.length === 0 && useDevFallback) {
        console.warn("[movies] Database connected but empty — using dev fallback catalogue.");
        return devFilms(category);
      }
      return withExternalFilms(rows).filter((m) => !category || m.category === category);
    },
    () => devFilms(category)
  );
}

export async function listMoviesForLibrary(): Promise<Movie[]> {
  return withDbFallback(
    "library",
    async () => {
      const rows = await prisma.movie.findMany({
        where: { youtubeId: { not: null } },
        orderBy: { publishedAt: "asc" },
      });
      if (rows.length === 0 && useDevFallback) return devFilms();
      return withExternalFilms(rows);
    },
    () => devFilms()
  );
}

/** Oldest release the home filmstrip will show — older films live in the library only. */
const FILMSTRIP_FROM_YEAR = 2024;

/**
 * Home filmstrip — the latest `limit` films from FILMSTRIP_FROM_YEAR on, oldest → newest.
 * Only films with a YouTube id (needed for thumbs + hover preview).
 */
export async function listFilmstripMovies(limit = 10): Promise<Movie[]> {
  // Year first (curated years can differ from upload order), then upload order within a year.
  const chronological = (a: Movie, b: Movie) =>
    a.releaseYear - b.releaseYear ||
    (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0) ||
    a.createdAt.getTime() - b.createdAt.getTime();

  const fallback = () =>
    devFilms()
      .filter(
        (m) => m.youtubeId && m.contentType === "FILM" && m.releaseYear >= FILMSTRIP_FROM_YEAR
      )
      .sort(chronological)
      .slice(-limit);

  return withDbFallback(
    `strip:${limit}`,
    async () => {
      const rows = await prisma.movie.findMany({
        where: {
          youtubeId: { not: null },
          contentType: "FILM",
          releaseYear: { gte: FILMSTRIP_FROM_YEAR },
        },
        orderBy: [{ releaseYear: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
      });
      if (rows.length === 0 && useDevFallback) return fallback();
      return withExternalFilms(rows)
        .filter((m) => m.releaseYear >= FILMSTRIP_FROM_YEAR)
        .sort(chronological)
        .slice(-limit);
    },
    fallback
  );
}

export async function getMovieBySlug(slug: string): Promise<Movie | null> {
  return withDbFallback(
    `slug:${slug}`,
    async () =>
      (await prisma.movie.findUnique({ where: { slug } })) ??
      externalMovies().find((m) => m.slug === slug) ??
      null,
    () => devFilmBySlug(slug)
  );
}

export async function getMovie(idOrSlug: string): Promise<Movie | null> {
  return withDbFallback(
    `movie:${idOrSlug}`,
    async () => {
      const bySlug = await prisma.movie.findUnique({ where: { slug: idOrSlug } });
      if (bySlug) return withExternalFilms([bySlug])[0]!;
      const byId = await prisma.movie.findUnique({ where: { id: idOrSlug } });
      if (byId) return withExternalFilms([byId])[0]!;
      return externalMovies().find((m) => m.slug === idOrSlug || m.id === idOrSlug) ?? null;
    },
    () => devFilmBySlug(idOrSlug)
  );
}

/** Is Postgres reachable, and does it hold films? Cached with the catalogue (drives the library's status note). */
export async function getCatalogueStatus(): Promise<{ connected: boolean; seeded: boolean }> {
  const offline = { connected: false, seeded: false };
  return withDbFallback(
    "status",
    async () => ({ connected: true, seeded: (await prisma.movie.count()) > 0 }),
    () => offline
  ).catch(() => offline);
}

/** Lower-cased titles of films that have an achievement (cached; empty when the DB is down). */
export async function listAwardTitles(): Promise<string[]> {
  return withDbFallback(
    "award-titles",
    async () => {
      const rows = await prisma.achievement.findMany({
        where: { movieTitle: { not: null } },
        select: { movieTitle: true },
      });
      return rows.map((a) => a.movieTitle!.toLowerCase());
    },
    () => []
  ).catch(() => []);
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
