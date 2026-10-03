"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { scrollToTopInstant } from "./SmoothScroll";

const EASE = [0.76, 0, 0.24, 1] as const;
/** If the new route hasn't rendered by now, lift the curtain anyway. */
const STUCK_MS = 6000;

type Phase = "idle" | "covering" | "covered" | "revealing";

const TITLES: Record<string, string> = {
  "/": "FMAC",
  "/library": "The library",
  "/library/watchlist": "Watchlist",
  "/library/wall": "The wall",
  "/library/profile": "Profile",
  "/achievements": "Laurels",
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname]!;
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "FMAC";
}

/**
 * Curtain transition between pages: an internal link click raises a stage-black curtain
 * carrying the destination's name, navigates while covered, then lifts on the new page.
 * Opt out per link with `data-no-transition`; name a destination with `data-transition-title`.
 * Back/forward stay instant (the browser owns those).
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [title, setTitle] = useState("");
  const target = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = e.target instanceof Element ? e.target : null;
      const a = el?.closest<HTMLAnchorElement>("a[href]");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      if (a.closest("[data-no-transition]")) return;
      // The end of a drag on the filmstrip / poster wall is not a click.
      if (a.closest('[data-dragged="1"]')) return;

      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash
      if (phaseRef.current !== "idle") {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      const href = url.pathname + url.search + url.hash;
      target.current = href;
      router.prefetch(href);
      setTitle(a.dataset.transitionTitle || titleFor(url.pathname));
      setPhase("covering");
    };
    // Capture phase: runs before Next's <Link> handler, which then sees defaultPrevented and stands down.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // New route rendered under the curtain → reset scroll and lift.
  useEffect(() => {
    if (phaseRef.current === "covered") {
      scrollToTopInstant();
      setPhase("revealing");
    }
  }, [pathname]);

  // Don't let navigation hinge on the cover animation reporting completion (throttled/background
  // tabs can stall animation frames): proceed on a timer that matches the cover duration.
  useEffect(() => {
    if (phase !== "covering") return;
    const t = setTimeout(() => onCoveredRef.current(), reduce ? 250 : 620);
    return () => clearTimeout(t);
  }, [phase, reduce]);

  // Safety valve for a navigation that never lands.
  useEffect(() => {
    if (phase !== "covered") return;
    const t = setTimeout(() => setPhase("revealing"), STUCK_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const onCovered = () => {
    if (phaseRef.current !== "covering") return;
    setPhase("covered");
    const href = target.current;
    target.current = null;
    if (href) router.push(href, { scroll: false });
  };

  const onCoveredRef = useRef(onCovered);
  onCoveredRef.current = onCovered;

  const show = phase !== "idle";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="curtain"
          aria-hidden
          className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-stage"
          initial={reduce ? { opacity: 0 } : { y: "100%" }}
          animate={
            phase === "revealing"
              ? reduce
                ? { opacity: 0 }
                : { y: "-100%" }
              : reduce
                ? { opacity: 1 }
                : { y: "0%" }
          }
          transition={{ duration: reduce ? 0.2 : phase === "revealing" ? 0.65 : 0.55, ease: EASE }}
          onAnimationComplete={() => {
            if (phaseRef.current === "covering") onCovered();
            else if (phaseRef.current === "revealing") setPhase("idle");
          }}
        >
          <motion.p
            className="headline px-5 text-center text-[clamp(2.75rem,8vw,7.5rem)] text-bone"
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={
              phase === "revealing"
                ? { opacity: 0, y: -24, filter: "blur(8px)" }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: phase === "revealing" ? 0 : 0.15 }}
          >
            {title}
          </motion.p>
          <span className="absolute inset-x-0 top-0 h-px bg-beam/70" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
