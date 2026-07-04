"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
  type Variants,
} from "framer-motion";
import { COMMITTEE_PHOTOS } from "@/lib/committeePhotos";
import { OdometerYearLabel } from "@/components/OdometerYearLabel";
import { TiltPhoto } from "@/components/TiltPhoto";

const AUTO_MS = 5500;
const FRAME_EXIT_S = 0.1;
const FRAME_ENTER_S = 0.14;
const GATE_EASE = [0.55, 0.06, 0.68, 0.19] as const;

const filmAdvanceVariants: Variants = {
  enter: {
    y: -14,
    opacity: 0,
    scale: 1.008,
    filter: "blur(3px)",
  },
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: FRAME_ENTER_S,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.07,
    },
  },
  exit: {
    y: [0, 16, 10],
    opacity: [1, 0.5, 0],
    filter: ["blur(0px)", "blur(6px)", "blur(2px)"],
    transition: {
      duration: FRAME_EXIT_S,
      ease: GATE_EASE,
      times: [0, 0.6, 1],
    },
  },
};

const reducedVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export function CommitteeSlider() {
  const reduceMotion = useReducedMotion();
  const photos = COMMITTEE_PHOTOS;
  const count = photos.length;

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pressingArrow, setPressingArrow] = useState<"prev" | "next" | null>(null);
  const [gatePulse, setGatePulse] = useState(0);

  const slideStartRef = useRef(Date.now());
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameHeight, setFrameHeight] = useState(0);
  const active = photos[index]!;

  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setFrameHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback(
    (nextIndex: number) => {
      const normalized = ((nextIndex % count) + count) % count;
      if (normalized === index) return;
      setIndex(normalized);
      setProgress(0);
      slideStartRef.current = Date.now();
      if (!reduceMotion) setGatePulse((n) => n + 1);
    },
    [count, index, reduceMotion]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (reduceMotion) {
      setProgress(1);
      return;
    }

    let raf = 0;
    const tick = () => {
      if (!paused) {
        const elapsed = Date.now() - slideStartRef.current;
        setProgress(Math.min(elapsed / AUTO_MS, 1));
        if (elapsed >= AUTO_MS) {
          next();
          slideStartRef.current = Date.now();
          setProgress(0);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, paused, next, index]);

  function onSwipeEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (reduceMotion) return;
    if (info.offset.x < -56 || info.velocity.x < -420) next();
    else if (info.offset.x > 56 || info.velocity.x > 420) prev();
  }

  function pauseInteraction() {
    setPaused(true);
  }

  function resumeInteraction() {
    setPaused(false);
    slideStartRef.current = Date.now();
    setProgress(0);
  }

  const variants = reduceMotion ? reducedVariants : filmAdvanceVariants;

  return (
    <section
      className="relative z-10 border-t border-white/[0.06] px-5 pt-12 sm:px-8 sm:pt-16"
      aria-roledescription="carousel"
      aria-label="Coordinating Committee photos by year"
      onMouseEnter={pauseInteraction}
      onMouseLeave={resumeInteraction}
      onFocusCapture={pauseInteraction}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) resumeInteraction();
      }}
    >
      <div className="mx-auto max-w-[58rem]">
        <div className="mb-6 sm:mb-8">
          <p className="type-eyebrow text-parchment/40">The people behind the camera</p>
          <h2 className="type-display-heading mt-2 text-display-sm tracking-display text-parchment sm:text-display">
            Coordinating Committee
          </h2>
        </div>

        <div className="mb-4 flex gap-1" role="group" aria-label="Slide progress">
          {photos.map((photo, i) => (
            <button
              key={photo.year}
              type="button"
              aria-current={i === index ? "true" : undefined}
              aria-label={`${photo.year} committee photo`}
              onClick={() => goTo(i)}
              className="group relative h-1 flex-1 overflow-hidden bg-white/[0.08] transition-colors hover:bg-white/[0.12]"
            >
              <span
                className="absolute inset-y-0 left-0 bg-marquee transition-none"
                style={{
                  width:
                    i < index ? "100%" : i === index ? `${progress * 100}%` : "0%",
                }}
              />
            </button>
          ))}
        </div>

        <div
          className="relative mx-auto w-full"
          style={{
            filter:
              "drop-shadow(0 22px 38px rgba(0,0,0,0.55)) drop-shadow(0 0 32px rgba(234,179,8,0.08))",
          }}
        >
          <div
            ref={frameRef}
            className="relative aspect-[16/9] w-full overflow-hidden bg-ink-800"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.year}
                className="absolute inset-0"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <TiltPhoto
                  src={active.imageUrl}
                  alt={active.alt}
                  foregroundSrc={active.foregroundUrl}
                  priority
                  disableTilt={Boolean(reduceMotion)}
                />
              </motion.div>
            </AnimatePresence>

            {/* Film gate frame-line sweep */}
            {!reduceMotion && (
              <FilmGateLine key={gatePulse} travel={frameHeight} />
            )}

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-ink via-ink/15 to-ink/10 opacity-75"
            />

            {/* Swipe surface — no horizontal slide, gesture only */}
            {!reduceMotion && (
              <motion.div
                className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.14}
                dragMomentum={false}
                onDragEnd={onSwipeEnd}
              />
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-4 pt-20 sm:px-6 sm:pb-5">
              <OdometerYearLabel
                year={active.year}
                reduceMotion={Boolean(reduceMotion)}
                className="type-display-heading text-xl tracking-display text-parchment sm:text-display-sm"
              />
            </div>

            <NavArrow
              direction="prev"
              onClick={prev}
              pressing={pressingArrow === "prev"}
              onPressStart={() => setPressingArrow("prev")}
              onPressEnd={() => setPressingArrow(null)}
              reduceMotion={Boolean(reduceMotion)}
            />
            <NavArrow
              direction="next"
              onClick={next}
              pressing={pressingArrow === "next"}
              onPressStart={() => setPressingArrow("next")}
              onPressEnd={() => setPressingArrow(null)}
              reduceMotion={Boolean(reduceMotion)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Thin horizontal frame-line — film projector gate artifact */
function FilmGateLine({ travel }: { travel: number }) {
  const distance = Math.max(travel, 1);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[2px] bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.45)]"
        initial={{ y: -4, opacity: 0.9 }}
        animate={{ y: distance, opacity: [0.9, 0.7, 0] }}
        transition={{
          duration: 0.19,
          ease: GATE_EASE,
          opacity: { duration: 0.19, times: [0, 0.4, 1] },
        }}
        style={{ willChange: "transform, opacity" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-40 h-px bg-black/40"
        initial={{ y: -2 }}
        animate={{ y: distance }}
        transition={{ duration: 0.19, ease: GATE_EASE, delay: 0.012 }}
        style={{ willChange: "transform" }}
      />
    </>
  );
}

function NavArrow({
  direction,
  onClick,
  pressing,
  onPressStart,
  onPressEnd,
  reduceMotion,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  pressing: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  reduceMotion: boolean;
}) {
  const side = direction === "prev" ? "left-0" : "right-0";

  return (
    <motion.button
      type="button"
      aria-label={direction === "prev" ? "Previous committee photo" : "Next committee photo"}
      onClick={onClick}
      onPointerDown={(e: ReactPointerEvent) => {
        if (e.button === 0) onPressStart();
      }}
      onPointerUp={onPressEnd}
      onPointerLeave={onPressEnd}
      whileHover={reduceMotion ? undefined : { scale: 1.05 }}
      animate={{ scale: pressing && !reduceMotion ? 0.96 : 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      className={`absolute top-1/2 z-40 flex h-10 w-9 -translate-y-1/2 items-center justify-center border border-white/15 bg-ink/75 text-parchment/70 backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-ink hover:text-parchment ${side}`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        {direction === "prev" ? (
          <path d="M15 6l-6 6 6 6" />
        ) : (
          <path d="M9 6l6 6-6 6" />
        )}
      </svg>
    </motion.button>
  );
}
