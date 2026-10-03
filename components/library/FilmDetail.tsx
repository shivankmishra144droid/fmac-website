"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@prisma/client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatRuntime, moviePosterUrl, youtubeEmbedUrl, youtubeFrame } from "@/lib/youtube";
import { getMovieContentType, contentTypeLabel } from "@/lib/content-type";
import { scrollToTarget } from "@/components/editorial/SmoothScroll";
import { getWatchlistIds, toggleWatchlistId } from "./WatchlistPage";
import { FilmCard } from "./FilmCard";

const EASE = [0.22, 1, 0.36, 1] as const;

function categoryLabel(movie: Movie): string {
  const type = getMovieContentType(movie);
  if (type !== "FILM") return contentTypeLabel(type);
  const c = movie.category.toLowerCase();
  return c === "movie" ? "Feature" : c.charAt(0).toUpperCase() + c.slice(1);
}

export function FilmDetail({
  movie,
  awardWinner,
  related = [],
}: {
  movie: Movie;
  awardWinner?: boolean;
  related?: Movie[];
}) {
  const reduce = useReducedMotion();
  const playerRef = useRef<HTMLDivElement>(null);
  const [watching, setWatching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // A real frame from the film (letterboxed) reads better than the title-card thumbnail.
  const frame = movie.youtubeId ? youtubeFrame(movie.youtubeId, 2) : null;
  const fallback = moviePosterUrl(movie);
  const [src, setSrc] = useState(frame ?? fallback);

  const synopsis = movie.synopsis ?? movie.description;
  const runtime = formatRuntime(movie.runtimeSeconds);
  const select = movie.isFmacSelect || awardWinner;

  useEffect(() => {
    setSaved(getWatchlistIds().includes(movie.id));
  }, [movie.id]);

  const watch = () => {
    setWatching(true);
    // Let the player mount, then glide to it.
    requestAnimationFrame(() => playerRef.current && scrollToTarget(playerRef.current, -96));
  };

  const details = [
    { k: "Year", v: String(movie.releaseYear) },
    { k: "Runtime", v: runtime || null },
    { k: "Type", v: categoryLabel(movie) },
    { k: "Format", v: movie.format },
    { k: "Made by", v: movie.crew },
  ].filter((d): d is { k: string; v: string } => Boolean(d.v));

  return (
    <article className="pb-32">
      {/* Hero */}
      <section className="relative isolate flex min-h-[88svh] flex-col justify-end overflow-hidden">
        {src && (
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={src === frame ? { transform: "scale(1.36)" } : undefined}
          >
            <Image
              src={src}
              alt=""
              fill
              priority
              sizes="100vw"
              onLoad={() => setLoaded(true)}
              onError={() => fallback && src !== fallback && setSrc(fallback)}
              className={`object-cover transition-[filter,opacity,transform] duration-[1800ms] ease-out ${
                loaded || reduce ? "scale-100 opacity-100 blur-0" : "scale-[1.06] opacity-60 blur-2xl"
              }`}
            />
          </div>
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-stage via-stage/55 to-stage/40" />

        <div className="px-5 pb-16 pt-36 md:px-24 md:pb-20">
          <Link href="/library" className="kicker link-underline mb-10 inline-block pb-0.5 text-bone/55 hover:text-bone">
            ← The library
          </Link>

          <p className="kicker mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-bone/60">
            {select && <span className="bg-beam px-1.5 py-0.5 text-stage">{movie.isFmacSelect ? "FMAC Select" : "Award winner"}</span>}
            <span>{categoryLabel(movie)}</span>
            <span className="text-bone/30">/</span>
            <span>{movie.releaseYear}</span>
            {runtime && (
              <>
                <span className="text-bone/30">/</span>
                <span>{runtime}</span>
              </>
            )}
          </p>

          <motion.h1
            className="headline max-w-[16ch] text-[clamp(3rem,8.5vw,8.5rem)] text-bone"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
          >
            {movie.title}
          </motion.h1>

          {movie.tagline && (
            <p className="mt-6 max-w-lg text-base leading-relaxed text-bone/70 md:text-lg">{movie.tagline}</p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {movie.youtubeId ? (
              <button
                type="button"
                onClick={watch}
                className="kicker group inline-flex items-center gap-3 bg-bone px-5 py-3.5 text-stage transition-colors hover:bg-beam"
              >
                ▶ Watch the film
              </button>
            ) : (
              <span className="kicker border border-bone/20 px-5 py-3.5 text-bone/50">Coming soon</span>
            )}
            <button
              type="button"
              onClick={() => setSaved(toggleWatchlistId(movie.id).includes(movie.id))}
              aria-pressed={saved}
              className={`kicker inline-flex items-center gap-3 border px-5 py-3.5 transition-colors ${
                saved ? "border-beam text-beam" : "border-bone/30 text-bone hover:border-bone"
              }`}
            >
              {saved ? "In your watchlist" : "+ Watchlist"}
            </button>
          </div>
        </div>
      </section>

      {/* Player */}
      <div ref={playerRef} className="px-5 md:px-24">
        <AnimatePresence>
          {watching && movie.youtubeId && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="relative mb-20 aspect-video overflow-hidden border border-hairline bg-black"
            >
              <iframe
                title={`Watch ${movie.title}`}
                src={`${youtubeEmbedUrl(movie.youtubeId)}?rel=0&autoplay=1&modestbranding=1`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Synopsis + details */}
      <section className="grid gap-14 px-5 pt-8 md:px-24 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-24">
        <div>
          <p className="kicker mb-6 text-bone/40">Synopsis</p>
          {synopsis ? (
            <p className="headline max-w-[34ch] text-[clamp(1.6rem,2.8vw,2.6rem)] leading-[1.2] text-bone/85">
              {synopsis}
            </p>
          ) : (
            <p className="text-bone/40">No synopsis yet.</p>
          )}
        </div>
        <dl className="self-start border-t border-hairline">
          {details.map((d) => (
            <div key={d.k} className="flex items-baseline justify-between gap-6 border-b border-hairline py-4">
              <dt className="kicker text-bone/40">{d.k}</dt>
              <dd className="text-right text-sm text-bone/80">{d.v}</dd>
            </div>
          ))}
          {movie.youtubeUrl && (
            <a
              href={movie.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="kicker mt-6 inline-block text-bone/55 transition-colors hover:text-beam"
            >
              Open on YouTube ↗
            </a>
          )}
        </dl>
      </section>

      {/* More */}
      {related.length > 0 && (
        <section className="mt-28 md:mt-36">
          <div className="mb-8 flex items-end justify-between gap-6 px-5 md:px-24">
            <h2 className="headline text-[clamp(2.25rem,4.5vw,4rem)] text-bone">
              Keep <span className="italic text-bone/60">watching.</span>
            </h2>
            <Link href="/library" className="kicker link-underline shrink-0 pb-2 text-bone/55 hover:text-bone">
              All films →
            </Link>
          </div>
          <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 md:scroll-px-24 md:px-24">
            {related.map((m) => (
              <FilmCard key={m.id} movie={m} />
            ))}
            <span aria-hidden className="w-px shrink-0" />
          </div>
        </section>
      )}
    </article>
  );
}
