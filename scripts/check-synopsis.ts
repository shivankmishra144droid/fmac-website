#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";
import { SYNOPSIS_FALLBACK } from "../lib/synopsis";

const prisma = new PrismaClient();

const SPOT = ["Aaja 2022", "summer", "Tasveerein", "Bansuri", "sorry", "Portrait"];

async function main() {
  const movies = await prisma.movie.findMany();
  console.log(`Total: ${movies.length} · With synopsis: ${movies.filter((m) => m.synopsis).length}`);
  console.log(`Fallback count: ${movies.filter((m) => m.synopsis === SYNOPSIS_FALLBACK).length}\n`);

  for (const key of SPOT) {
    const m = movies.find((x) => x.title.toLowerCase().includes(key.toLowerCase()));
    if (!m) {
      console.log(`— ${key}: not found`);
      continue;
    }
    console.log(`── ${m.title} ──`);
    console.log(m.synopsis ?? "(none)");
    console.log("");
  }
}

main()
  .finally(() => prisma.$disconnect());
