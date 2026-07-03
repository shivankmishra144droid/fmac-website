import { MovieCategory } from "@prisma/client";
import { inferContentTypeFromTitle } from "./content-type";

const YT_ID_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/** Pull an 11-char YouTube video id from any common URL shape. */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(YT_ID_RE);
  return match?.[1] ?? null;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}

/** Canonical YouTube CDN thumbnail (always img.youtube.com — API webp/maxres links often 404). */
export type YoutubeThumbQuality = "max" | "sd" | "hq";

export function youtubeThumbnail(id: string, quality: YoutubeThumbQuality = "hq"): string {
  const file =
    quality === "max" ? "maxresdefault" : quality === "sd" ? "sddefault" : "hqdefault";
  return `https://img.youtube.com/vi/${id}/${file}.jpg`;
}

type MovieThumbFields = {
  youtubeId?: string | null;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
};

/** Landscape library cards — sddefault (640×480) exists on virtually all uploads. */
export function movieCardThumbnail(movie: MovieThumbFields): string | null {
  if (movie.youtubeId) return youtubeThumbnail(movie.youtubeId, "sd");
  return movie.thumbnailUrl ?? movie.posterUrl ?? null;
}

/** Hero / detail poster — prefer sddefault for reliability over API maxres webp. */
export function moviePosterUrl(movie: MovieThumbFields): string | null {
  if (movie.youtubeId) return youtubeThumbnail(movie.youtubeId, "sd");
  return movie.posterUrl ?? movie.thumbnailUrl ?? null;
}

/** True when a stored URL is a known-bad YouTube API thumbnail pattern. */
export function isBrokenYoutubeThumbnail(url: string | null | undefined): boolean {
  if (!url) return false;
  return /vi_webp\/|maxresdefault\.webp/i.test(url);
}

