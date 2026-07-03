#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const keys = ["aaja 2022", "summer", "tasveerein"];
  const movies = await prisma.movie.findMany();
  for (const key of keys) {
    const matches = movies.filter((m) => m.title.toLowerCase().includes(key));
    for (const m of matches) {
      console.log({
        title: m.title,
        youtubeId: m.youtubeId,
        posterUrl: m.posterUrl,
        thumbnailUrl: m.thumbnailUrl,
      });
    }
  }
}

main()
  .finally(() => prisma.$disconnect());
