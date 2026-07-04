"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

export type TiltPhotoProps = {
  src: string;
  alt: string;
  foregroundSrc?: string;
  priority?: boolean;
  disableTilt?: boolean;
  /** Ken Burns loop duration in ms (match slide auto-advance) */
  kenBurnsMs?: number;
  className?: string;
  sizes?: string;
};

const PHOTO_GRADE =
  "object-cover object-center brightness-[0.92] contrast-[1.06] saturate-[0.88] sepia-[0.12]";

const SPRING = { stiffness: 120, damping: 26, mass: 0.35 };

/**
 * Lenticular tilt card — four independent GPU layers:
 * 1. Ken Burns (scale on image shell)
 * 2. Cursor parallax (translate on parallax shell)
 * 3. Card tilt (rotate on tilt shell)
 * 4. Light sweep (translate on overlay shells)
 */
export function TiltPhoto({
  src,
  alt,
  foregroundSrc,
  priority,
  disableTilt = false,
  kenBurnsMs = 5500,
  className = "",
  sizes = "(max-width: 768px) 100vw, 922px",
}: TiltPhotoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);
  const springX = useSpring(normX, SPRING);
  const springY = useSpring(normY, SPRING);

  const interactingRef = useRef(false);
  interactingRef.current = interacting;

  const parallaxOn = !disableTilt;
  const cursorTiltOn = parallaxOn && !isTouch;

  const gpuHint = interacting && parallaxOn;

  useEffect(() => {
    setIsTouch(
      window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window
    );
  }, []);

  const markInteracting = () => {
    setInteracting(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setInteracting(false), 140);
  };

  useEffect(() => {
    if (!cursorTiltOn) return;
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    let px = 0.5;
    let py = 0.5;

    const flush = () => {
      raf = 0;
      normX.set(px);
      normY.set(py);
      markInteracting();
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      px = (e.clientX - rect.left) / rect.width;
      py = (e.clientY - rect.top) / rect.height;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      px = 0.5;
      py = 0.5;
      if (!raf) raf = requestAnimationFrame(flush);
      setInteracting(false);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [cursorTiltOn, normX, normY]);

  useEffect(() => {
    if (!parallaxOn || !isTouch) return;

    let usingGyro = false;
    const onOrient = (e: DeviceOrientationEvent) => {
      usingGyro = true;
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      normX.set(0.5 + Math.max(-0.45, Math.min(0.45, gamma / 50)));
      normY.set(0.5 + Math.max(-0.45, Math.min(0.45, (beta - 45) / 100)));
    };
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [parallaxOn, isTouch, normX, normY]);

  useAnimationFrame((t) => {
    if (!parallaxOn || interactingRef.current) return;
    const s = t / 1000;
    normX.set(0.5 + Math.sin(s * 0.42) * 0.18);
    normY.set(0.5 + Math.cos(s * 0.36) * 0.14);
  });

  const lightX = useTransform(springX, [0, 1], ["-18%", "58%"]);
  const lightY = useTransform(springY, [0, 1], ["-12%", "52%"]);

  const shift = parallaxOn ? 1 : 0;
  const bgX = useTransform(springX, [0, 1], [3 * shift, -3 * shift]);
  const bgY = useTransform(springY, [0, 1], [2.5 * shift, -2.5 * shift]);
  const fgX = useTransform(springX, [0, 1], [-6 * shift, 6 * shift]);
  const fgY = useTransform(springY, [0, 1], [-4.5 * shift, 4.5 * shift]);
  const layerX = useTransform(springX, [0, 1], [-5 * shift, 5 * shift]);
  const layerY = useTransform(springY, [0, 1], [-3.5 * shift, 3.5 * shift]);

  const cardRotateY = useTransform(springX, [0, 1], cursorTiltOn ? [1.8, -1.8] : [0, 0]);
  const cardRotateX = useTransform(springY, [0, 1], cursorTiltOn ? [-1.4, 1.4] : [0, 0]);

  const shadowX = useTransform(springX, [0, 1], [8 * shift, -8 * shift]);
  const shadowY = useTransform(springY, [0, 1], [6 * shift, -6 * shift]);

  const layerStyle = gpuHint
    ? ({ willChange: "transform" } as const)
    : undefined;

  return (
    <div className={`relative h-full w-full ${className}`}>
      {parallaxOn && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-x-4 bottom-[-10%] z-0 h-[18%] rounded-[50%] bg-black/50 blur-2xl"
          style={{ x: shadowX, y: shadowY, ...layerStyle }}
        />
      )}

      <div
        ref={containerRef}
        className="relative z-[1] h-full w-full overflow-hidden"
        style={{ perspective: cursorTiltOn ? 1000 : undefined }}
      >
        {/* Layer 3 — card tilt (rotate only) */}
        <motion.div
          className="relative h-full w-full"
          style={{
            rotateX: cardRotateX,
            rotateY: cardRotateY,
            transformStyle: "preserve-3d",
            ...layerStyle,
          }}
        >
          {/* Layer 2 — parallax translate (separate from Ken Burns scale) */}
          <motion.div
            className="absolute inset-0"
            style={{
              x: foregroundSrc ? bgX : layerX,
              y: foregroundSrc ? bgY : layerY,
              ...layerStyle,
            }}
          >
            {/* Layer 1 — Ken Burns (scale only, long loop) */}
            <motion.div
              className="absolute inset-[-4%]"
              animate={parallaxOn ? { scale: [1, 1.03] } : { scale: 1 }}
              transition={
                parallaxOn
                  ? {
                      duration: kenBurnsMs / 1000,
                      ease: "linear",
                      repeat: Infinity,
                      repeatType: "reverse",
                    }
                  : { duration: 0 }
              }
              style={layerStyle}
            >
              <Image
                src={src}
                alt={alt}
                fill
                priority={priority}
                sizes={sizes}
                className={PHOTO_GRADE}
                draggable={false}
              />
            </motion.div>
          </motion.div>

          {foregroundSrc && (
            <motion.div
              className="absolute inset-[-2%] z-[2]"
              style={{ x: fgX, y: fgY, ...layerStyle }}
            >
              <Image
                src={foregroundSrc}
                alt=""
                fill
                sizes={sizes}
                className="object-cover object-center"
                draggable={false}
                aria-hidden
              />
            </motion.div>
          )}

          {/* Layer 4 — light sweep (transform-only overlays, no background string updates) */}
          {parallaxOn && (
            <>
              <motion.div
                aria-hidden
                className="pointer-events-none absolute z-[3] h-[70%] w-[55%] rounded-full mix-blend-soft-light"
                style={{
                  x: lightX,
                  y: lightY,
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 40%, transparent 72%)",
                  opacity: interacting ? 0.85 : 0.45,
                  ...layerStyle,
                }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute z-[3] h-[120%] w-[35%] mix-blend-overlay opacity-30"
                style={{
                  x: lightX,
                  y: lightY,
                  rotate: -18,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                  ...layerStyle,
                }}
              />
            </>
          )}

          <StaticGrain />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[4] mix-blend-multiply"
            style={{
              background:
                "linear-gradient(145deg, rgba(58,42,20,0.28) 0%, transparent 45%, rgba(11,9,6,0.2) 100%)",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

/** CSS/SVG grain — zero RAF cost */
function StaticGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[3] opacity-[0.042] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }}
    />
  );
}
