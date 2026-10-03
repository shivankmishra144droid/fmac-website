/**
 * Add/refresh FMAC films that live on other YouTube channels (lib/external-films.ts)
 * and apply the pinned latest release. Usage: npm run films:external
 */
import { PrismaClient } from "@prisma/client";
import { upsertExternalFilms } from "../lib/external-films-db";

const prisma = new PrismaClient();

async function main() {
  console.log("Upserting external films:");
  await upsertExternalFilms(prisma);
  const latest = await prisma.movie.findFirst({ where: { isLatestRelease: true } });
  console.log(`\nLatest release: ${latest?.title ?? "(none)"}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
