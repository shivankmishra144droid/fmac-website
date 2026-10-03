"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { YouTubeBackdrop } from "@/components/editorial/YouTubeBackdrop";
import { scrollToTarget } from "@/components/editorial/SmoothScroll";

export type FocusHeroFilm = {
  title: string;
  tagline: string | null;
  year: number;
  runtime: string;
  href: string;
  youtubeId: string | null;
  /** Best-quality still; may 404 on older uploads, so `fallbackImage` is tried next. */
  image: string | null;
  fallbackImage: string | null;
  /** `image` is a letterboxed frame inside 16:9 — zoom past the black bars (and any burnt-in subtitles). */
  letterboxed?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Opening shot: full-bleed still that racks from soft to sharp focus on load,
 * then (desktop) dissolves into a muted loop of the film itself.
 */
export function FocusHero({ film }: { film: FocusHeroFilm }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [src, setSrc] = useState(film.image ?? film.fallbackImage);
  const [loaded, setLoaded] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.25]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  const meta = ["Now showing", String(film.year), film.runtime].filter(Boolean).join(" · ");
  const words = film.title.split(/\s+/);

  return (
    <section
      ref={ref}
      id="now-showing"
      data-rail="Now showing"
      className="relative isolate h-[100svh] min-h-[560px] overflow-hidden bg-stage"
    >
      {/* Media */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={reduce ? undefined : { scale: mediaScale, opacity: mediaOpacity }}
      >
        {src && (
          <div
            className="absolute inset-0"
            style={film.letterboxed && src === film.image ? { transform: "scale(1.5)" } : undefined}
          >
          <Image
            src={src}
            alt=""
            fill
            priority
            sizes="100vw"
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (src !== film.fallbackImage && film.fallbackImage) setSrc(film.fallbackImage);
            }}
            className={`object-cover transition-[filter,transform,opacity] ease-out ${
              reduce ? "duration-0" : "duration-[2200ms]"
            } ${loaded ? "scale-100 opacity-100 blur-0" : "scale-[1.08] opacity-60 blur-2xl"}`}
          />
          </div>
        )}
        {film.youtubeId && <YouTubeBackdrop youtubeId={film.youtubeId} start={30} delayMs={2600} />}
        {/* Grade: lift the type off the image, sink the edges. */}
        <div className="absolute inset-0 bg-gradient-to-t from-stage via-stage/45 to-stage/65" />
        {/* Solid floor: auto-generated frames often carry burnt-in subtitles along the bottom. */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-stage from-35% to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(11,10,9,0.75)_100%)]" />
      </motion.div>

      {/* Copy */}
      <motion.div
        style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}
        className="flex h-full flex-col justify-end px-5 pb-24 md:px-24 md:pb-28"
      >
        <motion.p
          className="kicker mb-6 flex items-center gap-3 text-bone/70"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-beam opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-beam" />
          </span>
          {meta}
        </motion.p>

        <h1 className="headline max-w-[14ch] text-[clamp(3.25rem,9.5vw,9.5rem)] text-bone">
          {words.map((w, i) => (
            <span key={`${w}-${i}`} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom last:mr-0">
              <motion.span
                className={`inline-block ${i === words.length - 1 ? "italic" : ""}`}
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.7 + i * 0.07 }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 1.1 }}
        >
          {film.tagline && (
            <p className="max-w-md text-base leading-relaxed text-bone/75 md:text-lg">{film.tagline}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={film.href}
              className="kicker group inline-flex items-center gap-3 bg-bone px-5 py-3.5 text-stage transition-colors hover:bg-beam"
            >
              Watch the film
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/library"
              className="kicker inline-flex items-center gap-3 border border-bone/30 px-5 py-3.5 text-bone transition-colors hover:border-bone"
            >
              Browse the library
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <button
        type="button"
        onClick={() => {
          const next = ref.current?.nextElementSibling;
          if (next instanceof HTMLElement) scrollToTarget(next);
        }}
        className="kicker absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-bone/45 transition-colors hover:text-bone md:flex"
      >
        Scroll
        <span className="relative block h-10 w-px overflow-hidden bg-bone/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_2.2s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-bone" />
        </span>
      </button>
    </section>
  );
}
