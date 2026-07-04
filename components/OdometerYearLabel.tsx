"use client";

import { AnimatePresence, motion } from "framer-motion";

const FLIP_EASE = [0.55, 0.06, 0.68, 0.19] as const;

/**
 * Split-flap / odometer year roll — mechanical vertical digit change.
 */
export function OdometerYearLabel({
  year,
  reduceMotion,
  className = "",
}: {
  year: string;
  reduceMotion: boolean;
  className?: string;
}) {
  if (reduceMotion) {
    return (
      <p className={className} aria-label={year}>
        {year}
      </p>
    );
  }

  const chars = year.split("");

  return (
    <p className={`flex items-baseline ${className}`} aria-label={year}>
      {chars.map((char, i) => (
        <CharFlap key={`${year}-${i}`} char={char} index={i} yearKey={year} />
      ))}
    </p>
  );
}

function CharFlap({
  char,
  index,
  yearKey,
}: {
  char: string;
  index: number;
  yearKey: string;
}) {
  const width = char === "-" || char === "–" ? "0.45em" : "0.58em";

  return (
    <span
      className="relative inline-block overflow-hidden align-bottom"
      style={{ width, height: "1.12em", lineHeight: 1.12 }}
      aria-hidden
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${yearKey}-${index}-${char}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ y: "108%", rotateX: -72 }}
          animate={{ y: 0, rotateX: 0 }}
          exit={{ y: "-108%", rotateX: 72 }}
          transition={{
            duration: 0.22,
            ease: FLIP_EASE,
            delay: index * 0.018,
          }}
          style={{ transformOrigin: "center bottom", willChange: "transform" }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
