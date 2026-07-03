import type { Movie } from "@prisma/client";
import { getMovieContentType } from "./content-type";
import { getMoviePublishedAt } from "./tenure";

/** URL slug for a library browse category (excludes "all"). */
export type LibraryCategorySlug = "aaja" | "freshers" | "documentary" | "music-video";

export type LibraryCategory = {
  slug: LibraryCategorySlug;
  label: string;
  /** Short label for compact UI */
  shortLabel: string;
};

/** Primary library browse categories — extend this list to add new sections. */
export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  { slug: "aaja", label: "Aaja", shortLabel: "AAJA" },
  { slug: "freshers", label: "Freshers", shortLabel: "FRESHERS" },
  { slug: "documentary", label: "Documentary", shortLabel: "DOCUMENTARY" },
  { slug: "music-video", label: "Music Video", shortLabel: "MUSIC VIDEO" },
];

const SLUG_SET = new Set<string>(LIBRARY_CATEGORIES.map((c) => c.slug));

export function parseCategorySlug(param: string | null | undefined): LibraryCategorySlug | null {
  if (!param) return null;
  const normalized = param.toLowerCase().trim();
  return SLUG_SET.has(normalized) ? (normalized as LibraryCategorySlug) : null;
}

export function getCategoryBySlug(slug: LibraryCategorySlug): LibraryCategory {
  return LIBRARY_CATEGORIES.find((c) => c.slug === slug)!;
}

/** Known FMAC music videos identified by title (extend as new ones are released). */
const CURATED_MUSIC_VIDEO_TITLE_PREFIXES = ["sorry", "exit"] as const;

export function isMusicVideoTitle(title: string): boolean {
  const t = title.toLowerCase().trim();
  if (
    /\bmusic\s*video\b/.test(t) ||
    /\brap\s+music\s+video\b/.test(t) ||
    /\bofficial\s+video\b/.test(t) ||
    /\btheme\s+track\b/.test(t)
  ) {
    return true;
  }
  return CURATED_MUSIC_VIDEO_TITLE_PREFIXES.some(
    (key) => t === key || t.startsWith(`${key} `) || t.startsWith(`${key}-`)
  );
}

export function movieMatchesCategory(
  movie: Movie,
  slug: LibraryCategorySlug
): boolean {
  switch (slug) {
    case "aaja":
      return getMovieContentType(movie) === "AAJA";
    case "freshers":
      return getMovieContentType(movie) === "FRESHERS";
    case "documentary":
      return movie.category === "DOCUMENTARY" || /\bdocumentary\b/i.test(movie.title);
    case "music-video":
      return isMusicVideoTitle(movie.title);
    default:
      return false;
  }
}

export function filterMoviesByCategory(movies: Movie[], slug: LibraryCategorySlug): Movie[] {
  return movies
    .filter((m) => movieMatchesCategory(m, slug))
    .sort(
      (a, b) =>
        (getMoviePublishedAt(b)?.getTime() ?? 0) - (getMoviePublishedAt(a)?.getTime() ?? 0)
    );
}

export function countMoviesByCategory(
  movies: Movie[]
): Record<LibraryCategorySlug, number> {
  const counts = {} as Record<LibraryCategorySlug, number>;
  for (const cat of LIBRARY_CATEGORIES) {
    counts[cat.slug] = movies.filter((m) => movieMatchesCategory(m, cat.slug)).length;
  }
  return counts;
}