export function formatRuntime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m} min`;
}

/** Parse festival years like Spree '26 → 2026, Waves '23 → 2023. */
export function inferReleaseYear(title: string, fallback = 2024): number {
  const four = title.match(/\b(20\d{2})\b/);
  if (four) return parseInt(four[1]!, 10);
  const two = title.match(/[''](\d{2})\b/);
  if (two) {
    const n = parseInt(two[1]!, 10);
    return n >= 0 && n <= 30 ? 2000 + n : 1900 + n;
  }
  return fallback;
}

/** Strip channel suffixes and festival tags for a cleaner on-site title. */
export function cleanMovieTitle(raw: string): string {
  return raw
    .replace(/\s*\|\s*FMa?C.*$/i, "")
    .replace(/\s*\|\s*Filmmaking Club BITS Goa.*$/i, "")
    .replace(/\s*\|\s*Spree\s*['']?\d{2}.*$/i, "")
    .replace(/\s*\|\s*Waves\s*['']?\d{2}.*$/i, "")
    .replace(/\s*\|\s*Quark\s*['']?\d{2}.*$/i, "")
    .replace(/\s*\|\s*Zephyr.*$/i, "")
    .replace(/\s*\|\s*Short Film.*$/i, "")
    .replace(/\s*-\s*Slice of Life.*$/i, "")
    .trim();
}

export function inferCategory(title: string, runtimeSeconds?: number): MovieCategory {
  const t = title.toLowerCase();
  if (t.includes("documentary")) return "DOCUMENTARY";
  if (
    t.includes("experimental") ||
    t.includes("avant") ||
    t.includes("abstract")
  )
    return "EXPERIMENTAL";
  if (
    t.includes("orientation") ||
    t.includes("freshers") ||
    t.includes("aaja") ||
    t.includes("induction") ||
    t.includes("trailer") ||
    t.includes("promo") ||
    t.includes("theme track") ||
    t.includes("curtain raiser") ||
    t.includes("coming soon")
  )
    return "MOVIE";
  if (runtimeSeconds && runtimeSeconds >= 1500) return "MOVIE";
  return "SHORT";
}

export function shouldSeedVideo(title: string, category: MovieCategory): boolean {
  const t = title.toLowerCase();
  if (/\baaja\b/i.test(t)) return true;
  if (/\bfreshers?\b/i.test(t)) return true;
  if (t.includes("trailer") && !t.includes("short film")) return false;
  if (t.includes("promo")) return false;
  if (t.includes("theme track")) return false;
  if (t.includes("treasure hunt")) return false;
  if (t.includes(" - trailer")) return false;
  if (
    t.includes("orientation") ||
    t.includes("freshers") ||
    t.includes("aaja") ||
    t.includes("induction")
  )
    return false;
  return true;
}

export function buildMovieDescription(
  title: string,
  category: MovieCategory,
  runtimeSeconds?: number
): string {
  const runtime = runtimeSeconds ? formatRuntime(runtimeSeconds) : null;
  const base = cleanMovieTitle(title);
  switch (category) {
    case "DOCUMENTARY":
      return `${base} — a documentary from the Film Making Club, BITS Goa. Shot and edited by student filmmakers on campus.${runtime ? ` Runtime ${runtime}.` : ""}`;
    case "EXPERIMENTAL":
      return `${base} — an experimental film from FMAC exploring form, texture, and student vision.${runtime ? ` Runtime ${runtime}.` : ""}`;
    case "MOVIE":
      return `${base} — a feature-length student film from the Film Making Club, BITS Goa.${runtime ? ` Runtime ${runtime}.` : ""}`;
    case "SHORT":
    default:
      return `${base} — an original short from FMAC, the Film Making Club at BITS Goa. Written, directed, and produced by students.${runtime ? ` Runtime ${runtime}.` : ""}`;
  }
}

export type ChannelVideo = {
  id: string;
  title: string;
  url: string;
  duration?: number;
  duration_string?: string;
};

/** Parse yt-dlp --dump-json lines (ignores warning lines). */
export function parseYtDlpJsonl(raw: string): ChannelVideo[] {
  const out: ChannelVideo[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const j = JSON.parse(trimmed) as {
        id?: string;
        title?: string;
        url?: string;
        webpage_url?: string;
        duration?: number;
        duration_string?: string;
      };
      if (j.id && j.title) {
        out.push({
          id: j.id,
          title: j.title,
          url: j.webpage_url ?? j.url ?? youtubeWatchUrl(j.id),
          duration: j.duration,
          duration_string: j.duration_string,
        });
      }
    } catch {
      /* skip malformed lines */
    }
  }
  return out;
}

/** User-curated metadata overrides (correct release years, hero flag, copy). */
export type PriorityFilmOverride = {
  /** Lowercase key used to match channel titles (e.g. "portrait of my grandfather"). */
  matchKey: string;
  displayTitle: string;
  releaseYear: number;
  category?: MovieCategory;
  isLatestRelease?: boolean;
  tagline?: string;
  description?: string;
  isFmacSelect?: boolean;
};

export const PRIORITY_FILM_OVERRIDES: PriorityFilmOverride[] = [
  {
    matchKey: "portrait of my grandfather",
    displayTitle: "Portrait of My Grandfather",
    releaseYear: 2026,
    category: "SHORT",
    isLatestRelease: true,
    isFmacSelect: true,
    tagline: "A slice-of-life drama about memory, family, and the stories we inherit.",
    description:
      "Portrait of My Grandfather — FMAC's 2026 slice-of-life short. A tender campus film about the quiet bond between generations, shot and edited entirely by students at BITS Goa.",
  },
  {
    matchKey: "bansuri",
    displayTitle: "Bansuri",
    releaseYear: 2024,
    category: "MOVIE",
    tagline: "Music, longing, and the spaces between notes.",
    description:
      "Bansuri — a 2024 FMAC original following the pull of melody across campus life. Written, directed, and produced by the Film Making Club, BITS Goa.",
  },
  {
    matchKey: "summer",
    displayTitle: "summer",
    releaseYear: 2022,
    category: "SHORT",
    tagline: "Heat, restlessness, and the last days before everything changes.",
    description:
      "summer — a 2022 short from FMAC capturing Goa in slow motion: friendship, boredom, and the haze of vacation before the semester returns.",
  },
];

/** Find a channel video by title key, skipping promos/trailers. */
export function findChannelVideo(
  videos: ChannelVideo[],
  matchKey: string
): ChannelVideo | null {
  const k = matchKey.toLowerCase();
  const candidates = videos.filter((v) => {
    if (!shouldSeedVideo(v.title, inferCategory(v.title, v.duration))) return false;
    const cleaned = cleanMovieTitle(v.title).toLowerCase();
    const raw = v.title.toLowerCase();
    return (
      cleaned === k ||
      cleaned.startsWith(`${k} `) ||
      (raw.includes(k) && !raw.includes("trailer") && !raw.includes("self portrait"))
    );
  });
  return (
    candidates.find((v) => cleanMovieTitle(v.title).toLowerCase() === k) ??
    candidates[0] ??
    null
  );
}

export function channelVideoToMovie(v: ChannelVideo, index: number) {
  const category = inferCategory(v.title, v.duration);
  if (!shouldSeedVideo(v.title, category)) return null;

  const title = cleanMovieTitle(v.title) || v.title;
  const releaseYear = inferReleaseYear(v.title, 2024 - Math.min(index, 8));
  const isFmacSelect =
    /jiff|ifp|award|nominated/i.test(v.title) ||
    ["Rakshasa", "Zeher", "Nishachar"].some((n) =>
      title.toLowerCase().includes(n.toLowerCase())
    );
  const isAaja = /\baaja\b/i.test(v.title);
  const contentType = inferContentTypeFromTitle(v.title);

  return {
    title,
    tagline: isAaja
      ? "Flagship orientation film"
      : contentType === "FRESHERS"
        ? "Freshers orientation film"
        : category === "DOCUMENTARY"
          ? "Campus documentary"
          : "A FMAC original",
    description: buildMovieDescription(v.title, category, v.duration),
    releaseYear,
    youtubeId: v.id,
    youtubeUrl: v.url,
    posterUrl: youtubeThumbnail(v.id, "sd"),
    category,
    contentType,
    runtimeSeconds: v.duration ? Math.round(v.duration) : null,
    format: "Digital · YouTube",
    crew: "Film Making Club, BITS Goa",
    isLatestRelease: false,
    isFmacSelect,
    isAajaFilm: isAaja,
  };
}

/** Build seed row from a priority override + optional matched YouTube video. */
export function priorityOverrideToMovie(
  override: PriorityFilmOverride,
  video: ChannelVideo | null
) {
  const category = override.category ?? (video ? inferCategory(video.title, video.duration) : "SHORT");
  return {
    title: override.displayTitle,
    tagline: override.tagline ?? "A FMAC original",
    description:
      override.description ??
      buildMovieDescription(override.displayTitle, category, video?.duration),
    releaseYear: override.releaseYear,
    youtubeId: video?.id ?? null,
    youtubeUrl: video?.url ?? null,
    posterUrl: video ? youtubeThumbnail(video.id, "sd") : null,
    category,
    runtimeSeconds: video?.duration ? Math.round(video.duration) : null,
    format: "Digital · YouTube",
    crew: "Film Making Club, BITS Goa",
    isLatestRelease: override.isLatestRelease ?? false,
    isFmacSelect: override.isFmacSelect ?? false,
  };
}
