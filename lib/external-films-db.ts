import type { PrismaClient } from "@prisma/client";
import { EXTERNAL_FILMS, externalFilmToMovie } from "./external-films";

/**
 * Upsert EXTERNAL_FILMS into the database (matched by YouTube id) and, if one is flagged
 * `isLatestRelease`, make it the only latest release. Safe to run repeatedly.
 */
export async function upsertExternalFilms(prisma: PrismaClient): Promise<void> {
  let latestId: string | null = null;

  for (const film of EXTERNAL_FILMS) {
    const data = externalFilmToMovie(film);
    const existing = await prisma.movie.findUnique({ where: { youtubeId: film.youtubeId } });

    // Keep an existing row's slug; only claim ours if no other film already has it.
    let slug = existing?.slug ?? data.slug;
    if (!existing && (await prisma.movie.findUnique({ where: { slug } }))) {
      slug = `${data.slug}-${film.youtubeId.slice(0, 4).toLowerCase()}`;
    }

    const saved = await prisma.movie.upsert({
      where: { youtubeId: film.youtubeId },
      create: { ...data, slug, isLatestRelease: false },
      update: { ...data, slug, isLatestRelease: false },
    });
    if (film.isLatestRelease) latestId = saved.id;
    console.log(`  • ${film.title} (${film.releaseYear})${film.isLatestRelease ? " ★ latest" : ""}`);
  }

  if (latestId) {
    await prisma.movie.updateMany({ where: { isLatestRelease: true }, data: { isLatestRelease: false } });
    await prisma.movie.update({ where: { id: latestId }, data: { isLatestRelease: true } });
  }
}
