"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { formatRuntime } from "@/lib/youtube";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & DEFAULTS
   ───────────────────────────────────────────────────────────────────────────── */

export type HeroMovie = {
  title: string;
  tagline?: string | null;
  releaseYear?: number | null;
  runtimeSeconds?: number | null;
  format?: string | null;
  crew?: string | null;
  posterUrl?: string | null;
  youtubeId?: string | null;
  watchHref?: string;
  infoHref?: string;
};

const DEFAULT: Required<Omit<HeroMovie, "posterUrl" | "youtubeId">> & {
  posterUrl: string | null;
  youtubeId: string | null;
} = {
  title: "Portrait of My Grandfather",
  tagline: "A slice-of-life drama about memory, family, and the stories we inherit.",
  releaseYear: 2026,
  runtimeSeconds: 583,
  format: "Digital",
  crew: "Film Making Club, BITS Goa",
  posterUrl: "https://img.youtube.com/vi/dJFUC_qrvyg/maxresdefault.jpg",
  youtubeId: "dJFUC_qrvyg",
  watchHref: "/library/portrait-of-my-grandfather",
  infoHref: "/library/portrait-of-my-grandfather",
};

/** Tiny dark blur placeholder for next/image LCP. */
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAnIGhlaWdodD0nMTAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zz48cmVjdCB3aWR0aD0nMTAnIGhlaWdodD0nMTAnIGZpbGw9JyMwYjA5MDYnLz48L3N2Zz4=";

/** Split title into two cinematic lines (last word on line 2 for underline treatment). */
function splitTitle(title: string): [string, string | null] {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) return [title, null];
  if (words.length === 2) return [words[0]!, words[1]!];
  return [words.slice(0, -1).join(" "), words.at(-1)!];
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────────────────────────────────────── */

