"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import {
  LIBRARY_CATEGORIES,
  type LibraryCategorySlug,
} from "@/lib/library-categories";

type Tab = {
  key: string;
  slug: LibraryCategorySlug | null;
  label: string;
};

type ChipMetrics = { left: number; width: number };

type CategoryPillBarProps = {
  activeSlug: LibraryCategorySlug | null;
  onSelect: (slug: LibraryCategorySlug | null) => void;
};

const TABS: Tab[] = [
  { key: "all", slug: null, label: "All" },
  ...LIBRARY_CATEGORIES.map((c) => ({
    key: c.slug,
    slug: c.slug,
    label: c.shortLabel,
  })),
];

const SLIDE: Transition = { duration: 0.2, ease: [0.33, 1, 0.68, 1] };
const HOVER_FADE: Transition = { duration: 0.15, ease: "easeOut" };

const CHIP_H = 46;

export function CategoryPillBar({ activeSlug, onSelect }: CategoryPillBarProps) {
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeKey = activeSlug ?? "all";
  const [activeMetrics, setActiveMetrics] = useState<ChipMetrics | null>(null);
  const [hoverMetrics, setHoverMetrics] = useState<ChipMetrics | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [pressingKey, setPressingKey] = useState<string | null>(null);

  /** Measure chip bounds relative to the track (not offsetParent — avoids wrapper drift). */
  const measure = useCallback((key: string): ChipMetrics | null => {
    const el = chipRefs.current.get(key);
    const track = trackRef.current;
    if (!el || !track) return null;

    const elRect = el.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();

    return {
      left: elRect.left - trackRect.left,
      width: elRect.width,
    };
  }, []);

  const syncMetrics = useCallback(() => {
    setActiveMetrics(measure(activeKey));
    if (hoverKey) setHoverMetrics(measure(hoverKey));
  }, [activeKey, hoverKey, measure]);

  useEffect(() => {
    syncMetrics();
    window.addEventListener("resize", syncMetrics);
    return () => window.removeEventListener("resize", syncMetrics);
  }, [syncMetrics]);

  useEffect(() => {
    const el = chipRefs.current.get(activeKey);
    el?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      inline: "nearest",
      block: "nearest",
    });
    requestAnimationFrame(syncMetrics);
  }, [activeKey, reduceMotion, syncMetrics]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => syncMetrics());
    ro.observe(track);
    return () => ro.disconnect();
  }, [syncMetrics]);

  function setChipRef(key: string, node: HTMLButtonElement | null) {
    if (node) chipRefs.current.set(key, node);
    else chipRefs.current.delete(key);
    if (node) requestAnimationFrame(syncMetrics);
  }

  function onHoverEnter(key: string) {
    if (key === activeKey) {
      setHoverKey(null);
      setHoverMetrics(null);
      return;
    }
    setHoverKey(key);
    setHoverMetrics(measure(key));
  }

  function onHoverLeave() {
    setHoverKey(null);
    setHoverMetrics(null);
  }

  function handleSelect(key: string, slug: LibraryCategorySlug | null) {
    if (!reduceMotion) {
      setPressingKey(key);
      window.setTimeout(() => setPressingKey(null), 180);
    }
    onSelect(slug);
  }

  const showBlock = activeMetrics && activeMetrics.width > 0;
  const showHoverOutline =
    hoverMetrics && hoverKey && hoverKey !== activeKey && !reduceMotion;

  const rowEntrance = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.04, delayChildren: 0.06 },
        },
      };

  const chipEntrance = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0, x: -14 },
        show: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.22, ease: [0.33, 1, 0.68, 1] },
        },
      };

  return (
    <div className="sticky top-[57px] z-30 w-full pb-5 pt-2">
      <p className="type-eyebrow text-white/40">
        Categories
      </p>
      <motion.div
        className="mb-4 mt-2.5 h-px bg-white/[0.08]"
        aria-hidden
        initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1], delay: 0.04 }}
        style={{ transformOrigin: "left center" }}
      />

      <div className="flex items-stretch justify-between gap-5">
        <div
          ref={scrollRef}
          className="no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain"
          onScroll={syncMetrics}
        >
          <motion.div
            ref={trackRef}
            className="relative inline-flex items-stretch"
            variants={rowEntrance}
            initial="hidden"
            animate="show"
          >
            {/* Active fill — sized exactly to the active chip rect */}
            {showBlock && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute top-0 z-[1] bg-marquee"
                style={{ height: CHIP_H }}
                initial={false}
                animate={{
                  left: activeMetrics.left,
                  width: activeMetrics.width,
                }}
                transition={reduceMotion ? { duration: 0.08 } : SLIDE}
              />
            )}

            <AnimatePresence>
              {showBlock && !reduceMotion && (
                <motion.span
                  key={activeKey}
                  aria-hidden
                  className="pointer-events-none absolute top-0 z-[2] bg-white/20 mix-blend-overlay"
                  style={{ height: CHIP_H }}
                  initial={{ opacity: 0.3 }}
                  animate={{
                    opacity: 0,
                    left: activeMetrics.left,
                    width: activeMetrics.width,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showHoverOutline && (
                <motion.span
                  key={`hover-${hoverKey}`}
                  aria-hidden
                  className="pointer-events-none absolute top-0 z-[1] border border-white/35 bg-transparent"
                  style={{ height: CHIP_H }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    left: hoverMetrics.left,
                    width: hoverMetrics.width,
                  }}
                  exit={{ opacity: 0 }}
                  transition={HOVER_FADE}
                />
              )}
            </AnimatePresence>

            {TABS.map(({ key, slug, label }, index) => {
              const isActive = activeKey === key;
              const isPressing = pressingKey === key;

              return (
                <motion.button
                  key={key}
                  ref={(node) => setChipRef(key, node)}
                  type="button"
                  variants={chipEntrance}
                  onClick={() => handleSelect(key, slug)}
                  onMouseEnter={() => onHoverEnter(key)}
                  onMouseLeave={onHoverLeave}
                  onFocus={() => onHoverEnter(key)}
                  onBlur={onHoverLeave}
                  animate={{ scale: isPressing && !reduceMotion ? 0.97 : 1 }}
                  transition={{ duration: 0.12, ease: [0.33, 1, 0.68, 1] }}
                  className={`relative z-10 flex shrink-0 items-center px-6 py-[14px] text-label transition-colors duration-150 ease-out ${
                    index > 0 ? "border-l border-white/10" : ""
                  } ${
                    isActive
                      ? `type-display-heading tracking-label text-[0.95rem] leading-none ${
                          reduceMotion && !showBlock ? "bg-marquee text-ink" : "text-ink"
                        }`
                      : "type-eyebrow tracking-label text-white/40 hover:text-white"
                  }`}
                  style={{ height: CHIP_H }}
                >
                  {label}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <motion.button
          type="button"
          aria-label="Search library"
          initial={reduceMotion ? false : { opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.28, ease: [0.33, 1, 0.68, 1] }}
          className="type-eyebrow hidden shrink-0 items-center gap-2 border border-white/10 px-5 tracking-label text-white/40 transition-colors duration-150 hover:border-white/30 hover:text-white/70 sm:flex"
          style={{ height: CHIP_H }}
        >
          <SearchIcon />
          Search
        </motion.button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}
