"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@prisma/client";
import { formatRuntime } from "@/lib/youtube";
import { movieHref } from "@/lib/slug";
import { LandscapeCard } from "./PosterCard";

const WATCHLIST_KEY = "fmac-watchlist";

export function getWatchlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setWatchlistIds(ids: string[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
}

export function toggleWatchlistId(id: string): string[] {
  const current = getWatchlistIds();
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  setWatchlistIds(next);
  return next;
}

export function WatchlistPage({ movies }: { movies: Movie[] }) {
  const [ids, setIds] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<number | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    setIds(getWatchlistIds());
  }, []);

  const watchlist = useMemo(() => {
    return movies.filter((m) => ids.includes(m.id));
  }, [movies, ids]);

  const filtered = useMemo(() => {
    return watchlist.filter((m) => {
      if (yearFilter !== "ALL" && m.releaseYear !== yearFilter) return false;
      if (categoryFilter !== "ALL" && m.category !== categoryFilter) return false;
      return true;
    });
  }, [watchlist, yearFilter, categoryFilter]);

  const featured = filtered[0] ?? watchlist[0];
  const rest = featured ? filtered.filter((m) => m.id !== featured.id) : filtered;

  const years = [...new Set(watchlist.map((m) => m.releaseYear))].sort((a, b) => b - a);

  if (watchlist.length === 0) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-label text-white/50">Your watchlist is empty.</p>
        <Link href="/library" className="mt-4 inline-block text-label font-medium text-marquee hover:underline">
          Browse the library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 pb-28 pt-6 sm:px-6">
      <div className="flex flex-wrap gap-2">
        <FilterPill active={categoryFilter === "ALL"} onClick={() => setCategoryFilter("ALL")}>
          All
        </FilterPill>
        {["MOVIE", "SHORT", "DOCUMENTARY", "EXPERIMENTAL"].map((cat) => (
          <FilterPill
            key={cat}
            active={categoryFilter === cat}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
          </FilterPill>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill active={yearFilter === "ALL"} onClick={() => setYearFilter("ALL")}>
          By Year
        </FilterPill>
        {years.map((y) => (
          <FilterPill key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>
            {y}
          </FilterPill>
        ))}
      </div>

      {featured && (
        <Link
          href={movieHref(featured)}
          className="group block overflow-hidden rounded-2xl bg-[#141414]"
        >
          <div className="relative aspect-[21/9] w-full">
            {(featured.posterUrl || featured.youtubeId) && (
              <Image
                src={
                  featured.posterUrl ??
                  `https://img.youtube.com/vi/${featured.youtubeId}/maxresdefault.jpg`
                }
                alt=""
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="100vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
            <div className="absolute bottom-0 p-6">
              <p className="type-eyebrow text-white/50">Featured</p>
              <h2 className="film-title mt-1 text-display-sm tracking-display text-white">{featured.title}</h2>
              <p className="type-meta mt-1 text-label text-white/50">
                {featured.releaseYear}
                {featured.runtimeSeconds
                  ? ` · ${formatRuntime(featured.runtimeSeconds)}`
                  : ""}
              </p>
            </div>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((movie) => (
            <LandscapeCard key={movie.id} movie={movie} fluid />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-label transition ${
        active
          ? "bg-marquee font-medium text-ink"
          : "border border-white/15 text-white/55 hover:border-marquee/40 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
