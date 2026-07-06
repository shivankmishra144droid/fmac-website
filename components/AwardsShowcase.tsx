"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { AWARDS, primaryAwardImage, type Award } from "@/lib/awards";

const AUTO_MS = 4000;
const REVEAL_S = 1.35;
const EXIT_S = 0.9;
const CONTENT_DELAY = 0.28;
const STAGGER = 0.12;

/** Cinematic ease — slow deceleration, no snap */
const LUXURY = [0.19, 1, 0.22, 1] as const;
const LUXURY_SOFT = [0.33, 1, 0.68, 1] as const;
const EXIT_EASE = [0.55, 0.06, 0.68, 0.19] as const;

const BG_TRANSITION: Transition = {
  duration: REVEAL_S * 1.35,
  ease: LUXURY_SOFT,
};

const PHOTO_GRADE =
  "brightness-[0.92] contrast-[1.06] saturate-[0.88] sepia-[0.12]";

const GLASS_PANEL =
  "border border-white/10 bg-ink/35 backdrop-blur-md px-6 py-7 sm:px-8 sm:py-9";

const PANEL_SHADOW = {
  boxShadow:
    "0 24px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const FRAME_SHADOW = {
  boxShadow:
    "0 16px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
};

const panelVariants: Variants = {
  enter: {
    opacity: 0,
    y: 48,
    scale: 0.965,
    filter: "blur(12px)",
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: REVEAL_S,
      ease: LUXURY,
      delay: CONTENT_DELAY,
    },
  },
  exit: {
    opacity: 0,
    y: -28,
    scale: 0.985,
    filter: "blur(8px)",
    transition: { duration: EXIT_S, ease: EXIT_EASE },
  },
};

