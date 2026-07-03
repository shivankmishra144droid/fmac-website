"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@prisma/client";
import { formatRuntime, youtubeEmbedUrl, youtubeWatchUrl, moviePosterUrl } from "@/lib/youtube";
import { toggleWatchlistId, getWatchlistIds } from "./WatchlistPage";

function crewCount(crew: string | null | undefined): number {
  if (!crew) return 0;
  return crew.split(/[,·&]/).map((s) => s.trim()).filter(Boolean).length || 1;
}

export function FilmDetail({
  movie,
  awardWinner,
}: {
  movie: Movie;
  awardWinner?: boolean;
}) {
  const [watching, setWatching] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  const poster = moviePosterUrl(movie);
  const synopsis = movie.synopsis ?? movie.description;

  const crewN = crewCount(movie.crew);
  const metaLine = [
    movie.releaseYear,
    formatRuntime(movie.runtimeSeconds),
    movie.format,
    crewN > 0 ? `${crewN} crew` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    setInWatchlist(getWatchlistIds().includes(movie.id));
  }, [movie.id]);

  function handleWatchlist() {
    const next = toggleWatchlistId(movie.id);
    setInWatchlist(next.includes(movie.id));
  }

  return (
    <div className="pb-28">
      <div className="relative min-h-[55vh] w-full">
        {poster && (
          <Image src={poster} alt="" fill priority className="object-cover" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]/25" />

        <div className="absolute inset-x-0 bottom-0 px-4 pb-8 pt-24 sm:px-6">
          <Link
            href="/library"
            className="type-eyebrow mb-6 inline-block tracking-label text-white/40 hover:text-white/70"
          >
            ← Library
          </Link>

          <div className="flex flex-wrap items-start gap-3">
            <h1 className="film-title max-w-2xl text-display tracking-display text-white sm:text-display-lg">
              {movie.title}
            </h1>
            {(movie.isFmacSelect || awardWinner) && (
              <span className="type-eyebrow rounded-md bg-marquee px-2.5 py-1 text-[0.58rem] text-ink">
                {movie.isFmacSelect ? "FMAC Select" : "Award Winner"}
              </span>
            )}
          </div>

          <p className="type-meta mt-3 text-label text-white/45">{metaLine}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {movie.youtubeId ? (
              <button
                type="button"
                onClick={() => setWatching(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-label font-medium text-[#0a0a0a] transition hover:bg-white/90"
              >
                <PlayIcon />
                Watch now
              </button>
            ) : (
              <span className="rounded-full border border-white/20 px-6 py-2.5 text-label text-white/50">
                Coming soon
              </span>
            )}
            <IconButton label="Download" disabled>
              <DownloadIcon />
            </IconButton>
            <IconButton label="Watchlist" onClick={handleWatchlist} active={inWatchlist}>
              <WatchlistIcon filled={inWatchlist} />
            </IconButton>
          </div>
        </div>
      </div>

      {watching && movie.youtubeId && (
        <div className="px-4 sm:px-6">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
            <iframe
              title={`Watch ${movie.title}`}
              src={`${youtubeEmbedUrl(movie.youtubeId)}?rel=0&autoplay=1`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="mt-10 space-y-10 px-4 sm:px-6">
        {synopsis && (
          <section>
            <h2 className="type-eyebrow mb-3 text-white/40">
              Synopsis
            </h2>
            <p className="max-w-2xl text-body leading-relaxed text-white/60">{synopsis}</p>
          </section>
        )}

        {poster && (
          <section>
            <h2 className="type-eyebrow mb-4 text-white/40">
              Cast &amp; Crew
            </h2>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
              <Thumb label={movie.crew?.split(/[,·]/)[0]?.trim() ?? "Crew"} src={poster} />
              {movie.youtubeId && (
                <Thumb
                  label="Behind the Scenes"
                  src={`https://img.youtube.com/vi/${movie.youtubeId}/hqdefault.jpg`}
                />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Thumb({ src, label }: { src: string; label: string }) {
  return (
    <div className="shrink-0">
      <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-[#1a1a1a]">
        <Image src={src} alt="" fill className="object-cover" sizes="80px" />
      </div>
      <p className="type-meta mt-2 max-w-[5rem] truncate text-caption text-white/45">{label}</p>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
        disabled
          ? "cursor-not-allowed border-white/10 text-white/25"
          : active
            ? "border-white/40 text-white"
            : "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 3v12M7 14l5 5 5-5M5 21h14" />
    </svg>
  );
}

function WatchlistIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4h10l1 14-6 4-6-4L7 4z" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M7 4h10l1 14-6 4-6-4L7 4z" />
    </svg>
  );
}
