import type { ContentType, Movie } from "@prisma/client";

export type { ContentType };

/** Library filter tag — maps to one or more contentType values. */
export type LibraryFilterTag = {
  id: string;
  label: string;
  contentTypes: ContentType[];
};

/** Extensible tag list for the library sidebar (add Shorts, Docs via category later). */
export const LIBRARY_FILTER_TAGS: LibraryFilterTag[] = [
  { id: "AAJA", label: "Aaja", contentTypes: ["AAJA"] },
  { id: "FRESHERS", label: "Freshers", contentTypes: ["FRESHERS"] },
];

export function isAajaTitle(title: string): boolean {
  return /\baaja\b/i.test(title);
}

/**
 * Freshers orientation videos — "Freshers' Intro '25", "Freshers 2023", etc.
 */
export function isFreshersTitle(title: string): boolean {
  return /\bfreshers?\b/i.test(title);
}

/** Infer content type from raw YouTube title (Aaja wins over Freshers). */
export function inferContentTypeFromTitle(rawTitle: string): ContentType {
  if (isAajaTitle(rawTitle)) return "AAJA";
  if (isFreshersTitle(rawTitle)) return "FRESHERS";
  return "FILM";
}

export function getMovieContentType(movie: Pick<Movie, "contentType" | "title" | "isAajaFilm">): ContentType {
  if (movie.contentType && movie.contentType !== "FILM") return movie.contentType;
  if (movie.isAajaFilm || isAajaTitle(movie.title)) return "AAJA";
  if (isFreshersTitle(movie.title)) return "FRESHERS";
  return movie.contentType ?? "FILM";
}

/** Parse Freshers batch year from title ('24 → 2024, Freshers 2019 → 2019). */
export function freshersYearFromTitle(title: string): number | null {
  // "Freshers' Intro '25", "Freshers '24" — year is the last 'XX in the title
  const introApostrophe = title.match(/freshers[\s\S]*?[''′](\d{2})\b/i);
  if (introApostrophe) {
    const n = parseInt(introApostrophe[1]!, 10);
    return n >= 0 && n <= 30 ? 2000 + n : 1900 + n;
  }
  const four = title.match(/freshers?\s*(20\d{2})/i);
  if (four) return parseInt(four[1]!, 10);
  // "ft.2018 Batch" style
  const batch = title.match(/freshers[\s\S]*?\b(20\d{2})\b/i);
  if (batch) return parseInt(batch[1]!, 10);
  return null;
}

export function expectedFreshersYears(from = 2023, to = 2025): number[] {
  const years: number[] = [];
  for (let y = from; y <= to; y++) years.push(y);
  return years;
}

export function reportMissingFreshersYears(movies: Movie[]): number[] {
  const found = new Set<number>();
  for (const m of movies) {
    if (getMovieContentType(m) !== "FRESHERS") continue;
    const y = freshersYearFromTitle(m.title);
    if (y) found.add(y);
  }
  return expectedFreshersYears().filter((y) => !found.has(y));
}

export function filterMoviesByTags(movies: Movie[], activeTagIds: Set<string>): Movie[] {
  if (activeTagIds.size === 0) return movies;

  const allowed = new Set<ContentType>();
  for (const tag of LIBRARY_FILTER_TAGS) {
    if (activeTagIds.has(tag.id)) {
      for (const ct of tag.contentTypes) allowed.add(ct);
    }
  }

  return movies.filter((m) => allowed.has(getMovieContentType(m)));
}

export function contentTypeLabel(ct: ContentType): string {
  switch (ct) {
    case "AAJA":
      return "Aaja";
    case "FRESHERS":
      return "Freshers";
    default:
      return "Film";
  }
}
