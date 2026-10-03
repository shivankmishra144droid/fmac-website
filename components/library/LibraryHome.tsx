"use client";

import { useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Movie } from "@prisma/client";
import { motion, useReducedMotion } from "framer-motion";
import { filterTenuresFrom2022, groupMoviesByTenure, type TenureGroup } from "@/lib/tenure";
import { getMovieContentType } from "@/lib/content-type";
import {
  LIBRARY_CATEGORIES,
  filterMoviesByCategory,
  getCategoryBySlug,
  parseCategorySlug,
  type LibraryCategorySlug,
} from "@/lib/library-categories";
import { FilmCard } from "./FilmCard";

const EASE = [0.22, 1, 0.36, 1] as const;

type LibraryHomeProps = {
  movies: Movie[];
  awardTitles: Set<string>;
  dbConnected?: boolean;
  dbSeeded?: boolean;
};

/** Corner tag for a card: Aaja / Freshers markers first, then award winners. */
function cardTag(movie: Movie, awardTitles: Set<string>, aajaId?: string | null): string | null {
  const type = getMovieContentType(movie);
  if (movie.id === aajaId || type === "AAJA") return "Aaja";
  if (type === "FRESHERS") return "Freshers";
  if (movie.isFmacSelect || awardTitles.has(movie.title.toLowerCase())) return "Select";
  return null;
}

export function LibraryHome({ movies, awardTitles, dbConnected, dbSeeded }: LibraryHomeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const [, startTransition] = useTransition();

  const activeCategory = parseCategorySlug(searchParams.get("category"));
  const published = useMemo(() => movies.filter((m) => m.youtubeId), [movies]);
  const tenures = useMemo(
    () => filterTenuresFrom2022(groupMoviesByTenure(published)),
    [published]
  );
  const categoryMovies = useMemo(
    () => (activeCategory ? filterMoviesByCategory(published, activeCategory) : []),
    [published, activeCategory]
  );

  const selectCategory = useCallback(
    (slug: LibraryCategorySlug | null) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (slug) params.set("category", slug);
        else params.delete("category");
        const query = params.toString();
        router.push(query ? `/library?${query}` : "/library", { scroll: false });
      });
    },
    [router, searchParams, startTransition]
  );

  // Enter-only: keyed views swap instantly and fade in (no exit wait that could strand a blank view).
  const view = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  };

  const tabs: { slug: LibraryCategorySlug | null; label: string }[] = [
    { slug: null, label: "By tenure" },
    ...LIBRARY_CATEGORIES.map((c) => ({ slug: c.slug, label: c.label })),
  ];

  return (
    <div className="pb-32">
      {/* Header */}
      <header className="px-5 pb-12 pt-36 md:px-24 md:pb-16 md:pt-48">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="headline text-[clamp(3.25rem,9vw,9rem)] text-bone">
              The <span className="italic text-bone/60">library.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-bone/60 md:text-lg">
              Every FMAC film, grouped by tenure. Each year opens with its Aaja.
            </p>
          </div>
          <p className="kicker text-bone/40 md:text-right">
            <span className="block font-serif text-6xl normal-case tracking-normal text-bone">
              {published.length}
            </span>
            Films on the shelf
          </p>
        </div>

        {/* Category tabs */}
        <nav
          aria-label="Browse by"
          className="no-scrollbar -mx-5 mt-14 flex gap-8 overflow-x-auto border-b border-hairline px-5 md:mx-0 md:px-0"
        >
          {tabs.map((t) => {
            const on = t.slug === activeCategory;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => selectCategory(t.slug)}
                aria-current={on ? "page" : undefined}
                className={`kicker relative shrink-0 pb-4 transition-colors ${
                  on ? "text-bone" : "text-bone/40 hover:text-bone/75"
                }`}
              >
                {t.label}
                {on && (
                  <motion.span
                    layoutId="library-tab"
                    className="absolute inset-x-0 -bottom-px h-px bg-beam"
                    transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {dbConnected === false && (
          <p className="kicker mt-6 text-bone/30">Offline catalogue · database not connected</p>
        )}
        {dbConnected === true && dbSeeded === false && (
          <p className="kicker mt-6 text-bone/30">Database is empty · run npm run db:seed</p>
        )}
      </header>

      {movies.length === 0 ? (
        <p className="px-5 py-24 text-center text-bone/50 md:px-24">No films synced yet.</p>
      ) : (
        <>
          {activeCategory ? (
            <motion.div key={activeCategory} {...view} className="px-5 md:px-24">
              <CategoryGrid slug={activeCategory} movies={categoryMovies} awardTitles={awardTitles} />
            </motion.div>
          ) : (
            <motion.div key="tenures" {...view} className="space-y-20 md:space-y-28">
              {tenures.map((group, i) => (
                <TenureRow key={group.label + group.startYear} group={group} awardTitles={awardTitles} eager={i === 0} />
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

function tenureTitle(group: TenureGroup): string {
  if (group.startYear > 0) return `${group.startYear} – ${String(group.startYear + 1).slice(-2)}`;
  if (group.label === "founding") return "Founding years";
  if (group.label === "undated") return "Undated";
  return "Catalogue";
}

function TenureRow({
  group,
  awardTitles,
  eager,
}: {
  group: TenureGroup;
  awardTitles: Set<string>;
  eager?: boolean;
}) {
  const id = `tenure-${group.label}`;
  return (
    <section id={id} data-rail={tenureTitle(group)} aria-labelledby={`${id}-h`}>
      <div className="mb-6 flex items-end justify-between gap-6 px-5 md:px-24">
        <h2 id={`${id}-h`} className="headline text-[clamp(2.25rem,4.5vw,4rem)] text-bone">
          {tenureTitle(group)}
        </h2>
        <p className="kicker shrink-0 pb-2 text-bone/40">
          {group.films.length} {group.films.length === 1 ? "film" : "films"}
        </p>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-2 md:scroll-px-24 md:px-24">
        {group.films.map((movie, i) => (
          <FilmCard
            key={movie.id}
            movie={movie}
            tag={cardTag(movie, awardTitles, group.aajaFilm?.id)}
            priority={eager && i < 3}
          />
        ))}
        {/* Trailing spacer so the last card can snap clear of the right gutter. */}
        <span aria-hidden className="w-px shrink-0" />
      </div>
    </section>
  );
}

function CategoryGrid({
  slug,
  movies,
  awardTitles,
}: {
  slug: LibraryCategorySlug;
  movies: Movie[];
  awardTitles: Set<string>;
}) {
  const category = getCategoryBySlug(slug);
  return (
    <section>
      <div className="mb-10 flex items-end justify-between gap-6">
        <h2 className="headline text-[clamp(2.25rem,4.5vw,4rem)] text-bone">{category.label}</h2>
        <p className="kicker shrink-0 pb-2 text-bone/40">
          {movies.length} {movies.length === 1 ? "film" : "films"}
        </p>
      </div>
      {movies.length === 0 ? (
        <p className="py-16 text-center text-bone/40">No films in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {movies.map((movie, i) => (
            <FilmCard key={movie.id} movie={movie} fluid tag={cardTag(movie, awardTitles)} priority={i < 3} />
          ))}
        </div>
      )}
    </section>
  );
}
