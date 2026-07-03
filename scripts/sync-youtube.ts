#!/usr/bin/env tsx
/**
 * Sync all videos from the FMAC YouTube channel into Postgres.
 *
 * Primary: YouTube Data API v3 (YOUTUBE_API_KEY + YOUTUBE_CHANNEL_ID)
 * Fallback: yt-dlp full channel scrape when API key is missing
 *
 * Usage:
 *   npm run sync:youtube
 *   npm run sync:youtube -- --dry-run
 */

import { execFileSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import {
  fetchChannelVideosFromApi,
  shouldSyncVideo,
  videoToMovieInput,
  type YoutubeVideoRecord,
} from "../lib/youtube-api";
import { parseYtDlpJsonl, cleanMovieTitle, youtubeWatchUrl, youtubeThumbnail, isBrokenYoutubeThumbnail } from "../lib/youtube";
import { buildSynopsis, SYNOPSIS_FALLBACK } from "../lib/synopsis";
import { uniqueSlug } from "../lib/slug";
import { filterTenuresFrom2022, formatTenureLabel, groupMoviesByTenure, reportMissingAajaMarkers } from "../lib/tenure";
import {
  isAajaTitle,
  isFreshersTitle,
  freshersYearFromTitle,
  reportMissingFreshersYears,
} from "../lib/content-type";

const prisma = new PrismaClient();

function loadEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function fetchViaYtDlp(channelId: string): Promise<YoutubeVideoRecord[]> {
  const url = `https://www.youtube.com/channel/${channelId}/videos`;
  console.log(`Fetching via yt-dlp: ${url}`);

  let stdout: string;
  try {
    stdout = execFileSync("yt-dlp", ["-j", "--no-download", "--ignore-errors", url], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (err) {
    const e = err as { stdout?: string; message?: string };
    if (e.stdout) stdout = e.stdout;
    else throw new Error(`yt-dlp failed. Install yt-dlp or set YOUTUBE_API_KEY.\n${e.message}`);
  }

  const out: YoutubeVideoRecord[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const j = JSON.parse(trimmed) as {
        id?: string;
        title?: string;
        description?: string;
        upload_date?: string;
        timestamp?: number;
        duration?: number;
        thumbnails?: { url?: string }[];
        webpage_url?: string;
      };
      if (!j.id || !j.title) continue;

      let publishedAt: Date | null = null;
      if (j.upload_date && /^\d{8}$/.test(j.upload_date)) {
        const y = j.upload_date.slice(0, 4);
        const m = j.upload_date.slice(4, 6);
        const d = j.upload_date.slice(6, 8);
        publishedAt = new Date(`${y}-${m}-${d}T12:00:00.000Z`);
      } else if (j.timestamp) {
        publishedAt = new Date(j.timestamp * 1000);
      }
      if (!publishedAt) continue;

      const thumb =
        j.thumbnails?.[j.thumbnails.length - 1]?.url ?? youtubeThumbnail(j.id, "sd");

      out.push({
        youtubeId: j.id,
        rawTitle: j.title,
        title: cleanMovieTitle(j.title) || j.title,
        publishedAt,
        durationSeconds: j.duration ? Math.round(j.duration) : null,
        thumbnailUrl: thumb,
        youtubeUrl: j.webpage_url ?? youtubeWatchUrl(j.id),
        description: typeof j.description === "string" ? j.description : null,
      });
    } catch {
      /* skip malformed line */
    }
  }

  return out.sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
}

async function fetchViaJsonlFallback(): Promise<YoutubeVideoRecord[]> {
  const path = join(process.cwd(), "youtube-channel.jsonl");
  if (!existsSync(path)) throw new Error("No API key, yt-dlp, or youtube-channel.jsonl available.");

  console.log("Using youtube-channel.jsonl (no publish dates — run sync:youtube with API for accurate tenures)");
  const raw = readFileSync(path, "utf8");
  const parsed = parseYtDlpJsonl(raw);
  const now = Date.now();

  return parsed.map((v, i) => ({
    youtubeId: v.id,
    rawTitle: v.title,
    title: cleanMovieTitle(v.title) || v.title,
    publishedAt: new Date(now - (parsed.length - i) * 86400000 * 14),
    durationSeconds: v.duration ? Math.round(v.duration) : null,
    thumbnailUrl: youtubeThumbnail(v.id, "sd"),
    youtubeUrl: v.url,
    description: null,
  }));
}

async function fetchAllVideos(): Promise<YoutubeVideoRecord[]> {
  const channelId =
    process.env.YOUTUBE_CHANNEL_ID ?? "UCFVx9GpUrQ7FFWLiJ63mF9A";

  if (process.env.YOUTUBE_API_KEY) {
    console.log(`Syncing via YouTube Data API (channel ${channelId})…`);
    return fetchChannelVideosFromApi(channelId);
  }

  try {
    return await fetchViaYtDlp(channelId);
  } catch (ytErr) {
    console.warn(String(ytErr));
    return fetchViaJsonlFallback();
  }
}

async function main() {
  loadEnv();
  const dryRun = process.argv.includes("--dry-run");

  const allVideos = await fetchAllVideos();
  console.log(`Fetched ${allVideos.length} videos from channel.`);

  const toSync = allVideos.filter((v) => shouldSyncVideo(v.rawTitle));
  const skipped = allVideos.length - toSync.length;
  console.log(`Including ${toSync.length} films (${skipped} promos/trailers skipped).`);
  const aajaInBatch = toSync.filter((v) => isAajaTitle(v.rawTitle));
  console.log(`Aaja orientation films in sync batch: ${aajaInBatch.length}`);
  for (const v of aajaInBatch) {
    console.log(`  · ${v.rawTitle} (${v.publishedAt.toISOString().slice(0, 10)})`);
  }

  const freshersInBatch = toSync.filter((v) => isFreshersTitle(v.rawTitle));
  console.log(`Freshers videos in sync batch: ${freshersInBatch.length}`);
  for (const v of freshersInBatch) {
    const year = freshersYearFromTitle(v.rawTitle);
    console.log(
      `  · ${v.rawTitle} (${v.publishedAt.toISOString().slice(0, 10)}${year ? ` · batch ${year}` : ""})`
    );
  }

  const taken = new Set<string>();
  const existing = await prisma.movie.findMany({
    select: { slug: true, youtubeId: true },
  });
  const slugByYoutube = new Map<string, string>();
  for (const row of existing) {
    taken.add(row.slug);
    if (row.youtubeId) slugByYoutube.set(row.youtubeId, row.slug);
  }

  let upserted = 0;
  let latestCandidate: { id: string; publishedAt: Date } | null = null;
  const synopsisFallbacks: string[] = [];

  for (const video of toSync) {
    const slug = slugByYoutube.get(video.youtubeId) ?? uniqueSlug(video.title, taken);
    const data = videoToMovieInput(video, slug);

    if (data.synopsis === SYNOPSIS_FALLBACK) {
      synopsisFallbacks.push(video.title);
    }

    if (!dryRun) {
      const saved = await prisma.movie.upsert({
        where: { youtubeId: video.youtubeId },
        create: {
          ...data,
          isLatestRelease: false,
        },
        update: {
          title: data.title,
          tagline: data.tagline,
          description: data.description,
          synopsis: data.synopsis,
          releaseYear: data.releaseYear,
          posterUrl: data.posterUrl,
          thumbnailUrl: data.thumbnailUrl,
          youtubeUrl: data.youtubeUrl,
          publishedAt: data.publishedAt,
          category: data.category,
          runtimeSeconds: data.runtimeSeconds,
          format: data.format,
          crew: data.crew,
          isAajaFilm: data.isAajaFilm,
          contentType: data.contentType,
          isFmacSelect: data.isFmacSelect,
        },
      });

      if (!data.isAajaFilm) {
        if (
          !latestCandidate ||
          data.publishedAt.getTime() > latestCandidate.publishedAt.getTime()
        ) {
          latestCandidate = { id: saved.id, publishedAt: data.publishedAt };
        }
      }
    }

    upserted += 1;
  }

  if (!dryRun) {
    await prisma.movie.updateMany({ data: { isLatestRelease: false } });
    if (latestCandidate) {
      await prisma.movie.update({
        where: { id: latestCandidate.id },
        data: { isLatestRelease: true },
      });
    }
  }

  const synced = dryRun
    ? []
    : await prisma.movie.findMany({ orderBy: { publishedAt: "asc" } });

  if (dryRun) {
    console.log("\n[dry-run] Skipping tenure summary (no DB writes).");
  } else {
    const groups = filterTenuresFrom2022(groupMoviesByTenure(synced));
    console.log("\nTenure breakdown (2022+):");
    for (const g of groups) {
      const aaja = g.aajaFilm?.title ?? "—";
      console.log(`  ${g.displayLabel}: ${g.films.length} films (Aaja: ${aaja})`);
    }

    const missingAaja = reportMissingAajaMarkers(synced);
    if (missingAaja.length > 0) {
      console.warn(
        `\n⚠ Missing Aaja markers for academic years: ${missingAaja.map((y) => formatTenureLabel(y)).join(", ")}`
      );
      console.warn("  Re-run sync with YOUTUBE_API_KEY to fetch full channel pagination.");
    }

    const missingFreshers = reportMissingFreshersYears(synced);
    if (missingFreshers.length > 0) {
      console.warn(
        `\n⚠ Missing Freshers videos for years: ${missingFreshers.join(", ")}`
      );
      console.warn("  Re-run sync with YOUTUBE_API_KEY or yt-dlp for full channel pagination.");
    } else {
      const freshersSynced = synced.filter((m) => m.contentType === "FRESHERS" || isFreshersTitle(m.title));
      console.log(`\nFreshers coverage OK (${freshersSynced.length} videos, 2023–2025 present).`);
      for (const m of freshersSynced.sort((a, b) => (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0))) {
        const y = freshersYearFromTitle(m.title);
        console.log(`  · ${m.title}${y ? ` (${y})` : ""}`);
      }
    }

    const aajaSynced = synced.filter((m) => m.contentType === "AAJA" || m.isAajaFilm);
    console.log(`\nAaja films in DB: ${aajaSynced.length}`);
    for (const m of aajaSynced.sort((a, b) => (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0))) {
      console.log(`  · ${m.title} (${m.publishedAt?.toISOString().slice(0, 10) ?? "?"})`);
    }
  }

  console.log(dryRun ? `[dry-run] Would upsert ${upserted} films.` : `Upserted ${upserted} films.`);
  console.log(`Channel total: ${allVideos.length} · Synced: ${toSync.length}`);

  if (!dryRun) {
    const withYoutube = await prisma.movie.findMany({
      where: { youtubeId: { not: null } },
      select: { id: true, youtubeId: true, posterUrl: true, thumbnailUrl: true },
    });
    let thumbsFixed = 0;
    for (const row of withYoutube) {
      if (!row.youtubeId) continue;
      const canonical = youtubeThumbnail(row.youtubeId, "sd");
      if (
        row.posterUrl === canonical &&
        row.thumbnailUrl === canonical &&
        !isBrokenYoutubeThumbnail(row.posterUrl)
      ) {
        continue;
      }
      if (
        isBrokenYoutubeThumbnail(row.posterUrl) ||
        isBrokenYoutubeThumbnail(row.thumbnailUrl) ||
        row.posterUrl !== canonical
      ) {
        await prisma.movie.update({
          where: { id: row.id },
          data: { posterUrl: canonical, thumbnailUrl: canonical },
        });
        thumbsFixed += 1;
      }
    }
    if (thumbsFixed > 0) {
      console.log(`Refreshed ${thumbsFixed} thumbnail URL(s) to canonical sddefault.`);
    }

    if (synopsisFallbacks.length > 0) {
      console.warn(
        `\n⚠ ${synopsisFallbacks.length} film(s) using placeholder synopsis (needs manual copy):`
      );
      for (const title of synopsisFallbacks) {
        console.warn(`  · ${title}`);
      }
    }

    const spotCheck = synced
      .filter((m) => m.synopsis && m.synopsis !== SYNOPSIS_FALLBACK)
      .slice(-6);
    if (spotCheck.length > 0) {
      console.log("\n── Synopsis spot-check (latest with real copy) ──");
      for (const m of spotCheck) {
        const preview =
          m.synopsis!.length > 120 ? `${m.synopsis!.slice(0, 120)}…` : m.synopsis!;
        console.log(`  ${m.title}`);
        console.log(`    ${preview}`);
      }
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
