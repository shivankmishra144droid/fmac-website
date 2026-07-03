import type { MovieCategory, ContentType } from "@prisma/client";
import {
  cleanMovieTitle,
  inferCategory,
  inferReleaseYear,
  youtubeThumbnail,
  youtubeWatchUrl,
} from "./youtube";
import { inferContentTypeFromTitle, isAajaTitle, isFreshersTitle } from "./content-type";
import { buildSynopsis } from "./synopsis";

export type YoutubeVideoRecord = {
  youtubeId: string;
  title: string;
  rawTitle: string;
  publishedAt: Date;
  durationSeconds: number | null;
  thumbnailUrl: string;
  youtubeUrl: string;
  description: string | null;
};

type ApiThumbnail = {
  url?: string;
  width?: number;
  height?: number;
};

type ApiVideoItem = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      maxres?: ApiThumbnail;
      standard?: ApiThumbnail;
      high?: ApiThumbnail;
      medium?: ApiThumbnail;
      default?: ApiThumbnail;
    };
  };
  contentDetails?: {
    duration?: string;
  };
};

const API_BASE = "https://www.googleapis.com/youtube/v3";

/** ISO 8601 duration (PT1H2M3S) → seconds. */
export function parseIso8601Duration(iso?: string): number | null {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  const s = parseInt(match[3] ?? "0", 10);
  return h * 3600 + m * 60 + s;
}

async function apiGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");

  const url = new URL(`${API_BASE}/${path}`);
  url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${path} failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function resolveUploadsPlaylistId(channelId: string): Promise<string> {
  const data = await apiGet<{
    items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[];
  }>("channels", {
    part: "contentDetails",
    id: channelId,
  });

  const uploads = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error(`Could not resolve uploads playlist for channel ${channelId}`);
  return uploads;
}

async function listPlaylistVideoIds(playlistId: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const params: Record<string, string> = {
      part: "contentDetails",
      playlistId,
      maxResults: "50",
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await apiGet<{
      items?: { contentDetails?: { videoId?: string } }[];
      nextPageToken?: string;
    }>("playlistItems", params);

    for (const item of data.items ?? []) {
      const id = item.contentDetails?.videoId;
      if (id) ids.push(id);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return ids;
}

async function fetchVideoDetails(ids: string[]): Promise<YoutubeVideoRecord[]> {
  const out: YoutubeVideoRecord[] = [];

  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const data = await apiGet<{ items?: ApiVideoItem[] }>("videos", {
      part: "snippet,contentDetails",
      id: chunk.join(","),
    });

    for (const item of data.items ?? []) {
      const rawTitle = item.snippet?.title?.trim();
      const publishedAtRaw = item.snippet?.publishedAt;
      if (!rawTitle || !publishedAtRaw) continue;

      const thumb = youtubeThumbnail(item.id, "sd");

      out.push({
        youtubeId: item.id,
        rawTitle,
        title: cleanMovieTitle(rawTitle) || rawTitle,
        publishedAt: new Date(publishedAtRaw),
        durationSeconds: parseIso8601Duration(item.contentDetails?.duration),
        thumbnailUrl: thumb,
        youtubeUrl: youtubeWatchUrl(item.id),
        description: item.snippet?.description?.trim() || null,
      });
    }
  }

  return out;
}

/** Fetch every upload from a YouTube channel via Data API v3. */
export async function fetchChannelVideosFromApi(
  channelId: string
): Promise<YoutubeVideoRecord[]> {
  const playlistId = await resolveUploadsPlaylistId(channelId);
  const ids = await listPlaylistVideoIds(playlistId);
  const videos = await fetchVideoDetails(ids);
  return videos.sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
}

export type MovieUpsertInput = {
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  synopsis: string | null;
  releaseYear: number;
  posterUrl: string;
  thumbnailUrl: string;
  youtubeId: string;
  youtubeUrl: string;
  publishedAt: Date;
  category: MovieCategory;
  runtimeSeconds: number | null;
  format: string;
  crew: string;
  contentType: ContentType;
  isAajaFilm: boolean;
  isFmacSelect: boolean;
};

export { isAajaTitle, isFreshersTitle, inferContentTypeFromTitle } from "./content-type";

export function shouldSyncVideo(title: string): boolean {
  if (isAajaTitle(title) || isFreshersTitle(title)) {
    return true;
  }

  const t = title.toLowerCase();
  if (t.includes("treasure hunt")) return false;
  if (t.includes("theme track")) return false;
  if (t.includes("coming soon")) return false;
  if (/\bpromo\b/.test(t) && !t.includes("short film")) return false;
  if (/\btrailer\b/.test(t) && !t.includes("short film")) return false;
  return true;
}

export function videoToMovieInput(
  video: YoutubeVideoRecord,
  slug: string
): MovieUpsertInput {
  const category = inferCategory(video.rawTitle, video.durationSeconds ?? undefined);
  const contentType = inferContentTypeFromTitle(video.rawTitle);
  const isAaja = contentType === "AAJA";
  const isFreshers = contentType === "FRESHERS";
  const releaseYear = inferReleaseYear(video.rawTitle, video.publishedAt.getFullYear());

  const tagline = isAaja
    ? "Flagship orientation film"
    : isFreshers
      ? "Freshers orientation film"
      : "A FMAC original";

  const { synopsis } = buildSynopsis(video.description);

  return {
    slug,
    title: video.title,
    tagline,
    description: synopsis,
    synopsis,
    releaseYear,
    posterUrl: youtubeThumbnail(video.youtubeId, "sd"),
    thumbnailUrl: youtubeThumbnail(video.youtubeId, "sd"),
    youtubeId: video.youtubeId,
    youtubeUrl: video.youtubeUrl,
    publishedAt: video.publishedAt,
    category,
    runtimeSeconds: video.durationSeconds,
    format: "Digital · YouTube",
    crew: "Film Making Club, BITS Goa",
    contentType,
    isAajaFilm: isAaja,
    isFmacSelect: /jiff|ifp|award|nominated/i.test(video.rawTitle),
  };
}
