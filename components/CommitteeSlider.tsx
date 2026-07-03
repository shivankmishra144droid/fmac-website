"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
  type Transition,
  type Variants,
} from "framer-motion";
import { COMMITTEE_PHOTOS } from "@/lib/committeePhotos";

const AUTO_MS = 5500;
/** Premium ease-out — long deceleration tail for silky slide stops */
const SLIDE_EASE = [0.16, 1, 0.3, 1] as const;
const SLIDE_DURATION = 1.15;

const yearLabelVariants: Variants = {
  enter: { y: 8, opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: -6, opacity: 0 },
};

const LABEL_TRANSITION: Transition = {
  duration: 0.55,
  ease: SLIDE_EASE,
  delay: 0.14,
};

export function CommitteeSlider() {
  const reduceMotion = useReducedMotion();
  const photos = COMMITTEE_PHOTOS;
  const count = photos.length;

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pressingArrow, setPressingArrow] = useState<"prev" | "next" | null>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const slideStartRef = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  const baseX = useMotionValue(0);
  const dragX = useMotionValue(0);
  const trackX = useTransform(
    [baseX, dragX],
    ([base, drag]) => (base as number) + (drag as number)
  );

  const active = photos[index]!;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setSlideWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Smooth track slide — all images stay mounted, no remount jank */
  useEffect(() => {
    if (!slideWidth) return;
    const target = -index * slideWidth;
    if (reduceMotion) {
      baseX.set(target);
      dragX.set(0);
      return;
    }
    const controls = animate(baseX, target, {
      duration: SLIDE_DURATION,
      ease: SLIDE_EASE,
    });
    return () => controls.stop();
  }, [index, slideWidth, reduceMotion, baseX, dragX]);

  const goTo = useCallback(
    (nextIndex: number) => {
      const normalized = ((nextIndex % count) + count) % count;
      if (normalized === index) return;
      setIndex(normalized);
      setProgress(0);
      slideStartRef.current = Date.now();
      dragX.set(0);
    },
    [count, index, dragX]
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
      if (!paused && !isDragging) {
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
  }, [reduceMotion, paused, isDragging, next, index]);

  function onDragStart() {
    setIsDragging(true);
  }

  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    setIsDragging(false);
    dragX.set(0);
    if (reduceMotion || !slideWidth) return;

    const threshold = slideWidth * 0.18;
    if (info.offset.x < -threshold || info.velocity.x < -380) next();
    else if (info.offset.x > threshold || info.velocity.x > 380) prev();
    else {
      animate(baseX, -index * slideWidth, {
        duration: 0.55,
        ease: SLIDE_EASE,
      });
    }
  }

  function pauseInteraction() {
    setPaused(true);
  }

  function resumeInteraction() {
    setPaused(false);
    slideStartRef.current = Date.now();
    setProgress(0);
  }

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
          ref={containerRef}
          className="relative aspect-[16/9] w-full overflow-hidden bg-ink-800"
        >
          <motion.div
            className="flex h-full touch-pan-y"
            style={{ x: trackX, willChange: "transform" }}
            drag={reduceMotion ? false : "x"}
            dragConstraints={{
              left: slideWidth ? -(count - 1) * slideWidth : 0,
              right: 0,
            }}
            dragElastic={0.06}
            dragMomentum={false}
            onDragStart={onDragStart}
            onDrag={(_, info) => dragX.set(info.offset.x)}
            onDragEnd={onDragEnd}
          >
            {photos.map((photo, i) => (
              <CommitteeSlide
                key={photo.year}
                photo={photo}
                active={i === index}
                paused={paused || isDragging}
                reduceMotion={Boolean(reduceMotion)}
                width={slideWidth}
                priority={i <= 1}
              />
            ))}
          </motion.div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-20 sm:px-6 sm:pb-5">
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={active.year}
                  variants={yearLabelVariants}
                  initial={reduceMotion ? "center" : "enter"}
                  animate="center"
                  exit={reduceMotion ? undefined : "exit"}
                  transition={reduceMotion ? { duration: 0 } : LABEL_TRANSITION}
                  className="type-display-heading text-xl tracking-display text-parchment sm:text-display-sm"
                >
                  {active.year}
                </motion.p>
              </AnimatePresence>
            </div>
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

function CommitteeSlide({
  photo,
  active,
  paused,
  reduceMotion,
  width,
  priority,
}: {
  photo: (typeof COMMITTEE_PHOTOS)[number];
  active: boolean;
  paused: boolean;
  reduceMotion: boolean;
  width: number;
  priority?: boolean;
}) {
  return (
    <div
      className="relative h-full shrink-0 overflow-hidden"
      style={{ width: width || "100%" }}
      aria-hidden={!active}
    >
      <motion.div
        className="absolute inset-[-3%] will-change-transform"
        initial={false}
        animate={
          !active || paused || reduceMotion ? { scale: 1 } : { scale: 1.022 }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: AUTO_MS / 1000, ease: [0.45, 0.05, 0.55, 0.95] }
        }
      >
        <Image
          src={photo.imageUrl}
          alt={photo.alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 922px"
          unoptimized
          className="object-cover object-center brightness-[0.92] contrast-[1.06] saturate-[0.88] sepia-[0.12]"
          draggable={false}
        />
      </motion.div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{
          background:
            "linear-gradient(145deg, rgba(58,42,20,0.35) 0%, transparent 45%, rgba(11,9,6,0.25) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/10 opacity-80"
      />
    </div>
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
      className={`absolute top-1/2 z-20 flex h-10 w-9 -translate-y-1/2 items-center justify-center border border-white/15 bg-ink/75 text-parchment/70 backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-ink hover:text-parchment ${side}`}
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
