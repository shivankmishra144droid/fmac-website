"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
  type MotionValue,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { ambientEmbedUrl, useYouTubePlaying } from "@/components/editorial/YouTubeBackdrop";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & TUNING
   ───────────────────────────────────────────────────────────────────────────── */

export type FilmstripFilm = {
  id: string;
  title: string;
  year: number;
  href: string;
  thumbnailUrl: string;
  /** Real tiny blurred still (server-made); falls back to a flat dark placeholder. */
  blurDataURL?: string;
  youtubeId: string | null;
  /** Self-hosted 5s loop; preferred over the YouTube embed for hover previews. */
  previewClip?: string | null;
};

/** Cruise speed in px/s. Second row runs a touch slower for parallax. */
const BASE_SPEED = 42;
/** Fraction of cruise speed while the pointer is over a row. */
const HOVER_SPEED = 0.15;
/** Pointer travel (px) before a press becomes a drag and stops counting as a click. */
const DRAG_THRESHOLD = 6;
/** Hover dwell before the preview player loads, so a passing cursor doesn't spawn iframes. */
const PREVIEW_DELAY_MS = 650;
/** Where the hover preview starts, skipping logos/cold opens. */
const PREVIEW_START_S = 30;
/** Minimum cards per copy so one copy is always wider than the viewport. */
const MIN_CARDS_PER_COPY = 10;

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAnIGhlaWdodD0nMTAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zz48cmVjdCB3aWR0aD0nMTAnIGhlaWdodD0nMTAnIGZpbGw9JyMwYjA5MDYnLz48L3N2Zz4=";

/** Repeat a short catalogue until one copy comfortably overflows the viewport. */
function padFilms(films: FilmstripFilm[]): FilmstripFilm[] {
  if (films.length === 0) return films;
  const out: FilmstripFilm[] = [];
  while (out.length < MIN_CARDS_PER_COPY) out.push(...films);
  return out;
}

