"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BEAM_BREATH_OPACITY,
  BEAM_BREATH_SCALE,
  BEAM_PULSE_S,
} from "@/lib/projector-timing";

type Dust = {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
};

export type ProjectorSliderBeamProps = {
  className?: string;
  /** Mobile stacked layout — beam angles downward */
  mobile?: boolean;
};

/**
 * Conical light beam from projector lens to photo — warm gradient,
 * breathing pulse, dust motes confined to the beam path.
 */
export function ProjectorSliderBeam({
  className = "",
  mobile = false,
}: ProjectorSliderBeamProps) {
  const reduce = useReducedMotion();
  const [dust, setDust] = useState<Dust[]>([]);

  useEffect(() => {
    setDust(
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: 8 + Math.random() * 72,
        top: mobile ? 15 + Math.random() * 55 : 22 + Math.random() * 56,
        size: 1 + Math.random() * 2.2,
        duration: 6 + Math.random() * 7,
        delay: Math.random() * 6,
        drift: (Math.random() - 0.5) * 28,
      }))
    );
  }, [mobile]);

  const clip = mobile
    ? "polygon(4% 8%, 88% 28%, 96% 72%, 12% 58%)"
    : "polygon(0% 38%, 100% 14%, 100% 86%, 0% 62%)";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ clipPath: clip }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(246,196,83,0.22) 0%, rgba(246,196,83,0.12) 35%, rgba(234,179,8,0.06) 62%, transparent 88%)",
          willChange: "opacity, transform",
        }}
        animate={
          reduce
            ? { opacity: 0.85 }
            : { opacity: [...BEAM_BREATH_OPACITY], scale: [...BEAM_BREATH_SCALE] }
        }
        transition={
          reduce
            ? undefined
            : { duration: BEAM_PULSE_S, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 8% 50%, rgba(255,217,138,0.28) 0%, rgba(246,196,83,0.1) 40%, transparent 72%)",
          willChange: "opacity",
        }}
        animate={reduce ? { opacity: 0.7 } : { opacity: [0.55, 0.88, 0.62, 0.8, 0.55] }}
        transition={
          reduce
            ? undefined
            : { duration: BEAM_PULSE_S, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(11,9,6,0.15) 100%)",
        }}
      />

      <div className="absolute inset-0">
        {dust.map((d) => (
          <span
            key={d.id}
            className="absolute rounded-full bg-beam-soft"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              boxShadow: "0 0 5px rgba(246,196,83,0.65)",
              opacity: 0,
              animation: reduce
                ? undefined
                : `dust-drift ${d.duration}s linear ${d.delay}s infinite`,
              ["--dx" as string]: `${d.drift}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
