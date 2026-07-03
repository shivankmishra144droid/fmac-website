"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const LINES = [
  "We shoot in the dark so we can chase the light.",
  "No permission. No perfect gear. Just a frame, a story, and the nerve to roll.",
  "FMAC is where midnight ideas become moving pictures.",
];

export function Manifesto() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const watermarkY = useTransform(scrollYProgress, [0, 1], ["-6%", "12%"]);
  const fgY = useTransform(scrollYProgress, [0, 1], ["4%", "-4%"]);

  return (
    <section
      ref={ref}
      className="relative isolate border-t border-white/[0.06] bg-ink px-5 py-20 sm:px-8 sm:py-24"
    >
      <motion.span
        aria-hidden
        style={reduce ? undefined : { y: watermarkY }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[28vw] uppercase leading-none tracking-tightest text-parchment/[0.03] sm:text-[22vw]"
      >
        FMAC
      </motion.span>

      <motion.div
        style={reduce ? undefined : { y: fgY }}
        className="relative z-10 mx-auto max-w-2xl space-y-8"
      >
        {LINES.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="text-xl leading-snug text-parchment/90 sm:text-2xl sm:leading-snug"
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    </section>
  );
}
