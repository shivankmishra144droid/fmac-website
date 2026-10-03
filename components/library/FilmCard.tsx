"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@prisma/client";
import { formatRuntime, movieCardThumbnail } from "@/lib/youtube";
import { movieHref } from "@/lib/slug";
import { getWatchlistIds, toggleWatchlistId } from "./WatchlistPage";
import type { FilmMedia } from "@/lib/film-media";

/**
 * Editorial library card — matches the home filmstrip: hairline-framed 16:9 still,
 * small mono caption, quiet watchlist toggle on hover/focus.
 */
export function FilmCard({
  movie,
  tag,
  fluid,
  priority,
}: {
  movie: Movie & { media?: FilmMedia };
  /** Short corner label, e.g. "Aaja", "Award". */
  tag?: string | null;
  /** Fill the grid cell instead of the fixed row width. */
  fluid?: boolean;
  priority?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const href = movieHref(movie);
  const thumb = movie.media?.thumb ?? movieCardThumbnail(movie);
  const runtime = formatRuntime(movie.runtimeSeconds);

  useEffect(() => {
    setSaved(getWatchlistIds().includes(movie.id));
  }, [movie.id]);

  const onToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(toggleWatchlistId(movie.id).includes(movie.id));
  };

  return (
    <Link
      href={href}
      // Hover prefetches; skip Next's viewport prefetch (dozens of cards would each hit the server).
      prefetch={false}
      data-cursor="Watch"
      data-transition-title={movie.title}
      // Warm the film page on hover so the click lands instantly.
      onPointerEnter={() => router.prefetch(href)}
      className={`group block ${fluid ? "w-full" : "w-[72vw] shrink-0 snap-start sm:w-[300px] lg:w-[340px]"}`}
    >
      <div className="relative aspect-video overflow-hidden border border-hairline bg-stage-900 transition-colors duration-300 group-hover:border-beam/60 group-focus-visible:border-beam">
        {thumb ? (
          <Image
            src={thumb}
            alt=""
            fill
            sizes={fluid ? "(max-width: 640px) 90vw, (max-width: 1280px) 45vw, 30vw" : "(max-width: 640px) 72vw, 340px"}
            priority={priority}
            placeholder={movie.media?.blur ? "blur" : "empty"}
            blurDataURL={movie.media?.blur}
            className="object-cover brightness-[0.82] saturate-[0.85] transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.04] group-hover:brightness-100 group-hover:saturate-100"
          />
        ) : (
          <span className="headline absolute inset-0 flex items-center justify-center p-4 text-center text-2xl text-bone/55">
            {movie.title}
          </span>
        )}

        {tag && (
          <span className="kicker absolute left-2 top-2 bg-beam px-1.5 py-0.5 text-stage">{tag}</span>
        )}

        <button
          type="button"
          onClick={onToggle}
          data-cursor={saved ? "Unsave" : "Save"}
          aria-label={saved ? `Saved: ${movie.title}. Remove from watchlist` : `Save ${movie.title} to watchlist`}
          aria-pressed={saved}
          className={`kicker absolute right-2 top-2 flex h-8 items-center gap-1.5 border px-2 backdrop-blur-sm transition-[opacity,colors] duration-300 ${
            saved
              ? "border-beam bg-beam text-stage opacity-100"
              : "border-bone/30 bg-stage/60 text-bone opacity-0 hover:border-bone group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          }`}
        >
          {saved ? "Saved" : (
            <>
              <span aria-hidden>+</span> Save
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="headline truncate text-xl text-bone/85 transition-colors group-hover:text-bone">
          {movie.title}
        </p>
        <p className="kicker shrink-0 text-bone/55">
          {movie.releaseYear}
          {runtime ? ` · ${runtime}` : ""}
        </p>
      </div>
    </Link>
  );
}
