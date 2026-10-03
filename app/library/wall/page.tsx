import type { Metadata } from "next";
import Link from "next/link";
import { PosterWall, WallIndex } from "@/components/library/PosterWall";
import { getWallFilms } from "@/lib/wall";

export const metadata: Metadata = {
  title: "The wall",
  description: "FMAC films from 2022 to today on one endless wall. Drag to explore.",
};

export const dynamic = "force-dynamic";

export default async function PosterWallPage() {
  const films = await getWallFilms();

  return (
    <>
      <h1 className="sr-only">The wall: FMAC films from 2022 onward</h1>
      <PosterWall films={films} />
      <WallIndex films={films} />

      {/* HUD */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between gap-6 px-5 pb-7 md:px-16">
        <p className="kicker whitespace-nowrap text-bone/55">
          <span className="[@media(hover:none)]:hidden">Drag or scroll to explore</span>
          <span className="hidden [@media(hover:none)]:inline">Swipe to explore</span>
        </p>
        <div className="pointer-events-auto flex items-center gap-6">
          <span className="kicker hidden whitespace-nowrap text-bone/55 sm:inline">{films.length} films</span>
          <Link
            href="/library"
            data-magnetic
            className="kicker whitespace-nowrap border border-bone/30 bg-stage/60 px-3.5 py-2 text-bone backdrop-blur-sm transition-colors hover:border-bone"
          >
            ← The library
          </Link>
        </div>
      </div>
    </>
  );
}