export function Hero({ movie }: { movie?: HeroMovie }) {
  const m = { ...DEFAULT, ...movie };
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  const bgSrc =
    m.posterUrl ??
    (m.youtubeId
      ? `https://img.youtube.com/vi/${m.youtubeId}/maxresdefault.jpg`
      : DEFAULT.posterUrl!);

  const [lineOne, lineTwo] = useMemo(() => splitTitle(m.title), [m.title]);
  const meta = [m.releaseYear?.toString(), formatRuntime(m.runtimeSeconds)].filter(Boolean);

  /* Detect touch / coarse pointer — swap mouse parallax for ambient drift. */
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setIsTouch(coarse || "ontouchstart" in window);
  }, []);

  /* ── SCROLL PARALLAX ───────────────────────────────────────────────────────
     Background moves slower than foreground; content fades + scales back
     as the user scrolls past the hero into the next section.              */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgScrollY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const fgScrollY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 0.75, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);

  /* ── MOUSE PARALLAX (desktop only) ─────────────────────────────────────────
     Background + title shift 2–4 px opposite cursor for subtle 3D tilt.   */
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const mouseX = useSpring(rawMouseX, { stiffness: 60, damping: 22, mass: 0.6 });
  const mouseY = useSpring(rawMouseY, { stiffness: 60, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (reduceMotion || isTouch) return;
    const el = sectionRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      rawMouseX.set(-nx * 8);
      rawMouseY.set(-ny * 6);
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [reduceMotion, isTouch, rawMouseX, rawMouseY]);

  const bgMouseX = useTransform(mouseX, (v) => v * 0.35);
  const bgMouseY = useTransform(mouseY, (v) => v * 0.35);
  const titleMouseX = useTransform(mouseX, (v) => v * 0.15);
  const titleMouseY = useTransform(mouseY, (v) => v * 0.15);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-ink"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          BACKGROUND — full-bleed still, Ken Burns, scroll + mouse parallax
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={reduceMotion ? undefined : { y: bgScrollY, x: bgMouseX }}
      >
        <motion.div
          className="absolute inset-[-8%]"
          style={reduceMotion ? undefined : { y: bgMouseY }}
          animate={
            reduceMotion
              ? undefined
              : isTouch
                ? {
                    x: [0, 12, -8, 0],
                    y: [0, -10, 6, 0],
                    scale: [1, 1.04, 1.02, 1],
                  }
                : {
                    scale: [1, 1.09],
                    x: ["0%", "-2.5%"],
                    y: ["0%", "-1.5%"],
                  }
          }
          transition={
            reduceMotion
              ? undefined
              : isTouch
                ? { duration: 22, repeat: Infinity, ease: "easeInOut" }
                : { duration: 26, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
          }
        >
          <Image
            src={bgSrc}
            alt=""
            fill
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>

        {/* Gradient: darkest where title sits (center), lighter at edges */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 75% 65% at 50% 42%, rgba(8,6,4,0.94) 0%, rgba(8,6,4,0.72) 50%, rgba(8,6,4,0.38) 100%)",
              "linear-gradient(to bottom, rgba(8,6,4,0.15) 0%, rgba(8,6,4,0.55) 55%, rgba(11,9,6,1) 100%)",
              "linear-gradient(to right, rgba(8,6,4,0.25) 0%, transparent 18%, transparent 82%, rgba(8,6,4,0.25) 100%)",
            ].join(", "),
          }}
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          GRAIN — animated canvas texture scoped to hero (~4% opacity)
          ═══════════════════════════════════════════════════════════════════════ */}
      <HeroGrain reduceMotion={Boolean(reduceMotion)} />

      {/* ═══════════════════════════════════════════════════════════════════════
          FOREGROUND — eyebrow, title, meta, CTAs (scroll-reveal + parallax)
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-5xl px-6 py-32 text-center sm:px-12 sm:py-36"
        style={
          reduceMotion
            ? undefined
            : {
                y: fgScrollY,
                opacity: contentOpacity,
                scale: contentScale,
                x: titleMouseX,
              }
        }
      >
        {/* Eyebrow — projector warming up, appears before title */}
        <motion.p
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="mb-8 font-mono text-[10px] uppercase tracking-[0.32em] text-parchment/45 sm:mb-10"
        >
          Latest release · {m.releaseYear}
        </motion.p>

        {/* Title — staggered line reveal with blur-to-sharp */}
        <motion.h1
          className="font-sans text-[clamp(2.25rem,7.5vw,5.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-parchment film-title"
          style={
            reduceMotion
              ? { textShadow: "0 2px 24px rgba(0,0,0,0.85)" }
              : { y: titleMouseY, textShadow: "0 2px 24px rgba(0,0,0,0.85)" }
          }
        >
          <TitleLine delay={0.12} reduceMotion={Boolean(reduceMotion)}>
            {lineOne}
          </TitleLine>
          {lineTwo && (
            <>
              <br />
              <TitleLine delay={0.27} reduceMotion={Boolean(reduceMotion)} accent>
                {lineTwo}
              </TitleLine>
            </>
          )}
        </motion.h1>

        {m.tagline && (
          <motion.p
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, delay: 0.42, ease: EASE_OUT }}
            className="mx-auto mt-8 max-w-md text-[15px] leading-[1.65] text-parchment/55 sm:mt-10 sm:max-w-lg sm:text-base"
          >
            {m.tagline}
          </motion.p>
        )}

        {meta.length > 0 && (
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.52, ease: EASE_OUT }}
            className="mt-10 flex items-center justify-center gap-3 sm:mt-12"
          >
            <RecIndicator reduceMotion={Boolean(reduceMotion)} />
            <p className="font-mono text-[10px] tracking-[0.12em] text-parchment/35">
              {meta.join(" · ")}
            </p>
          </motion.div>
        )}

        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.62, ease: EASE_OUT }}
          className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:mt-16"
        >
          <WatchNowButton href={m.watchHref} reduceMotion={Boolean(reduceMotion)} />
          <MoreInfoButton href={m.infoHref} reduceMotion={Boolean(reduceMotion)} />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TITLE LINE — staggered fade-up + blur; accent line gets underline sweep
   ───────────────────────────────────────────────────────────────────────────── */

