"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

export type ProjectorBeamProps = {
  intensity?: number;
  speed?: number;
  color?: string;
  particleCount?: number;
  parallax?: number;
  className?: string;
};

type Dust = {
  id: number;
  left: number;
  bottom: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
};

export function ProjectorBeam({
  intensity = 0.9,
  speed = 1,
  color = "#f6c453",
  particleCount = 14,
  parallax = 26,
  className = "",
}: ProjectorBeamProps) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [needsOrientation, setNeedsOrientation] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 });

  const translateX = useTransform(sx, [-0.5, 0.5], [-parallax, parallax]);
  const translateY = useTransform(sy, [-0.5, 0.5], [-parallax * 0.5, parallax * 0.5]);
  const rotate = useTransform(sx, [-0.5, 0.5], [-4, 4]);

  // Desktop: pointer parallax
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mx.set(e.clientX / w - 0.5);
      my.set(e.clientY / h - 0.5);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduce]);

  // Mobile: device orientation tilt (with iOS permission prompt)
  useEffect(() => {
    if (reduce) return;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (!isCoarse) return;

    const onOrient = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      mx.set(Math.max(-0.5, Math.min(0.5, gamma / 45)));
      my.set(Math.max(-0.5, Math.min(0.5, (beta - 45) / 90)));
    };

    const attach = () => {
      window.addEventListener("deviceorientation", onOrient);
    };

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      "requestPermission" in DeviceOrientationEvent
    ) {
      setNeedsOrientation(true);
    } else {
      attach();
    }

    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [mx, my, reduce]);

  async function requestOrientation() {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (!DOE.requestPermission) return;
    try {
      const result = await DOE.requestPermission();
      if (result === "granted") setNeedsOrientation(false);
    } catch {
      /* user denied */
    }
  }

  const [dust, setDust] = useState<Dust[]>([]);
  useEffect(() => {
    setDust(
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: 30 + Math.random() * 40,
        bottom: Math.random() * 40,
        size: 1 + Math.random() * 2.6,
        duration: (7 + Math.random() * 9) / speed,
        delay: Math.random() * 8,
        drift: (Math.random() - 0.5) * 40,
      }))
    );
  }, [particleCount, speed]);

  const flicker = useMemo(() => {
    const steps = 9;
    const opacities = Array.from({ length: steps }, (_, i) => {
      if (i === 0 || i === steps - 1) return intensity;
      const dip =
        Math.random() < 0.35 ? 0.55 + Math.random() * 0.2 : 0.86 + Math.random() * 0.14;
      return +(intensity * dip).toFixed(3);
    });
    const scales = opacities.map((_, i) =>
      i === 0 || i === steps - 1 ? 1 : +(0.985 + Math.random() * 0.03).toFixed(3)
    );
    return { opacities, scales, duration: (3.4 + Math.random() * 1.8) / speed };
  }, [intensity, speed]);

  const beamGradient = `radial-gradient(60% 55% at 50% 42%, ${hexA(color, 0.95)} 0%, ${hexA(color, 0.55)} 26%, ${hexA(color, 0.16)} 52%, rgba(0,0,0,0) 74%)`;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {needsOrientation && !reduce && (
        <button
          type="button"
          onClick={requestOrientation}
          className="pointer-events-auto absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-marquee/40 bg-ink-900/80 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-marquee md:hidden"
        >
          Enable tilt
        </button>
      )}

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ x: translateX, y: translateY, rotate }}
      >
        <motion.div
          className="relative h-[70vh] w-[70vh] max-w-[1100px] rounded-full blur-2xl"
          style={{ background: beamGradient, willChange: "opacity, transform" }}
          animate={
            reduce ? { opacity: intensity } : { opacity: flicker.opacities, scale: flicker.scales }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: flicker.duration,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }
          }
        />
        <motion.div
          className="absolute h-[26vh] w-[26vh] rounded-full blur-xl"
          style={{
            background: `radial-gradient(circle, ${hexA(color, 0.9)} 0%, rgba(0,0,0,0) 70%)`,
          }}
          animate={
            reduce
              ? { opacity: intensity * 0.9 }
              : {
                  opacity: [0.8, 0.55, 0.92, 0.7, 0.85].map((n) => n * intensity),
                }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: (2.2 + Math.random()) / speed,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }
          }
        />
      </motion.div>

      <div className="absolute inset-0">
        {dust.map((d) => (
          <span
            key={d.id}
            className="absolute rounded-full"
            style={{
              left: `${d.left}%`,
              bottom: `${d.bottom}%`,
              width: d.size,
              height: d.size,
              background: hexA(color, 0.9),
              boxShadow: `0 0 6px ${hexA(color, 0.7)}`,
              opacity: 0,
              animation: reduce ? undefined : `dust-drift ${d.duration}s linear ${d.delay}s infinite`,
              ["--dx" as string]: `${d.drift}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function hexA(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
