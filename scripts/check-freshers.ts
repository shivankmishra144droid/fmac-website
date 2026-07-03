#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";
import { getMovieContentType, isFreshersTitle, reportMissingFreshersYears } from "../lib/content-type";
import { filterMoviesByCategory } from "../lib/library-categories";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.log("Postgres unreachable — library is showing dev fallback films (no Freshers).");
    process.exit(0);
  }

  const movies = await prisma.movie.findMany({
    orderBy: { publishedAt: "asc" },
  });

  console.log(`Total movies in DB: ${movies.length}`);

  const freshers = movies.filter(
    (m) => getMovieContentType(m) === "FRESHERS" || isFreshersTitle(m.title)
  );

  console.log(`Freshers-tagged movies: ${freshers.length}`);
  for (const m of freshers) {
    console.log(`  · ${m.title}`);
    console.log(`    contentType=${m.contentType} youtubeId=${m.youtubeId ?? "none"}`);
  }

  const category = filterMoviesByCategory(movies, "freshers");
  console.log(`\nCategory filter (freshers slug): ${category.length} films`);

  const missing = reportMissingFreshersYears(movies);
  if (missing.length) {
    console.log(`\nMissing Freshers years (2023–2025): ${missing.join(", ")}`);
  }

  const hasContentTypeCol = movies.some((m) => "contentType" in m);
  if (!hasContentTypeCol && movies.length > 0) {
    console.log("\n⚠ contentType column may be missing — run: npx prisma migrate deploy");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
