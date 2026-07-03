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

const AUTO_MS = 6500;
const PANEL_MS = 0.55;
const EASE = [0.16, 1, 0.3, 1] as const;
const STAGGER = 0.09;

const COORDINATED: Transition = {
  duration: PANEL_MS,
  ease: EASE,
};

const panelVariants: Variants = {
  enter: { x: "-100%" },
  center: { x: 0 },
  exit: { x: "-100%" },
};

const imageVariants: Variants = {
  enter: { x: "100%" },
  center: { x: 0 },
  exit: { x: "100%" },
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

export function AwardsShowcase() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);

  const shouldAnimate = !reduceMotion && inView;

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
    const id = window.setInterval(advance, AUTO_MS);
    return () => window.clearInterval(id);
  }, [shouldAnimate, advance]);

  const displayIndex = reduceMotion ? 0 : index;
  const displayAward = AWARDS[displayIndex]!;

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-[100svh] w-full overflow-hidden border-t border-white/[0.06] bg-ink"
      aria-label="Awards and festival selections"
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {displayAward.award} — {displayAward.film}. {displayAward.festival},{" "}
        {displayAward.year}.
      </div>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {AWARDS.map((award, i) => (
          <motion.div
            key={award.id}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: i === displayIndex ? 1 : 0 }}
            transition={reduceMotion ? { duration: 0 } : COORDINATED}
          >
            <AwardBackground
              award={award}
              active={i === displayIndex}
              animateKenBurns={shouldAnimate && i === displayIndex}
            />
          </motion.div>
        ))}

        <div
          className="absolute inset-0"
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
      </div>

      {/* Ticks + two-column frame (text left, evidence photo right; stacks on mobile) */}
      <div className="relative z-10 flex min-h-[100svh] items-center py-12 sm:py-16">
        <div className="flex w-full items-center gap-4 px-5 sm:gap-5 sm:px-10 lg:px-14">
          <ProgressTicks activeIndex={displayIndex} />

          <div className="grid w-full flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10 xl:gap-14">
            <div className="relative overflow-hidden">
              <AnimatePresence initial={false}>
                {reduceMotion ? (
                  <GlassPanel key={displayAward.id} award={displayAward} staticReveal />
                ) : (
                  <motion.div
                    key={displayAward.id}
                    variants={panelVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={COORDINATED}
                    className={GLASS_PANEL}
                    style={PANEL_SHADOW}
                  >
                    <PanelContent award={displayAward} reveal />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative overflow-hidden">
              <AnimatePresence initial={false}>
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
                    transition={COORDINATED}
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
      className="absolute inset-[-4%]"
      initial={false}
      animate={animateKenBurns ? { scale: 1.02 } : { scale: 1 }}
      transition={
        animateKenBurns
          ? { duration: AUTO_MS / 1000, ease: [0.45, 0.05, 0.55, 0.95] }
          : { duration: 0 }
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

function ProgressTicks({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex shrink-0 flex-col gap-3 pt-1" aria-hidden>
      {AWARDS.map((award, i) => (
        <span
          key={award.id}
          className={`block w-0.5 ${
            i === activeIndex ? "bg-marquee" : "bg-white/20"
          }`}
          style={{ height: 24 }}
        />
      ))}
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
}: {
  award: Award;
  staticReveal?: boolean;
}) {
  const heroSrc = primaryAwardImage(award);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden border border-white/12 bg-ink-800"
        style={FRAME_SHADOW}
      >
        <Image
          src={heroSrc}
          alt={`${award.film} — ${award.award}`}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 540px"
          className={`object-cover object-center ${PHOTO_GRADE}`}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{
            background:
              "linear-gradient(145deg, rgba(58,42,20,0.25) 0%, transparent 45%, rgba(11,9,6,0.2) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent"
        />
      </div>

      {award.images.length > 1 && (
        <div className="flex gap-2" aria-hidden={staticReveal}>
          {award.images.map((src, i) => (
            <div
              key={src}
              className={`relative h-11 w-16 shrink-0 overflow-hidden border ${
                i === 0 ? "border-marquee/50" : "border-white/10 opacity-55"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                sizes="64px"
                className={`object-cover ${PHOTO_GRADE}`}
              />
            </div>
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
  const baseDelay = PANEL_MS;

  function lineProps(order: number) {
    if (staticReveal) {
      return { initial: false, animate: { opacity: 1, y: 0 } };
    }
    if (!reveal) {
      return {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
      };
    }
    return {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: 0.45,
        ease: EASE,
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
