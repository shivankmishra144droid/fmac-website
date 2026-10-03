import type { MovieCategory } from "@prisma/client";
import { youtubeThumbnail, youtubeWatchUrl } from "./youtube";

/**
 * FMAC films published on other channels (collaborations), so `sync:youtube` never sees them.
 * Seeded by `npm run db:seed` and `npm run films:external`; also part of the offline catalogue.
 */
export type ExternalFilm = {
  youtubeId: string;
  title: string;
  slug: string;
  tagline: string;
  synopsis: string;
  /** Upload date — drives tenure grouping and chronological order. */
  publishedAt: Date;
  releaseYear: number;
  runtimeSeconds: number;
  category: MovieCategory;
  crew: string;
  isLatestRelease?: boolean;
};

export const EXTERNAL_FILMS: ExternalFilm[] = [
  {
    youtubeId: "wPjtR15yDME",
    title: "3rd ACT",
    slug: "3rd-act",
    tagline: "FMAC in association with LIT3House Productions.",
    // Credits as printed on the official poster.
    synopsis:
      "FMAC, in association with LIT3House Productions, presents 3rd ACT, a film by Dhruv Pandey, Narendra Naik and Ryan Karungo, starring Yash Singh, Arjun Gautam and Avan Karungo. Cinematography by Narendra and Dhruv, music by Ishaan Semwal.",
    publishedAt: new Date("2026-09-30T00:00:00Z"),
    releaseYear: 2026,
    runtimeSeconds: 1813,
    category: "SHORT",
    crew: "Dhruv Pandey, Narendra Naik & Ryan Karungo",
    isLatestRelease: true,
  },
];

/** Movie fields for an external film (shared by seed, the external-films script and the offline catalogue). */
export function externalFilmToMovie(f: ExternalFilm) {
  return {
    title: f.title,
    slug: f.slug,
    tagline: f.tagline,
    description: f.synopsis,
    synopsis: f.synopsis,
    releaseYear: f.releaseYear,
    posterUrl: youtubeThumbnail(f.youtubeId, "sd"),
    thumbnailUrl: youtubeThumbnail(f.youtubeId, "hq"),
    youtubeId: f.youtubeId,
    youtubeUrl: youtubeWatchUrl(f.youtubeId),
    publishedAt: f.publishedAt,
    category: f.category,
    contentType: "FILM" as const,
    runtimeSeconds: f.runtimeSeconds,
    format: "Digital · YouTube",
    crew: f.crew,
    isLatestRelease: Boolean(f.isLatestRelease),
    isFmacSelect: false,
    isAajaFilm: false,
  };
}
