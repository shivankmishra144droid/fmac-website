import "server-only";
import sharp from "sharp";
import type { Movie } from "@prisma/client";
import { movieCardThumbnail } from "./youtube";

/** Resolved still + tiny blurred placeholder for a film card. */
export type FilmMedia = { thumb: string; blur?: string };
export type WithMedia<T> = T & { media?: FilmMedia };

const thumbCache = new Map<string, Promise<string>>();
const blurCache = new Map<string, Promise<string | undefined>>();

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "force-cache" });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Sharpest real 16:9 still YouTube has: maxresdefault (1280×720) when it exists — it 404s
 * on some uploads — else sddefault (640×480, letterboxed).
 */
function bestThumb(youtubeId: string): Promise<string> {
  let hit = thumbCache.get(youtubeId);
  if (!hit) {
    const max = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    const sd = `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`;
    hit = fetchWithTimeout(max, { method: "HEAD" })
      .then((r) => (r.ok ? max : sd))
      .catch(() => sd);
    thumbCache.set(youtubeId, hit);
  }
  return hit;
}

/** ~16px-wide WebP data URL from mqdefault (320×180, no bars, ~10 KB to fetch). */
function blurFor(youtubeId: string): Promise<string | undefined> {
  let hit = blurCache.get(youtubeId);
  if (!hit) {
    hit = fetchWithTimeout(`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`)
      .then(async (r) => {
        if (!r.ok) return undefined;
        const buf = Buffer.from(await r.arrayBuffer());
        const out = await sharp(buf).resize(16, 9, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
        return `data:image/webp;base64,${out.toString("base64")}`;
      })
      .catch(() => undefined);
    blurCache.set(youtubeId, hit);
  }
  return hit;
}

export async function filmMedia(movie: Pick<Movie, "youtubeId" | "thumbnailUrl" | "posterUrl">): Promise<FilmMedia | undefined> {
  if (!movie.youtubeId) {
    const thumb = movieCardThumbnail(movie);
    return thumb ? { thumb } : undefined;
  }
  const [thumb, blur] = await Promise.all([bestThumb(movie.youtubeId), blurFor(movie.youtubeId)]);
  return { thumb, blur };
}

/** Attach `media` to each film, a few at a time so a big catalogue doesn't stampede YouTube. */
export async function withMedia<T extends Pick<Movie, "youtubeId" | "thumbnailUrl" | "posterUrl">>(
  movies: T[],
  concurrency = 8
): Promise<WithMedia<T>[]> {
  const out: WithMedia<T>[] = new Array(movies.length);
  let next = 0;
  async function worker() {
    while (next < movies.length) {
      const i = next++;
      out[i] = { ...movies[i]!, media: await filmMedia(movies[i]!) };
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, movies.length) }, worker));
  return out;
}