function TitleLine({
  children,
  delay,
  accent,
  reduceMotion,
}: {
  children: React.ReactNode;
  delay: number;
  accent?: boolean;
  reduceMotion: boolean;
}) {
  if (accent) {
    return (
      <motion.span
        className="relative inline-block"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.72, delay, ease: EASE_OUT }}
      >
        {/* Soft color wash behind accent word */}
        <motion.span
          aria-hidden
          className="absolute -inset-x-3 -inset-y-1 rounded-sm bg-[#c9a86c]/[0.08]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: delay + 0.35, ease: "easeOut" }}
        />
        <span className="relative">{children}</span>
        {/* Underline reveal sweep */}
        <motion.span
          aria-hidden
          className="absolute -bottom-1 left-0 h-[3px] rounded-full bg-gradient-to-r from-[#c9a86c]/90 via-[#e8d5a8]/70 to-[#c9a86c]/40"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.6, delay: delay + 0.55, ease: EASE_OUT }}
        />
      </motion.span>
    );
  }

  return (
    <motion.span
      className="inline-block"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.72, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   REC + WAVEFORM — subtle "this is a real film" motion cue
   ───────────────────────────────────────────────────────────────────────────── */

function RecIndicator({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <motion.span
        className="relative flex h-2 w-2 items-center justify-center"
        animate={reduceMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500/40 blur-[2px]" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500/90" />
      </motion.span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-red-400/50">
        Rec
      </span>
      <WaveformBars reduceMotion={reduceMotion} />
    </div>
  );
}

function WaveformBars({ reduceMotion }: { reduceMotion: boolean }) {
  const heights = [3, 6, 4, 7, 3, 5];
  return (
    <div className="flex h-3 items-end gap-[2px] opacity-40">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-parchment/60"
          style={{ height: h }}
          animate={
            reduceMotion
              ? undefined
              : { scaleY: [0.4, 1, 0.55, 0.85, 0.4] }
          }
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: i * 0.12,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CTA BUTTONS — Watch Now (play slide + glow) / More Info (border shimmer)
   ───────────────────────────────────────────────────────────────────────────── */

function WatchNowButton({ href, reduceMotion }: { href: string; reduceMotion: boolean }) {
  return (
    <motion.div whileHover={reduceMotion ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className="group relative inline-flex items-center overflow-hidden rounded-full bg-parchment px-6 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink"
      >
        {/* Hover glow bloom */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-parchment opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40"
        />
        <span className="relative flex items-center gap-0 transition-all duration-300 group-hover:gap-2">
          <motion.span
            aria-hidden
            className="flex w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:w-3.5 group-hover:opacity-100"
            initial={false}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.span>
          Watch now
        </span>
      </Link>
    </motion.div>
  );
}

function MoreInfoButton({ href, reduceMotion }: { href: string; reduceMotion: boolean }) {
  return (
    <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className="group relative inline-flex items-center overflow-hidden rounded-full border border-parchment/20 px-6 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-parchment/60"
      >
        {/* Border shimmer sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(239,230,211,0.15) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: reduceMotion ? undefined : "hero-shimmer 1.4s ease-in-out infinite",
          }}
        />
        <span className="relative transition-colors duration-300 group-hover:border-parchment/40 group-hover:text-parchment/85">
          More info
        </span>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO GRAIN — lightweight canvas noise, hero-scoped only
   ───────────────────────────────────────────────────────────────────────────── */

function HeroGrain({ reduceMotion }: { reduceMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const TILE = 128;
    const tile = document.createElement("canvas");
    tile.width = TILE;
    tile.height = TILE;
    const tileCtx = tile.getContext("2d");

    let raf = 0;
    let last = 0;
    const fps = 18;
    const interval = 1000 / fps;

    const drawGrain = () => {
      if (!tileCtx) return;
      const image = tileCtx.createImageData(TILE, TILE);
      const buf = image.data;
      for (let i = 0; i < buf.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        buf[i] = v;
        buf[i + 1] = (v * 0.95) | 0;
        buf[i + 2] = (v * 0.88) | 0;
        buf[i + 3] = v;
      }
      tileCtx.putImageData(image, 0, 0);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pattern = ctx.createPattern(tile, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < interval) return;
      last = t;
      drawGrain();
    };

    drawGrain();
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    const onResize = () => drawGrain();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full mix-blend-overlay"
      style={{ opacity: 0.04 }}
    />
  );
}
