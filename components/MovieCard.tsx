"use client";

import Link from "next/link";
import { formatRuntime } from "@/lib/youtube";
import type { MovieCategory } from "@prisma/client";

export type MovieCardData = {
  id: string;
  title: string;
  tagline?: string | null;
  releaseYear: number;
  posterUrl?: string | null;
  runtimeSeconds?: number | null;
  category?: MovieCategory;
  isLatestRelease?: boolean;
  isFmacSelect?: boolean;
  youtubeId?: string | null;
};

export function MovieCard({ movie }: { movie: MovieCardData }) {
  const poster =
    movie.posterUrl ??
    (movie.youtubeId
      ? `https://img.youtube.com/vi/${movie.youtubeId}/hqdefault.jpg`
      : null);

  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-800/80 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] hover:border-marquee/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.55),0_0_30px_rgba(234,179,8,0.08)]"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-ink-700">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-[0.55] group-hover:saturate-50"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900">
            <span className="px-4 text-center font-display text-xl text-parchment/20">
              {movie.title}
            </span>
          </div>
        )}

        {/* Grain on hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-[0.35] [background-image:repeating-conic-gradient(rgba(255,255,255,0.03)_0%_25%,transparent_0%_50%)] [background-size:4px_4px]" />

        {(movie.isFmacSelect || movie.isLatestRelease) && (
          <span className="absolute right-2 top-2 rounded-full border border-marquee/40 bg-ink-900/90 px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-marquee backdrop-blur-sm">
            {movie.isLatestRelease ? "Latest" : "FMAC Select"}
          </span>
        )}

        {/* Metadata slides up on hover (Reference B) */}
        <div className="absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-ink-950 via-ink-950/90 to-transparent p-4 opacity-90 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-marquee/90">
            {movie.releaseYear}
            {movie.runtimeSeconds ? ` · ${formatRuntime(movie.runtimeSeconds)}` : ""}
          </p>
          <h3 className="mt-1 font-display text-lg font-normal uppercase leading-tight tracking-tight text-parchment">
            {movie.title}
          </h3>
          {movie.tagline && (
            <p className="mt-1 line-clamp-2 font-mono text-[11px] text-parchment/55 opacity-0 transition-opacity group-hover:opacity-100">
              {movie.tagline}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
