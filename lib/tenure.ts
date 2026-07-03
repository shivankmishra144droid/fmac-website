import type { Movie } from "@prisma/client";
import { getMovieContentType, isAajaTitle } from "./content-type";

export type TenureGroup = {
  /** e.g. "2025-2026" */
  label: string;
  /** Academic start year parsed from the Aaja marker title */
  startYear: number;
  /** Header label e.g. "2025-2026" */
  displayLabel: string;
  /** The Aaja film that opens this tenure (leftmost in the row) */
  aajaFilm: Movie | null;
  films: Movie[];
};

/** True when the film is (or should be treated as) an Aaja tenure marker. */
export function isAajaFilm(movie: Movie): boolean {
  return getMovieContentType(movie) === "AAJA";
}

/** Parse the academic start year from an Aaja title or its publish date. */
export function aajaStartYear(title: string, publishedAt: Date): number {
  const apostrophe = title.match(/aaja\s*[''′](\d{2})\b/i);
  if (apostrophe) {
    const n = parseInt(apostrophe[1]!, 10);
    return n >= 0 && n <= 30 ? 2000 + n : 1900 + n;
  }

  const fourDigit = title.match(/aaja\s*(20\d{2})/i);
  if (fourDigit) return parseInt(fourDigit[1]!, 10);

  const yearInTitle = title.match(/\b(20\d{2})\b/);
  if (yearInTitle) return parseInt(yearInTitle[1]!, 10);

  return publishedAt.getFullYear();
}

/** Format academic year range: 2022 → "2022-2023" */
export function formatTenureLabel(startYear: number): string {
  return `${startYear}-${startYear + 1}`;
}

export function getMoviePublishedAt(movie: Movie): Date | null {
  if (movie.publishedAt) return new Date(movie.publishedAt);
  if (movie.releaseYear) return new Date(`${movie.releaseYear}-07-01T12:00:00.000Z`);
  return null;
}

/**
 * Row order: Aaja marker first (leftmost), then remaining films newest-first.
 */
export function sortFilmsForTenureRow(films: Movie[], aajaFilm: Movie | null): Movie[] {
  if (!aajaFilm) {
    return [...films].sort(
      (a, b) =>
        (getMoviePublishedAt(b)?.getTime() ?? 0) - (getMoviePublishedAt(a)?.getTime() ?? 0)
    );
  }
  const aajaId = aajaFilm.id;
  const rest = films.filter((f) => f.id !== aajaId);
  rest.sort(
    (a, b) =>
      (getMoviePublishedAt(b)?.getTime() ?? 0) - (getMoviePublishedAt(a)?.getTime() ?? 0)
  );
  return [aajaFilm, ...rest];
}

type DatedMovie = { movie: Movie; publishedAt: Date };

function datedMovies(movies: Movie[]): DatedMovie[] {
  return movies
    .map((movie) => {
      const publishedAt = getMoviePublishedAt(movie);
      return publishedAt ? { movie, publishedAt } : null;
    })
    .filter((row): row is DatedMovie => row !== null)
    .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
}

/**
 * Group films into tenures bounded by Aaja orientation releases.
 * Each tenure starts at an Aaja publish date (inclusive) and ends before the next Aaja.
 */
export function groupMoviesByTenure(movies: Movie[]): TenureGroup[] {
  const dated = datedMovies(movies);
  const datedIds = new Set(dated.map((d) => d.movie.id));

  const aajaMarkers = dated
    .filter(({ movie }) => isAajaFilm(movie))
    .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());

  const groups: TenureGroup[] = [];

  if (aajaMarkers.length === 0) {
    if (typeof console !== "undefined") {
      console.warn(
        "[tenure] No Aaja films found — sync may have skipped orientation titles. Run npm run sync:youtube."
      );
    }
    const all = sortFilmsForTenureRow(
      movies.filter((m) => datedIds.has(m.id)),
      null
    );
    if (all.length > 0) {
      groups.push({
        label: "archive",
        startYear: 0,
        displayLabel: "CATALOGUE",
        aajaFilm: null,
        films: all,
      });
    }
  } else {
    const firstAajaTime = aajaMarkers[0]!.publishedAt.getTime();
    const preTenure = dated
      .filter(({ publishedAt }) => publishedAt.getTime() < firstAajaTime)
      .map(({ movie }) => movie);

    if (preTenure.length > 0) {
      if (typeof console !== "undefined") {
        console.warn(
          `[tenure] ${preTenure.length} film(s) published before earliest Aaja — grouped as Founding Years`
        );
      }
      groups.push({
        label: "founding",
        startYear: 0,
        displayLabel: "FOUNDING YEARS",
        aajaFilm: null,
        films: sortFilmsForTenureRow(preTenure, null),
      });
    }

    for (let i = 0; i < aajaMarkers.length; i++) {
      const marker = aajaMarkers[i]!;
      const windowStart = marker.publishedAt.getTime();
      const windowEnd = aajaMarkers[i + 1]?.publishedAt.getTime() ?? Number.POSITIVE_INFINITY;

      const films = dated
        .filter(
          ({ publishedAt }) =>
            publishedAt.getTime() >= windowStart && publishedAt.getTime() < windowEnd
        )
        .map(({ movie }) => movie);

      const startYear = aajaStartYear(marker.movie.title, marker.publishedAt);
      groups.push({
        label: formatTenureLabel(startYear),
        startYear,
        displayLabel: formatTenureLabel(startYear),
        aajaFilm: marker.movie,
        films: sortFilmsForTenureRow(films, marker.movie),
      });
    }
  }

  const undated = movies.filter((m) => !datedIds.has(m.id));
  if (undated.length > 0) {
    groups.push({
      label: "undated",
      startYear: -1,
      displayLabel: "UNDATED",
      aajaFilm: null,
      films: sortFilmsForTenureRow(undated, null),
    });
  }

  return groups.reverse();
}

/** Keep founding years + tenures from 2022–23 onward. */
export function filterTenuresFrom2022(groups: TenureGroup[]): TenureGroup[] {
  return groups.filter((g) => g.startYear === 0 || g.startYear >= 2022 || g.startYear === -1);
}

export function findTenureForMovie(
  movie: Movie,
  groups: TenureGroup[]
): TenureGroup | null {
  return groups.find((g) => g.films.some((f) => f.id === movie.id)) ?? null;
}

export function validateTenureGrouping(
  movies: Movie[],
  groups: TenureGroup[]
): { ok: boolean; missing: string[]; duplicates: string[] } {
  const inputIds = new Set(movies.map((m) => m.id));
  const seen = new Map<string, number>();
  for (const g of groups) {
    for (const f of g.films) {
      seen.set(f.id, (seen.get(f.id) ?? 0) + 1);
    }
  }
  const missing = [...inputIds].filter((id) => !seen.has(id));
  const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  return { ok: missing.length === 0 && duplicates.length === 0, missing, duplicates };
}

/** Expected Aaja academic start years for coverage reporting (2022 → 2022–23, etc.). */
export function expectedAajaStartYears(from = 2022, to = 2026): number[] {
  const years: number[] = [];
  for (let y = from; y <= to; y++) years.push(y);
  return years;
}

export function reportMissingAajaMarkers(movies: Movie[]): number[] {
  const found = new Set<number>();
  for (const m of movies) {
    if (!isAajaFilm(m)) continue;
    const pub = getMoviePublishedAt(m);
    if (!pub) continue;
    found.add(aajaStartYear(m.title, pub));
  }
  return expectedAajaStartYears().filter((y) => !found.has(y));
}