const imageVariants: Variants = {
  enter: {
    opacity: 0,
    scale: 1.1,
    x: 48,
    rotate: 0.4,
  },
  center: {
    opacity: 1,
    scale: 1,
    x: 0,
    rotate: 0,
    transition: {
      duration: REVEAL_S * 1.05,
      ease: LUXURY,
      delay: CONTENT_DELAY + 0.14,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    x: -32,
    rotate: -0.25,
    transition: { duration: EXIT_S, ease: EXIT_EASE },
  },
};

export function AwardsShowcase() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);

  const shouldAnimate = !reduceMotion && inView;

  const goTo = useCallback((next: number) => {
    setIndex(((next % AWARDS.length) + AWARDS.length) % AWARDS.length);
  }, []);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % AWARDS.length);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldAnimate) return;
    const id = window.setTimeout(advance, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [shouldAnimate, index, advance]);

  const displayIndex = reduceMotion ? 0 : index;
  const displayAward = AWARDS[displayIndex]!;

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-[100svh] w-full overflow-hidden border-t border-white/[0.06] bg-ink"
      aria-label="Awards and festival selections"
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {displayAward.award}, {displayAward.film}. {displayAward.festival},{" "}
        {displayAward.year}.
      </div>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {AWARDS.map((award, i) => (
          <motion.div
            key={award.id}
            className="absolute inset-0"
            initial={false}
            animate={{
              opacity: i === displayIndex ? 1 : 0,
              scale: i === displayIndex ? 1 : 1.06,
            }}
            transition={reduceMotion ? { duration: 0 } : BG_TRANSITION}
          >
            <AwardBackground
              award={award}
              active={i === displayIndex}
              animateKenBurns={shouldAnimate && i === displayIndex}
            />
          </motion.div>
        ))}

        <motion.div
          className="absolute inset-0"
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.88, 1, 0.88] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }
          style={{
            background:
              "linear-gradient(to right, rgba(11,9,6,0.94) 0%, rgba(11,9,6,0.82) 32%, rgba(11,9,6,0.45) 58%, rgba(11,9,6,0.22) 100%)",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-multiply opacity-50"
          style={{
            background:
              "linear-gradient(145deg, rgba(58,42,20,0.35) 0%, transparent 50%, rgba(11,9,6,0.3) 100%)",
          }}
        />

        {/* Slow ambient gold wash */}
        {!reduceMotion && (
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              opacity: [0.12, 0.28, 0.12],
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(234,179,8,0.15) 0%, transparent 70%)",
              backgroundSize: "200% 200%",
            }}
          />
        )}
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-center py-12 sm:py-16">
        <div className="flex w-full items-center gap-4 px-5 sm:gap-5 sm:px-10 lg:px-14">
          <ProgressTicks
            activeIndex={displayIndex}
            reduceMotion={!!reduceMotion}
            onSelect={goTo}
          />

          <div className="grid w-full flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10 xl:gap-14">
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {reduceMotion ? (
                  <GlassPanel key={displayAward.id} award={displayAward} staticReveal />
                ) : (
                  <motion.div
                    key={displayAward.id}
                    variants={panelVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className={GLASS_PANEL}
                    style={PANEL_SHADOW}
                  >
                    <PanelContent award={displayAward} reveal />
                    <motion.span
                      aria-hidden
                      className="mt-6 block h-px origin-left bg-gradient-to-r from-marquee/70 via-marquee/25 to-transparent"
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{
                        duration: 1.1,
                        ease: LUXURY,
                        delay: CONTENT_DELAY + 0.55,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {reduceMotion ? (
                  <EvidenceFrame
                    key={displayAward.id}
                    award={displayAward}
                    staticReveal
                  />
                ) : (
                  <motion.div
                    key={displayAward.id}
                    variants={imageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <EvidenceFrame award={displayAward} reveal />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AwardBackground({
  award,
  active,
  animateKenBurns,
}: {
  award: Award;
  active: boolean;
  animateKenBurns: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-[-6%]"
      initial={false}
      animate={
        animateKenBurns
          ? { scale: 1.08, x: "-1.5%", y: "-0.5%" }
          : { scale: 1, x: 0, y: 0 }
      }
      transition={
        animateKenBurns
          ? { duration: AUTO_MS / 1000, ease: [0.25, 0.1, 0.25, 1] }
          : { duration: 1.2, ease: LUXURY_SOFT }
      }
    >
      <Image
        src={award.backgroundUrl}
        alt=""
        fill
        unoptimized
        priority={active}
        sizes="100vw"
        className={`object-cover object-center ${PHOTO_GRADE}`}
      />
    </motion.div>
  );
}

function ProgressTicks({
  activeIndex,
  reduceMotion,
  onSelect,
}: {
  activeIndex: number;
  reduceMotion: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className="flex shrink-0 flex-col gap-3 pt-1"
      role="tablist"
      aria-label="Award slides"
    >
      {AWARDS.map((award, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={award.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${award.award}, ${award.film}`}
            onClick={() => onSelect(i)}
            className="group relative block w-0.5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marquee/60"
          >
            <motion.span
              layout={!reduceMotion}
              className="relative block w-full overflow-hidden rounded-full bg-white/20"
              animate={{
                height: active ? 40 : 16,
                opacity: active ? 1 : 0.22,
                boxShadow: active
                  ? "0 0 14px rgba(234, 179, 8, 0.55)"
                  : "0 0 0px rgba(234, 179, 8, 0)",
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.85, ease: LUXURY }
              }
            >
              {active && !reduceMotion && (
                <motion.span
                  key={`progress-${activeIndex}`}
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 block rounded-full bg-marquee"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                  style={{ height: "100%", transformOrigin: "bottom" }}
                />
              )}
              {active && reduceMotion && (
                <span
                  aria-hidden
                  className="absolute inset-0 block rounded-full bg-marquee"
                />
              )}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}

function GlassPanel({
  award,
  staticReveal,
}: {
  award: Award;
  staticReveal?: boolean;
}) {
  return (
    <div className={GLASS_PANEL} style={PANEL_SHADOW}>
      <PanelContent
        award={award}
        reveal={!staticReveal}
        staticReveal={staticReveal}
      />
    </div>
  );
}

function EvidenceFrame({
  award,
  staticReveal,
  reveal,
}: {
  award: Award;
  staticReveal?: boolean;
  reveal?: boolean;
}) {
  const heroSrc = primaryAwardImage(award);
  const animate = reveal && !staticReveal;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden border border-white/12 bg-ink-800"
        style={FRAME_SHADOW}
      >
        <motion.div
          className="absolute inset-0"
          initial={animate ? { scale: 1.12 } : false}
          animate={{ scale: 1 }}
          transition={
            animate
              ? { duration: REVEAL_S * 1.2, ease: LUXURY, delay: CONTENT_DELAY + 0.2 }
              : { duration: 0 }
          }
        >
          <Image
            src={heroSrc}
            alt={`${award.film}, ${award.award}`}
            fill
            unoptimized
            sizes="(max-width: 1024px) 100vw, 540px"
            className={`object-cover object-center ${PHOTO_GRADE}`}
          />
        </motion.div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{
            background:
              "linear-gradient(145deg, rgba(58,42,20,0.25) 0%, transparent 45%, rgba(11,9,6,0.2) 100%)",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent"
          initial={animate ? { opacity: 0.9 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: LUXURY }}
        />
        {animate && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/10 to-transparent"
            initial={{ x: "-100%", opacity: 0.6 }}
            animate={{ x: "220%", opacity: 0 }}
            transition={{ duration: 1.6, ease: LUXURY, delay: CONTENT_DELAY + 0.35 }}
          />
        )}
      </div>

      {award.images.length > 1 && (
        <div className="flex gap-2" aria-hidden={staticReveal}>
          {award.images.map((src, i) => (
            <motion.div
              key={src}
              className={`relative h-11 w-16 shrink-0 overflow-hidden border ${
                i === 0 ? "border-marquee/50" : "border-white/10 opacity-55"
              }`}
              initial={animate ? { opacity: 0, y: 12, scale: 0.92 } : false}
              animate={{ opacity: i === 0 ? 1 : 0.55, y: 0, scale: 1 }}
              transition={
                animate
                  ? {
                      duration: 0.75,
                      ease: LUXURY,
                      delay: CONTENT_DELAY + 0.5 + i * 0.08,
                    }
                  : { duration: 0 }
              }
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                sizes="64px"
                className={`object-cover ${PHOTO_GRADE}`}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PanelContent({
  award,
  reveal,
  staticReveal,
}: {
  award: Award;
  reveal?: boolean;
  staticReveal?: boolean;
}) {
  const baseDelay = CONTENT_DELAY + 0.18;

  function lineProps(order: number) {
    if (staticReveal) {
      return { initial: false, animate: { opacity: 1, y: 0, filter: "blur(0px)" } };
    }
    if (!reveal) {
      return {
        initial: { opacity: 1, y: 0, filter: "blur(0px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      };
    }
    return {
      initial: { opacity: 0, y: 28, filter: "blur(14px)" },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      transition: {
        duration: 0.95,
        ease: LUXURY,
        delay: baseDelay + order * STAGGER,
      },
    };
  }

  return (
    <>
      <motion.p {...lineProps(0)} className="type-eyebrow text-parchment/45">
        {award.festival}
        <span className="text-parchment/25"> · </span>
        {award.year}
      </motion.p>

      <motion.h3
        {...lineProps(1)}
        className="type-display-heading mt-4 text-display-lg tracking-display text-parchment sm:text-display-xl"
      >
        {award.award}
      </motion.h3>

      <motion.p
        {...lineProps(2)}
        className="film-title mt-3 text-body-lg font-medium text-parchment/65 sm:text-xl"
      >
        {award.film}
      </motion.p>

      <motion.p
        {...lineProps(3)}
        className="mt-5 text-body leading-relaxed text-parchment/75 sm:text-body-lg sm:leading-relaxed"
      >
        {award.description}
      </motion.p>
    </>
  );
}