function useCanHover() {
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return canHover;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION
   ───────────────────────────────────────────────────────────────────────────── */

export function Filmstrip({ films }: { films: FilmstripFilm[] }) {
  const reduceMotion = useReducedMotion();
  const canHover = useCanHover();
  const sectionRef = useRef<HTMLElement>(null);

  // Section is pinned for its extra height; this drives the line-by-line heading reveal.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  // Page scroll velocity → strips surge and lean while you scroll, then settle (eased by a spring).
  const { scrollY } = useScroll();
  const scrollVelocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 300 });

  const rowA = useMemo(() => padFilms(films), [films]);

  if (films.length === 0) return null;

  const pinned = !reduceMotion;

  return (
    <section
      ref={sectionRef}
      id="the-reel"
      data-rail="The reel"
      aria-labelledby="filmstrip-heading"
      className={`relative bg-stage ${pinned ? "h-[230vh]" : "py-24 md:py-32"}`}
    >
      <div
        className={
          pinned
            ? "sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-16"
            : ""
        }
      >
        <div className="mb-10 grid gap-6 px-5 md:mb-12 md:grid-cols-[1fr_auto] md:items-end md:px-24">
          <h2
            id="filmstrip-heading"
            className="headline text-[clamp(2.5rem,min(6vw,9vh),6.5rem)] text-bone"
          >
            <RevealLine progress={scrollYProgress} range={[0.04, 0.3]} active={pinned}>
              Made on campus,
            </RevealLine>
            <RevealLine progress={scrollYProgress} range={[0.3, 0.56]} active={pinned}>
              <span className="italic text-bone/60">one frame at a time.</span>
            </RevealLine>
          </h2>
          <RevealLine as="div" progress={scrollYProgress} range={[0.56, 0.72]} active={pinned}>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <p className="kicker text-bone/55">
                <span className="[@media(hover:none)]:hidden">Hover to preview · drag to scrub</span>
                <span className="hidden [@media(hover:none)]:inline">Swipe to scrub · tap to watch</span>
              </p>
              <Link href="/library" className="kicker link-underline pb-0.5 text-bone/70 hover:text-bone">
                The full library →
              </Link>
            </div>
          </RevealLine>
        </div>

        {reduceMotion ? (
          <StaticRow films={films} />
        ) : (
          <div className="flex flex-col gap-5 sm:gap-6">
            {/* Same chronological order in both rows; row two starts half a loop in so they never line up. */}
            <MarqueeRow
              films={rowA}
              direction={-1}
              speed={BASE_SPEED}
              canHover={canHover}
              scrollVelocity={scrollVelocity}
            />
            <MarqueeRow
              films={rowA}
              startOffset={0.5}
              direction={1}
              speed={BASE_SPEED * 0.75}
              canHover={canHover}
              scrollVelocity={scrollVelocity}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/** One heading line that rises, sharpens and fades in across `range` of the pinned scroll. */
function RevealLine({
  children,
  progress,
  range,
  active,
  as = "span",
}: {
  /** "span" inside the heading (phrasing content only); "div" elsewhere. */
  as?: "span" | "div";
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  active: boolean;
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, ["0.6em", "0em"]);
  const filter = useTransform(progress, range, ["blur(8px)", "blur(0px)"]);

  const Tag = as === "div" ? motion.div : motion.span;
  return (
    <Tag className="block" style={active ? { opacity, y, filter } : undefined}>
      {children}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MARQUEE ROW — endless drift, hover slow-down, drag + fling
   ───────────────────────────────────────────────────────────────────────────── */

function MarqueeRow({
  films,
  direction,
  speed,
  canHover,
  startOffset = 0,
  scrollVelocity,
}: {
  films: FilmstripFilm[];
  direction: 1 | -1;
  speed: number;
  canHover: boolean;
  /** Fraction of one loop to start scrolled by. */
  startOffset?: number;
  /** Smoothed page scroll velocity (px/s). */
  scrollVelocity: MotionValue<number>;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  // Lean into the scroll: up to ±5° while scrolling hard, back to flat at rest.
  const skewX = useTransform(scrollVelocity, [-3000, 0, 3000], [5 * direction, 0, -5 * direction], {
    clamp: true,
  });

  /** Width of one copy of the films; the track holds two, and x wraps within [-loopWidth, 0). */
  const loopWidth = useRef(0);
  const speedFactor = useRef(1);
  const hovering = useRef(false);
  const visible = useRef(true);
  /** Leftover fling velocity (px/s) after a drag, decays back to the cruise. */
  const flingVelocity = useRef(0);

  const drag = useRef({
    pointerId: -1,
    startX: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    active: false,
    moved: false,
  });
  /** Set when a press turned into a drag, so the trailing click is swallowed. */
  const suppressClick = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let first = true;
    const measure = () => {
      loopWidth.current = track.scrollWidth / 2;
      if (first && startOffset) x.set(-loopWidth.current * startOffset);
      first = false;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [films, startOffset, x]);

  // Don't burn frames while the row is off-screen.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry?.isIntersecting ?? true;
    });
    io.observe(row);
    return () => io.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    const w = loopWidth.current;
    if (!w || !visible.current || drag.current.active) return;
    const dt = Math.min(delta, 64) / 1000;

    const target = hovering.current ? HOVER_SPEED : 1;
    // Ease toward the target so hover reads as "slowing down", not a hard stop.
    speedFactor.current += (target - speedFactor.current) * Math.min(1, dt * 4);

    flingVelocity.current *= Math.pow(0.04, dt);
    if (Math.abs(flingVelocity.current) < 1) flingVelocity.current = 0;

    // Scroll surge: up to 5× cruise while the page is moving fast, in the row's own direction.
    const surge = Math.min(5, Math.abs(scrollVelocity.get()) / 600);
    const next =
      x.get() + (direction * speed * (speedFactor.current + surge) + flingVelocity.current) * dt;
    x.set(wrap(-w, 0, next));
  });

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
      active: true,
      moved: false,
    };
    flingVelocity.current = 0;
    suppressClick.current = false;
    rowRef.current?.removeAttribute("data-dragged");
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;

    if (!d.moved) {
      if (Math.abs(e.clientX - d.startX) < DRAG_THRESHOLD) return;
      d.moved = true;
      // Capture only once it's a real drag — capturing on pointerdown would retarget the click away from the card link.
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const now = performance.now();
    const dx = e.clientX - d.lastX;
    const dt = Math.max(1, now - d.lastT);
    d.velocity = d.velocity * 0.6 + (dx / dt) * 1000 * 0.4;
    d.lastX = e.clientX;
    d.lastT = now;

    const w = loopWidth.current;
    if (w) x.set(wrap(-w, 0, x.get() + dx));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    d.active = false;
    if (d.moved) {
      suppressClick.current = true;
      // Tells the page-transition click handler this "click" was the end of a drag.
      rowRef.current?.setAttribute("data-dragged", "1");
      flingVelocity.current = Math.max(-2400, Math.min(2400, d.velocity));
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
    rowRef.current?.removeAttribute("data-dragged");
  };

  const doubled = useMemo(() => [...films, ...films], [films]);

  return (
    <div
      ref={rowRef}
      data-cursor="Drag"
      className="filmstrip-mask relative cursor-grab select-none overflow-hidden active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hovering.current = true;
      }}
      onPointerLeave={() => {
        hovering.current = false;
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      <motion.div ref={trackRef} className="flex w-max" style={{ x, skewX }}>
        {doubled.map((film, i) => (
          <FilmCard
            key={`${film.id}-${i}`}
            film={film}
            canHover={canHover}
            // Second copy is a visual clone; keep it out of the tab order and screen readers.
            clone={i >= films.length}
            priority={i < 4}
          />
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD — thumbnail, mono caption, delayed muted preview on hover
   ───────────────────────────────────────────────────────────────────────────── */

function FilmCard({
  film,
  canHover,
  clone,
  priority,
}: {
  film: FilmstripFilm;
  canHover: boolean;
  clone: boolean;
  priority: boolean;
}) {
  const router = useRouter();
  const [previewing, setPreviewing] = useState(false);
  const [clipPlaying, setClipPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const useClip = Boolean(film.previewClip);
  const ytReady = useYouTubePlaying(iframeRef, previewing && !useClip);
  const previewReady = useClip ? clipPlaying : ytReady;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const startPreview = () => {
    // Warm the film page so the click lands instantly.
    router.prefetch(film.href);
    if (!canHover || !film.youtubeId) return;
    clearTimer();
    timer.current = setTimeout(() => setPreviewing(true), PREVIEW_DELAY_MS);
  };

  const stopPreview = () => {
    clearTimer();
    setPreviewing(false);
    setClipPlaying(false);
  };

  return (
    // Gap lives in padding (not flex gap) so two copies measure to exactly 2× and the loop seam is invisible.
    <div className="shrink-0 pr-4 sm:pr-5" aria-hidden={clone || undefined}>
      <Link
        href={film.href}
        // Hover prefetches; skip Next's viewport prefetch (dozens of cards would each hit the server).
        prefetch={false}
        tabIndex={clone ? -1 : undefined}
        draggable={false}
        data-cursor="Watch"
        data-transition-title={film.title}
        onPointerEnter={startPreview}
        onPointerLeave={stopPreview}
        onFocus={startPreview}
        onBlur={stopPreview}
        className="group block w-[68vw] max-w-[360px] focus-visible:outline-none sm:w-[360px]"
      >
        <div className="relative aspect-video overflow-hidden border border-hairline bg-stage-900 transition-colors duration-300 group-hover:border-beam/60 group-focus-visible:border-beam">
          <Image
            src={film.thumbnailUrl}
            alt={clone ? "" : `${film.title} (${film.year})`}
            fill
            sizes="(max-width: 640px) 68vw, 360px"
            priority={priority}
            placeholder="blur"
            blurDataURL={film.blurDataURL ?? BLUR_DATA_URL}
            draggable={false}
            className="object-cover brightness-[0.8] saturate-[0.85] transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.04] group-hover:brightness-100 group-hover:saturate-100"
          />

          {previewing && film.previewClip ? (
            <video
              src={film.previewClip}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              onPlaying={() => setClipPlaying(true)}
              className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                clipPlaying ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : previewing && film.youtubeId ? (
            <iframe
              ref={iframeRef}
              src={ambientEmbedUrl(film.youtubeId, PREVIEW_START_S)}
              title={`${film.title} preview`}
              allow="autoplay; encrypted-media; picture-in-picture"
              tabIndex={-1}
              // Oversized + pointer-events-none: hides YouTube chrome and lets the click reach the link.
              className={`pointer-events-none absolute left-1/2 top-1/2 h-[136%] w-[136%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${
                previewReady ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : null}

          <span
            aria-hidden
            className="kicker pointer-events-none absolute right-2 top-2 bg-stage/70 px-1.5 py-0.5 text-bone/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            {previewReady ? "● Preview" : "▶ Watch"}
          </span>
        </div>

        <p className="kicker mt-3 flex gap-2 text-bone/55 transition-colors group-hover:text-bone">
          <span className="truncate">{film.title}</span>
          <span className="shrink-0 text-bone/55">· {film.year}</span>
        </p>
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   REDUCED MOTION — plain swipeable row, no auto-scroll, no previews
   ───────────────────────────────────────────────────────────────────────────── */

function StaticRow({ films }: { films: FilmstripFilm[] }) {
  return (
    <div data-lenis-prevent className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto px-5 md:px-24">
      {films.map((film, i) => (
        <div key={film.id} className="snap-start">
          <FilmCard film={film} canHover={false} clone={false} priority={i < 4} />
        </div>
      ))}
    </div>
  );
}
