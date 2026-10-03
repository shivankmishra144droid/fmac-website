import type { Movie } from "@prisma/client";
import { channelFilms } from "./channel-films";
import { EXTERNAL_FILMS, externalFilmToMovie } from "./external-films";

/**
 * Static film catalogue used when Postgres is unavailable (local dev without Docker).
 * Matches the seed defaults so Home hero and /library stay in sync offline.
 */
export const DEV_FILMS: Movie[] = [
  {
    id: "dev-portrait",
    slug: "portrait-of-my-grandfather",
    title: "Portrait of My Grandfather",
    tagline: "A slice-of-life drama about memory, family, and the stories we inherit.",
    description:
      "Portrait of My Grandfather. FMAC's 2026 slice-of-life short. A tender campus film about the quiet bond between generations, shot and edited entirely by students at BITS Goa.",
    synopsis:
      "Portrait of My Grandfather. FMAC's 2026 slice-of-life short. A tender campus film about the quiet bond between generations, shot and edited entirely by students at BITS Goa.",
    releaseYear: 2026,
    posterUrl: "https://img.youtube.com/vi/dJFUC_qrvyg/maxresdefault.jpg",
    thumbnailUrl: "https://img.youtube.com/vi/dJFUC_qrvyg/hqdefault.jpg",
    youtubeId: "dJFUC_qrvyg",
    youtubeUrl: "https://www.youtube.com/watch?v=dJFUC_qrvyg",
    publishedAt: new Date("2026-01-15"),
    category: "SHORT",
    runtimeSeconds: 583,
    format: "Digital · YouTube",
    crew: "Film Making Club, BITS Goa",
    isLatestRelease: false,
    isFmacSelect: true,
    isAajaFilm: false,
    contentType: "FILM",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "dev-bansuri",
    slug: "bansuri",
    title: "Bansuri",
    tagline: "Music, longing, and the spaces between notes.",
    description:
      "Bansuri, a 2024 FMAC original following the pull of melody across campus life. Written, directed, and produced by the Film Making Club, BITS Goa.",
    synopsis:
      "Bansuri, a 2024 FMAC original following the pull of melody across campus life. Written, directed, and produced by the Film Making Club, BITS Goa.",
    releaseYear: 2024,
    posterUrl: "https://img.youtube.com/vi/fyRWAgOiYwA/maxresdefault.jpg",
    thumbnailUrl: "https://img.youtube.com/vi/fyRWAgOiYwA/hqdefault.jpg",
    youtubeId: "fyRWAgOiYwA",
    youtubeUrl: "https://www.youtube.com/watch?v=fyRWAgOiYwA",
    publishedAt: new Date("2024-06-01"),
    category: "MOVIE",
    runtimeSeconds: 1794,
    format: "Digital · YouTube",
    crew: "Film Making Club, BITS Goa",
    isLatestRelease: false,
    isFmacSelect: false,
    isAajaFilm: false,
    contentType: "FILM",
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "dev-summer",
    slug: "summer",
    title: "summer",
    tagline: "Heat, restlessness, and the last days before everything changes.",
    description:
      "summer, a 2022 short from FMAC capturing Goa in slow motion: friendship, boredom, and the haze of vacation before the semester returns.",
    synopsis:
      "summer, a 2022 short from FMAC capturing Goa in slow motion: friendship, boredom, and the haze of vacation before the semester returns.",
    releaseYear: 2022,
    posterUrl: "https://img.youtube.com/vi/rECHXAmsubw/sddefault.jpg",
    thumbnailUrl: "https://img.youtube.com/vi/rECHXAmsubw/sddefault.jpg",
    youtubeId: "rECHXAmsubw",
    youtubeUrl: "https://www.youtube.com/watch?v=rECHXAmsubw",
    publishedAt: new Date("2022-08-01"),
    category: "SHORT",
    runtimeSeconds: 928,
    format: "Digital · YouTube",
    crew: "Film Making Club, BITS Goa",
    isLatestRelease: false,
    isFmacSelect: false,
    isAajaFilm: false,
    contentType: "FILM",
    createdAt: new Date("2022-08-01"),
    updatedAt: new Date("2022-08-01"),
  },
  {
    id: "dev-nishachar",
    slug: "nishachar",
    title: "Nishachar",
    tagline: "A FMAC original",
    description:
      "Nishachar, an original short from FMAC, the Film Making Club at BITS Goa. Written, directed, and produced by students. Runtime 11:57.",
    synopsis:
      "Nishachar, an original short from FMAC, the Film Making Club at BITS Goa. Written, directed, and produced by students. Runtime 11:57.",
    releaseYear: 2026,
    posterUrl: "https://img.youtube.com/vi/QqpWt_h96n0/maxresdefault.jpg",
    thumbnailUrl: "https://img.youtube.com/vi/QqpWt_h96n0/hqdefault.jpg",
    youtubeId: "QqpWt_h96n0",
    youtubeUrl: "https://www.youtube.com/watch?v=QqpWt_h96n0",
    publishedAt: new Date("2026-02-01"),
    category: "SHORT",
    runtimeSeconds: 717,
    format: "Digital · YouTube",
    crew: "Film Making Club, BITS Goa",
    isLatestRelease: false,
    isFmacSelect: false,
    isAajaFilm: false,
    contentType: "FILM",
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
  },
];

/**
 * Offline catalogue: the curated entries above plus every film from the committed channel dump.
 * Curated entries win when both describe the same YouTube video.
 */
function allDevFilms(): Movie[] {
  const channel = channelFilms();
  const byYoutubeId = new Map(channel.map((m) => [m.youtubeId, m]));
  // Curated copy, but placed at its real position in the upload order.
  const curated = DEV_FILMS.map((m) => {
    const match = m.youtubeId ? byYoutubeId.get(m.youtubeId) : undefined;
    return match ? { ...m, publishedAt: match.publishedAt } : m;
  });
  const curatedIds = new Set(DEV_FILMS.map((m) => m.youtubeId).filter(Boolean));
  const external: Movie[] = EXTERNAL_FILMS.map((f) => ({
    ...externalFilmToMovie(f),
    id: `ext-${f.youtubeId}`,
    createdAt: f.publishedAt,
    updatedAt: f.publishedAt,
  }));
  return [...curated, ...channel.filter((m) => !curatedIds.has(m.youtubeId)), ...external];
}

export function devFilms(category?: Movie["category"]): Movie[] {
  const films = allDevFilms().sort(
    (a, b) =>
      b.releaseYear - a.releaseYear ||
      (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
  );
  return category ? films.filter((m) => m.category === category) : films;
}

export function devFilmBySlug(slug: string): Movie | null {
  return allDevFilms().find((m) => m.slug === slug || m.id === slug) ?? null;
}

export function devLatestFilm(): Movie | null {
  return allDevFilms().find((m) => m.isLatestRelease) ?? DEV_FILMS[0] ?? null;
}
