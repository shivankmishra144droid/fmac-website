import { Suspense } from "react";
import { LibraryHome } from "@/components/library/LibraryHome";
import { isDatabaseConnected, isDatabaseSeeded, listMovies } from "@/lib/movies";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const movies = await listMovies();
  const dbConnected = await isDatabaseConnected();
  const dbSeeded = dbConnected ? await isDatabaseSeeded() : false;

  let awardTitles = new Set<string>();
  try {
    const achievements = await prisma.achievement.findMany({
      where: { movieTitle: { not: null } },
      select: { movieTitle: true },
    });
    awardTitles = new Set(
      achievements
        .map((a) => a.movieTitle?.toLowerCase())
        .filter((t): t is string => Boolean(t))
    );
  } catch {
    /* db unavailable — dev fallback films still render */
  }

  return (
    <Suspense fallback={<LibraryLoading />}>
      <LibraryHome
        movies={movies}
        awardTitles={awardTitles}
        dbConnected={dbConnected}
        dbSeeded={dbSeeded}
      />
    </Suspense>
  );
}

function LibraryLoading() {
  return (
    <div className="px-5 pt-36 md:px-24 md:pt-48">
      <div className="h-24 w-2/3 max-w-2xl animate-pulse bg-bone/[0.06]" />
      <div className="mt-8 h-4 w-80 animate-pulse bg-bone/[0.05]" />
    </div>
  );
}
