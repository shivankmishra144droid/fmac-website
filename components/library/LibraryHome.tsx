"use client";

import { useMemo, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Movie } from "@prisma/client";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import {
  filterTenuresFrom2022,
  getMoviePublishedAt,
  groupMoviesByTenure,
  type TenureGroup,
} from "@/lib/tenure";
import { getMovieContentType } from "@/lib/content-type";
import {
  filterMoviesByCategory,
  getCategoryBySlug,
  parseCategorySlug,
  type LibraryCategorySlug,
} from "@/lib/library-categories";
import { LandscapeCard } from "./PosterCard";
import { CategoryPillBar } from "./CategoryPillBar";

type LibraryHomeProps = {
  movies: Movie[];
  awardTitles: Set<string>;
  dbConnected?: boolean;
  dbSeeded?: boolean;
};

export function LibraryHome(props: LibraryHomeProps) {
  return <LibraryHomeInner {...props} />;
}

function LibraryHomeInner({
  movies,
  awardTitles,
  dbConnected,
  dbSeeded,
}: LibraryHomeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [, startTransition] = useTransition();

  const activeCategory = parseCategorySlug(searchParams.get("category"));

  const published = useMemo(() => movies.filter((m) => m.youtubeId), [movies]);

  const tenures = useMemo(
    () => filterTenuresFrom2022(groupMoviesByTenure(published)),
    [published]
  );

  const categoryMovies = useMemo(() => {
    if (!activeCategory) return [];
    return filterMoviesByCategory(published, activeCategory);
  }, [published, activeCategory]);

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

  const exitDuration = reduceMotion ? 0.08 : 0.15;
  const enterDuration = reduceMotion ? 0.1 : 0.22;
  const stagger = reduceMotion ? 0 : 0.05;

  const viewMotion = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: enterDuration, ease: [0.22, 1, 0.36, 1] },
    },
    exit: reduceMotion
      ? { opacity: 0, transition: { duration: exitDuration } }
      : { opacity: 0, y: 8, transition: { duration: exitDuration, ease: [0.4, 0, 1, 1] } },
  };

  const listMotion = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: reduceMotion ? 0 : 0.04 },
    },
  };

  const itemMotion = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: enterDuration, ease: [0.22, 1, 0.36, 1] },
    },
  };

  if (movies.length === 0) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="text-label text-white/50">No films synced yet.</p>
        <p className="type-meta mt-2 text-white/30">
          Run <code className="text-white/50">npm run db:seed</code> after setting up Postgres.
        </p>
      </div>
    );
  }

  const viewKey = activeCategory ?? "all";

  return (
    <div className="pb-28 pt-4">
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="type-display-heading text-display-sm text-white/90">
          Library
        </h1>
      </div>

      <div className="mt-4 px-4 sm:px-6 lg:px-8">
        <CategoryPillBar activeSlug={activeCategory} onSelect={selectCategory} />
      </div>

      {dbConnected === false && (
        <StatusBanner className="mt-6">
          Showing demo films. Postgres is not running.
        </StatusBanner>
      )}
      {dbConnected === true && dbSeeded === false && (
        <StatusBanner className="mt-6">
          Database is empty. Run <code className="text-white/65">npm run db:seed</code> to load films.
        </StatusBanner>
      )}

      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait" initial={false}>
          {activeCategory ? (
            <motion.div key={viewKey} {...viewMotion}>
              <CategorySection
                slug={activeCategory}
                movies={categoryMovies}
                awardTitles={awardTitles}
                listMotion={listMotion}
                itemMotion={itemMotion}
              />
            </motion.div>
          ) : (
            <motion.div key="all" {...viewMotion}>
              <motion.div variants={listMotion} initial="hidden" animate="show">
                <div className="space-y-10">
                  {tenures.map((group) => (
                    <motion.div key={group.label + group.startYear} variants={itemMotion}>
                      <TenureRow group={group} awardTitles={awardTitles} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusBanner({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mx-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-label text-white/45 sm:mx-6 lg:mx-8 ${className}`}
    >
      {children}
    </p>
  );
}

function CategorySection({
  slug,
  movies,
  awardTitles,
  listMotion,
  itemMotion,
}: {
  slug: LibraryCategorySlug;
  movies: Movie[];
  awardTitles: Set<string>;
  listMotion: Variants;
  itemMotion: Variants;
}) {
  const category = getCategoryBySlug(slug);

  return (
    <section>
      <div className="mb-6">
        <p className="type-eyebrow text-white/40">Browsing</p>
        <h2 className="type-display-heading mt-1 text-display-sm text-white/85">
          {category.label}{" "}
          <span className="type-meta font-normal normal-case text-white/40">
            · {movies.length} {movies.length === 1 ? "film" : "films"}
          </span>
        </h2>
      </div>

      {movies.length === 0 ? (
        <p className="py-16 text-center text-label text-white/40">
          No films in this category yet.
        </p>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          variants={listMotion}
          initial="hidden"
          animate="show"
        >
          {movies.map((movie) => (
            <motion.div key={movie.id} variants={itemMotion}>
              <LandscapeCard
                movie={movie}
                fluid
                awardWinner={awardTitles.has(movie.title.toLowerCase())}
                isAajaMarker={getMovieContentType(movie) === "AAJA"}
                isFreshers={getMovieContentType(movie) === "FRESHERS"}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

function TenureRow({
  group,
  awardTitles,
}: {
  group: TenureGroup;
  awardTitles: Set<string>;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="type-display-heading text-display-sm tracking-display text-white/80">
          {group.displayLabel}
        </h2>
      </div>
      <div className="library-scroll flex items-start gap-2 overflow-x-auto pb-8 pt-3 sm:gap-2.5">
        {group.films.map((movie) => (
          <LandscapeCard
            key={movie.id}
            movie={movie}
            awardWinner={awardTitles.has(movie.title.toLowerCase())}
            isAajaMarker={group.aajaFilm?.id === movie.id}
            isFreshers={getMovieContentType(movie) === "FRESHERS"}
          />
        ))}
      </div>
    </section>
  );
}
