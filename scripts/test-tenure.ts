#!/usr/bin/env tsx
/**
 * Verify Aaja-bound tenure grouping against synced data.
 * Usage: npm run test:tenure
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient, type Movie } from "@prisma/client";
import {
  aajaStartYear,
  filterTenuresFrom2022,
  formatTenureLabel,
  getMoviePublishedAt,
  groupMoviesByTenure,
  isAajaFilm,
  reportMissingAajaMarkers,
  validateTenureGrouping,
} from "../lib/tenure";
import { parseYtDlpJsonl, cleanMovieTitle, youtubeThumbnail } from "../lib/youtube";
import { isAajaTitle } from "../lib/youtube-api";
import { inferContentTypeFromTitle } from "../lib/content-type";

const prisma = new PrismaClient();

function mockMoviesFromJsonl(): Movie[] {
  const path = join(process.cwd(), "youtube-channel.jsonl");
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  const videos = parseYtDlpJsonl(raw);
  const now = Date.now();

  return videos.map((v, i) => ({
    id: v.id,
    slug: v.id,
    title: cleanMovieTitle(v.title) || v.title,
    tagline: null,
    description: null,
    synopsis: null,
    releaseYear: 2022 + (i % 5),
    posterUrl: youtubeThumbnail(v.id, "max"),
    thumbnailUrl: youtubeThumbnail(v.id, "hq"),
    youtubeId: v.id,
    youtubeUrl: v.url,
    publishedAt: new Date(now - (videos.length - i) * 86400000 * 21),
    category: "SHORT" as const,
    contentType: inferContentTypeFromTitle(v.title),
    runtimeSeconds: v.duration ? Math.round(v.duration) : null,
    format: "Digital · YouTube",
    crew: "Film Making Club, BITS Goa",
    isLatestRelease: false,
    isFmacSelect: false,
    isAajaFilm: isAajaTitle(v.title),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

async function main() {
  let movies: Movie[] = [];
  let source = "database";

  try {
    movies = await prisma.movie.findMany({ orderBy: { publishedAt: "asc" } });
    if (movies.length === 0) throw new Error("empty");
  } catch {
    source = "youtube-channel.jsonl (mock dates)";
    movies = mockMoviesFromJsonl();
  }

  console.log(`Source: ${source} · ${movies.length} films\n`);

  const aaja = movies.filter(isAajaFilm);
  console.log(`── Aaja markers (${aaja.length}) ──`);
  if (aaja.length === 0) {
    console.log("  (none in dataset — run: npm run sync:youtube)");
  } else {
    for (const m of aaja.sort((a, b) => (getMoviePublishedAt(a)?.getTime() ?? 0) - (getMoviePublishedAt(b)?.getTime() ?? 0))) {
      const pub = getMoviePublishedAt(m);
      const start = pub ? aajaStartYear(m.title, pub) : "?";
      console.log(`  ${formatTenureLabel(Number(start))} ← ${m.title}`);
      console.log(`    published ${pub?.toISOString().slice(0, 10) ?? "?"}`);
    }
  }

  const missingAaja = reportMissingAajaMarkers(movies);
  if (missingAaja.length > 0) {
    console.log(`\n⚠ Missing Aaja for: ${missingAaja.map((y) => formatTenureLabel(y)).join(", ")}`);
  } else if (aaja.length > 0) {
    console.log("\n✓ Aaja coverage 2022–26 complete");
  }

  const withYoutube = movies.filter((m) => m.youtubeId);
  const allGroups = groupMoviesByTenure(withYoutube);
  const check = validateTenureGrouping(withYoutube, allGroups);
  const groups = filterTenuresFrom2022(allGroups);

  console.log("\n── Tenure groups ──\n");
  for (const g of groups) {
    console.log(`${g.displayLabel} · ${g.films.length} films`);
    if (g.aajaFilm) console.log(`  Aaja: ${g.aajaFilm.title}`);
    for (const f of g.films) {
      const pub = getMoviePublishedAt(f)?.toISOString().slice(0, 10) ?? "?";
      const tag = isAajaFilm(f) ? " [AAJA]" : "";
      console.log(`  · ${f.title}${tag} (${pub})`);
    }
    console.log("");
  }

  const total = groups.reduce((n, g) => n + g.films.length, 0);
  console.log(`Tenures shown: ${groups.length} · Films listed: ${total}`);

  if (!check.ok) {
    console.error("✗ Grouping validation failed");
    if (check.missing.length) console.error("  Missing:", check.missing.length);
    if (check.duplicates.length) console.error("  Duplicates:", check.duplicates.length);
    process.exit(1);
  }
  console.log("✓ Every film appears exactly once in tenure groups");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
