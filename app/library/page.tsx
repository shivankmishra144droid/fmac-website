import { Suspense } from "react";
import { LibraryHome } from "@/components/library/LibraryHome";
import { getCatalogueStatus, listAwardTitles, listMovies } from "@/lib/movies";
import { withMedia } from "@/lib/film-media";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [list, status, awards] = await Promise.all([listMovies(), getCatalogueStatus(), listAwardTitles()]);
  // Cards read `media` (sharpest still + blurred placeholder) when present.
  const movies = await withMedia(list);
  const awardTitles = new Set(awards);
  const dbConnected = status.connected;
  const dbSeeded = status.seeded;

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
