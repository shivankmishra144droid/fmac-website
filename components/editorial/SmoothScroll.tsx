"use client";

import { useEffect } from "react";
import Lenis from "lenis";

let instance: Lenis | null = null;

/** Smooth-scroll to an element or y offset; falls back to native when Lenis is off. */
export function scrollToTarget(target: HTMLElement | number, offset = 0) {
  if (instance) {
    instance.scrollTo(target, { offset, duration: 1.4 });
    return;
  }
  const top =
    typeof target === "number"
      ? target
      : target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: "smooth" });
}

/** Weighted, inertial page scroll (Lenis). Skipped under reduced motion. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.95,
      smoothWheel: true,
    });
    instance = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      instance = null;
    };
  }, []);

  return null;
}
