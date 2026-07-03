#!/usr/bin/env tsx
/** One-shot: fix broken YouTube API thumbnail URLs in Postgres. */
import { PrismaClient } from "@prisma/client";
import { isBrokenYoutubeThumbnail, youtubeThumbnail } from "../lib/youtube";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.movie.findMany({
    where: { youtubeId: { not: null } },
    select: { id: true, title: true, youtubeId: true, posterUrl: true, thumbnailUrl: true },
  });

  let fixed = 0;
  for (const row of rows) {
    if (!row.youtubeId) continue;
    const canonical = youtubeThumbnail(row.youtubeId, "sd");
    const broken =
      isBrokenYoutubeThumbnail(row.posterUrl) ||
      isBrokenYoutubeThumbnail(row.thumbnailUrl) ||
      row.posterUrl !== canonical ||
      row.thumbnailUrl !== canonical;

    if (!broken) continue;

    await prisma.movie.update({
      where: { id: row.id },
      data: { posterUrl: canonical, thumbnailUrl: canonical },
    });
    console.log(`Fixed: ${row.title}`);
    fixed += 1;
  }

  console.log(`\nDone — updated ${fixed} film(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
