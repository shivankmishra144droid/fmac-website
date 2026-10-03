"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

/** `*word*` renders in italic serif accent. */
const MANIFESTO =
  "We shoot in the dark so we can chase the *light.* No perfect plan. No perfect gear. Just a frame, a story, and the nerve to *roll.* FMAC is where midnight ideas become *moving* *pictures.*";

type Token = { text: string; accent: boolean };

const TOKENS: Token[] = MANIFESTO.split(/\s+/).map((raw) => {
  const accent = raw.startsWith("*") && raw.includes("*", 1);
  return { text: raw.replace(/\*/g, ""), accent };
});

/**
 * Pinned manifesto — the section holds still while scrolling lights it up word by word.
 * Reduced motion: renders fully lit, unpinned.
 */
export function ManifestoPinned() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section
      ref={ref}
      id="the-club"
      data-rail="The club"
      className={`relative bg-stage ${reduce ? "py-32" : "h-[280vh]"}`}
    >
      <div
        className={`${
          reduce ? "" : "sticky top-0 h-[100svh]"
        } flex flex-col justify-center px-5 pt-16 md:px-24`}
      >

        {/* One readable sentence for assistive tech; the word-by-word light-up below is visual only. */}
        <p className="sr-only">{TOKENS.map((t) => t.text).join(" ")}</p>
        <p
          aria-hidden
          className="headline max-w-[22ch] text-[clamp(2rem,min(5.2vw,8vh),5.2rem)] leading-[1.04]"
        >
          {TOKENS.map((t, i) => (
            <Word
              key={i}
              token={t}
              progress={scrollYProgress}
              range={[i / TOKENS.length, (i + 1) / TOKENS.length]}
              static={Boolean(reduce)}
            />
          ))}
        </p>
      </div>
    </section>
  );
}

function Word({
  token,
  progress,
  range,
  static: isStatic,
}: {
  token: Token;
  progress: MotionValue<number>;
  range: [number, number];
  static: boolean;
}) {
  // Lit band spans 8%–68% of the scroll so the full line holds, fully lit, before the credits roll in.
  const start = 0.08 + range[0] * 0.6;
  const end = 0.08 + range[1] * 0.6;
  const opacity = useTransform(progress, [start, end], [0.14, 1]);
  const blur = useTransform(progress, [start, end], ["blur(6px)", "blur(0px)"]);

  return (
    <motion.span
      style={isStatic ? undefined : { opacity, filter: blur }}
      className={`mr-[0.24em] inline-block ${token.accent ? "italic text-beam" : "text-bone"}`}
    >
      {token.text}
    </motion.span>
  );
}
