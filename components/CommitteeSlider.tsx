"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";
import { COMMITTEE_PHOTOS } from "@/lib/committeePhotos";
import { OdometerYearLabel } from "@/components/OdometerYearLabel";
import { OldFilmOverlay } from "@/components/OldFilmOverlay";
import { ProjectorSoundToggle } from "@/components/ProjectorSoundToggle";
import { TiltPhoto } from "@/components/TiltPhoto";
import { useProjectorSound } from "@/hooks/useProjectorSound";

const AUTO_MS = 5500;
const GATE_EASE = [0.55, 0.06, 0.68, 0.19] as const;

type TransitionPhase = "idle" | "flicker" | "black" | "leader" | "punch";

function useLowPowerFallback() {
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    let frames = 0;
    const start = performance.now();
    let raf = 0;

    const tick = (t: number) => {
      frames += 1;
      if (t - start < 480) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (frames / ((t - start) / 1000) < 48) setLowPower(true);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return lowPower;
}

export function CommitteeSlider() {
  const reduceMotion = useReducedMotion();
  const lowPower = useLowPowerFallback();
  const photos = COMMITTEE_PHOTOS;
  const count = photos.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pressingArrow, setPressingArrow] = useState<"prev" | "next" | null>(null);
  const [gatePulse, setGatePulse] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [frameHeight, setFrameHeight] = useState(0);

  const indexRef = useRef(0);
  const phaseRef = useRef<TransitionPhase>("idle");
  const slideStartRef = useRef(Date.now());
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const progressRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const {
    muted,
    toggleMuted,
    showEnablePrompt,
    dismissEnablePrompt,
    playReelCatch,
  } = useProjectorSound(sectionRef);

  const active = photos[index]!;
  const disableTilt = Boolean(reduceMotion) || lowPower;
  const motionOn = !reduceMotion;

  indexRef.current = index;
  phaseRef.current = phase;

  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setFrameHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const paintProgress = useCallback((progress: number, activeIdx: number) => {
    progressRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const scale = i < activeIdx ? 1 : i === activeIdx ? progress : 0;
      bar.style.transform = `scaleX(${scale})`;
    });
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  const goTo = useCallback(
    (nextIndex: number) => {
      const normalized = ((nextIndex % count) + count) % count;
      if (normalized === indexRef.current || phaseRef.current !== "idle") return;

      clearTimers();
      paintProgress(0, indexRef.current);
      playReelCatch();

      if (reduceMotion) {
        setIndex(normalized);
        slideStartRef.current = Date.now();
        paintProgress(0, normalized);
        return;
      }

      setPhase("flicker");

      schedule(() => setPhase("black"), 70);
      schedule(() => {
        setIndex(normalized);
        setGatePulse((n) => n + 1);
        setPhase("leader");
      }, 130);
      schedule(() => setPhase("punch"), 220);
      schedule(() => {
        setPhase("idle");
        slideStartRef.current = Date.now();
        paintProgress(0, normalized);
      }, 380);
    },
    [count, paintProgress, playReelCatch, reduceMotion]
  );

  const next = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

  useEffect(() => {
    if (reduceMotion) {
      paintProgress(1, index);
      return;
    }

    let raf = 0;
    const tick = () => {
      if (!paused && phaseRef.current === "idle") {
        const elapsed = Date.now() - slideStartRef.current;
        const p = Math.min(elapsed / AUTO_MS, 1);
        paintProgress(p, indexRef.current);
        if (elapsed >= AUTO_MS) next();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, paused, next, paintProgress, index]);

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
    paintProgress(0, indexRef.current);
  }

  return (
    <section
      ref={sectionRef}
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

        <div className="mb-4 flex items-center gap-3">
          <div className="flex min-w-0 flex-1 gap-1" role="group" aria-label="Slide progress">
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
                ref={(el) => {
                  progressRefs.current[i] = el;
                }}
                className="absolute inset-y-0 left-0 w-full origin-left bg-marquee"
                style={{ transform: "scaleX(0)" }}
              />
            </button>
          ))}
          </div>
          <ProjectorSoundToggle
            muted={muted}
            onToggle={toggleMuted}
            showEnablePrompt={showEnablePrompt}
            onDismissPrompt={dismissEnablePrompt}
            className="shrink-0"
          />
        </div>

        {/* Committee photo — full width, aged-film overlay */}
        <div className="relative w-full shadow-[0_22px_38px_rgba(0,0,0,0.55)]">
          <div
            ref={frameRef}
            className="relative aspect-[16/9] w-full overflow-hidden bg-ink-800"
          >
            <OldFilmOverlay className="z-[1]">
              <motion.div
                className="relative h-full w-full min-h-0"
                animate={
                  !motionOn
                    ? undefined
                    : phase === "punch"
                      ? { scale: [1.045, 1] }
                      : undefined
                }
                transition={
                  phase === "punch"
                    ? { duration: 0.16, ease: [0.16, 1, 0.3, 1] }
                    : undefined
                }
                style={{
                  willChange: motionOn && phase === "punch" ? "transform" : undefined,
                }}
              >
                <TiltPhoto
                  key={active.year}
                  src={active.imageUrl}
                  alt={active.alt}
                  foregroundSrc={active.foregroundUrl}
                  priority
                  unoptimized
                  fallbackLabel={active.year}
                  disableTilt={disableTilt || phase !== "idle"}
                  kenBurnsMs={AUTO_MS}
                />
              </motion.div>
            </OldFilmOverlay>

            {motionOn && phase === "flicker" && <FlickerOverlay />}
            {motionOn && phase === "black" && (
              <div className="pointer-events-none absolute inset-0 z-50 bg-ink" />
            )}
            {motionOn && phase === "leader" && <LeaderFlash />}
            {motionOn && phase === "leader" && (
              <FilmGateLine key={gatePulse} travel={frameHeight} />
            )}

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-ink via-ink/15 to-ink/10 opacity-75"
            />

            {motionOn && (
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

function FlickerOverlay() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-50 bg-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.85, 0.15, 0.9, 0.4, 0.95] }}
      transition={{ duration: 0.07, ease: "linear" }}
    />
  );
}

function LeaderFlash() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-50 bg-parchment"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.92, 0.35, 0] }}
      transition={{ duration: 0.1, ease: GATE_EASE }}
    />
  );
}

function FilmGateLine({ travel }: { travel: number }) {
  const distance = Math.max(travel, 1);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[55] h-[2px] bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.45)]"
        initial={{ y: -4, opacity: 0.9 }}
        animate={{ y: distance, opacity: [0.9, 0.65, 0] }}
        transition={{
          duration: 0.18,
          ease: GATE_EASE,
          opacity: { duration: 0.18, times: [0, 0.45, 1] },
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[55] h-px bg-black/40"
        initial={{ y: -2 }}
        animate={{ y: distance }}
        transition={{ duration: 0.18, ease: GATE_EASE, delay: 0.01 }}
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
