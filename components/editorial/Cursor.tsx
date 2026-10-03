"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Contextual cursor (desktop pointers only, off under reduced motion).
 * - A crisp dot tracks the pointer 1:1; a ring trails it on a spring.
 * - Over anything with `data-cursor="Label"` the ring opens into a disc with that label.
 * - Over plain links/buttons the ring grows a little; over text fields the native caret returns.
 * - Elements with `data-magnetic` pull the ring toward their centre.
 */
export function Cursor() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "link" | "label" | "text">("idle");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Dot = raw pointer; x/y = ring target (pulled toward magnets).
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 });
  const magnet = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduce.matches);
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  // Hide the native cursor only while ours is active (admin never mounts this).
  useEffect(() => {
    document.documentElement.classList.toggle("has-cursor", enabled);
    return () => document.documentElement.classList.remove("has-cursor");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setVisible(true);
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      const m = magnet.current;
      if (m) {
        // Ease 35% of the way toward the magnet's centre.
        const r = m.getBoundingClientRect();
        x.set(e.clientX + (r.left + r.width / 2 - e.clientX) * 0.35);
        y.set(e.clientY + (r.top + r.height / 2 - e.clientY) * 0.35);
      } else {
        x.set(e.clientX);
        y.set(e.clientY);
      }
    };

    const onOver = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      if (el.closest("input, textarea, select, [contenteditable='true']")) {
        setMode("text");
        setLabel(null);
        magnet.current = null;
        return;
      }
      const labelled = el.closest<HTMLElement>("[data-cursor]");
      const interactive = el.closest<HTMLElement>("a, button, [role='button'], [role='tab'], label");
      magnet.current = el.closest<HTMLElement>("[data-magnetic]");
      if (labelled?.dataset.cursor) {
        setMode("label");
        setLabel(labelled.dataset.cursor);
      } else if (interactive) {
        setMode("link");
        setLabel(null);
      } else {
        setMode("idle");
        setLabel(null);
      }
    };

    const onLeaveWindow = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    window.addEventListener("blur", onLeaveWindow);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
      window.removeEventListener("blur", onLeaveWindow);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled, x, y, dotX, dotY]);

  // A route change swaps the element under the pointer without a pointerover; reset.
  useEffect(() => {
    setMode("idle");
    setLabel(null);
    magnet.current = null;
  }, [pathname]);

  if (!enabled) return null;

  const ringSize = mode === "label" ? 88 : mode === "link" ? 44 : 30;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      {/* Ring (trails on a spring) */}
      <motion.div
        className="absolute left-0 top-0"
        style={{ x: ringX, y: ringY }}
      >
        <motion.div
          className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${
            mode === "label" ? "bg-bone text-stage" : "border border-bone/60"
          }`}
          animate={{
            width: ringSize,
            height: ringSize,
            opacity: visible && mode !== "text" ? 1 : 0,
            scale: pressed ? 0.85 : 1,
          }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        >
          <AnimatePresence mode="wait">
            {mode === "label" && label && (
              <motion.span
                key={label}
                className="kicker text-[0.62rem]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Dot (1:1 with the pointer) */}
      <motion.div className="absolute left-0 top-0" style={{ x: dotX, y: dotY }}>
        <motion.div
          className="h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-beam"
          animate={{ opacity: visible && mode !== "label" && mode !== "text" ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        />
      </motion.div>
    </div>
  );
}
