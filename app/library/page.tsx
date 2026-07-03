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
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      <div className="mt-6 h-10 w-full max-w-xl animate-pulse rounded-full bg-white/[0.06]" />
    </div>
  );
}
