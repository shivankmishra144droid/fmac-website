import { readFileSync } from "node:fs";
import path from "node:path";
import type { Movie } from "@prisma/client";
import { uniqueSlug } from "./slug";
import {
  channelVideoToMovie,
  inferReleaseYear,
  parseYtDlpJsonl,
  type ChannelVideo,
} from "./youtube";

/** Uploads that aren't films: crossovers, covers, event reels, teasers. */
const NOT_A_FILM =
  /dance cover|aftermovie|music video|teaser|getting real with nareal|introduction video|a glimpse of|world of symphony/i;

/** On-site title: drop the "| festival | channel" tail and a few descriptive suffixes. */
function displayTitle(title: string): string {
  const head = title.split(/\s+\|\s+/)[0]!.trim();
  const tidy = head
    .replace(/\s*-\s*an online fmac venture$/i, "")
    .replace(/\s*-\s*a fan-made .*$/i, "")
    .trim();
  // ALL-CAPS uploads ("GOONS N GULAABS") → Title Case, but leave short marks like "BT" or "?" alone.
  return tidy.length > 3 && tidy === tidy.toUpperCase() && /[A-Z]/.test(tidy)
    ? tidy.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase())
    : tidy;
}

/** True when the title carries an explicit year (2024, '24). */
function hasExplicitYear(title: string): boolean {
  return /\b20\d{2}\b/.test(title) || /['']\d{2}\b/.test(title);
}

/**
 * Every FMAC film on the channel (plus Aaja/Freshers orientation films, which the library uses
 * as tenure markers), oldest → newest, read from the committed yt-dlp dump
 * (`npm run fetch:youtube`). The dump is in upload order (newest first) but has no dates,
 * so years come from the title when tagged and are carried forward from the nearest
 * earlier tagged upload otherwise.
 */
function loadChannelFilms(): Movie[] {
  let videos: ChannelVideo[];
  try {
    videos = parseYtDlpJsonl(readFileSync(path.join(process.cwd(), "youtube-channel.jsonl"), "utf8"));
  } catch {
    return [];
  }

  const oldestFirst = [...videos].reverse();

  // Year per upload: explicit when tagged, otherwise inherit from the previous upload.
  const firstTagged = oldestFirst.find((v) => hasExplicitYear(v.title));
  let carry = firstTagged ? inferReleaseYear(firstTagged.title) : 2017;
  const years = oldestFirst.map((v) => {
    if (hasExplicitYear(v.title)) carry = Math.max(carry, inferReleaseYear(v.title));
    return carry;
  });

  const taken = new Set<string>();
  const out: Movie[] = [];

  oldestFirst.forEach((v, i) => {
    if (NOT_A_FILM.test(v.title)) return;
    const base = channelVideoToMovie(v, i);
    if (!base) return;

    const year = years[i]!;
    // Synthetic date that preserves upload order within a year.
    const publishedAt = new Date(Date.UTC(year, 0, 1, 0, 0, i));

    const title = displayTitle(base.title);
    // The generated blurb opens with the raw upload title; swap in the tidy one.
    const description = base.description.replace(base.title, title);
    out.push({
      ...base,
      title,
      description,
      id: `yt-${v.id}`,
      slug: uniqueSlug(title, taken),
      synopsis: description,
      releaseYear: year,
      thumbnailUrl: base.posterUrl,
      publishedAt,
      createdAt: publishedAt,
      updatedAt: publishedAt,
    });
  });

  return out;
}

let cache: Movie[] | null = null;

export function channelFilms(): Movie[] {
  cache ??= loadChannelFilms();
  return cache;
}
