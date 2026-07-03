"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MovieCard } from "@/components/MovieCard";
import type { Movie } from "@prisma/client";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "LATEST", label: "Latest" },
  { key: "SHORT", label: "Shorts" },
  { key: "DOCUMENTARY", label: "Documentaries" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function MoviesGrid({ movies }: { movies: Movie[] }) {
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return movies;
    if (filter === "LATEST") return movies.filter((m) => m.isLatestRelease);
    return movies.filter((m) => m.category === filter);
  }, [movies, filter]);

  return (
    <div className="min-h-screen bg-ink">
      {/* Warm ambient glow behind grid (Reference B) */}
      <div className="pointer-events-none fixed inset-x-0 top-32 h-[60vh] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(234,179,8,0.12),transparent_70%)]" />

      <PageHeader
        eyebrow="The Filmography"
        title="Movies"
        description="Every frame we've committed to — streamed from the FMAC YouTube channel."
      />

      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-all ${
                filter === f.key
                  ? "bg-marquee text-ink-900"
                  : "border border-white/10 text-parchment/60 hover:border-marquee/40 hover:text-marquee"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center font-mono text-sm text-parchment/50">
            No films in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((m) => (
              <MovieCard
                key={m.id}
                movie={{
                  id: m.id,
                  title: m.title,
                  tagline: m.tagline,
                  releaseYear: m.releaseYear,
                  posterUrl: m.posterUrl,
                  runtimeSeconds: m.runtimeSeconds,
                  category: m.category,
                  isLatestRelease: m.isLatestRelease,
                  isFmacSelect: m.isFmacSelect,
                  youtubeId: m.youtubeId,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
