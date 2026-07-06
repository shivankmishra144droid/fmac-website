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

/** Wide horizontal falloff — no clip-path or mask (avoids hard seam) */
const DESKTOP_BEAM =
  "linear-gradient(to right, rgba(255,217,138,0.34) 0%, rgba(246,196,83,0.22) 7%, rgba(246,196,83,0.14) 14%, rgba(234,179,8,0.09) 20%, rgba(234,179,8,0.055) 26%, rgba(234,179,8,0.03) 32%, rgba(234,179,8,0.014) 38%, rgba(234,179,8,0.006) 42%, transparent 48%)";

const DESKTOP_GLOW =
  "radial-gradient(ellipse 110% 80% at 4% 50%, rgba(255,217,138,0.36) 0%, rgba(246,196,83,0.14) 32%, rgba(246,196,83,0.05) 52%, transparent 72%)";

const MOBILE_BEAM =
  "linear-gradient(to bottom, rgba(255,217,138,0.3) 0%, rgba(246,196,83,0.16) 12%, rgba(234,179,8,0.08) 22%, rgba(234,179,8,0.035) 32%, rgba(234,179,8,0.012) 40%, transparent 50%)";

const MOBILE_GLOW =
  "radial-gradient(ellipse 80% 60% at 18% 12%, rgba(255,217,138,0.28) 0%, rgba(246,196,83,0.1) 40%, transparent 68%)";

/**
 * Conical light beam from projector lens to photo — gradient-only falloff,
 * extends under the photo's left edge (photo sits above and occludes the tail).
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
        left: mobile ? 10 + Math.random() * 70 : 4 + Math.random() * 38,
        top: mobile ? 15 + Math.random() * 55 : 22 + Math.random() * 56,
        size: 1 + Math.random() * 2.2,
        duration: 6 + Math.random() * 7,
        delay: Math.random() * 6,
        drift: (Math.random() - 0.5) * 28,
      }))
    );
  }, [mobile]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: mobile ? MOBILE_BEAM : DESKTOP_BEAM,
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
          background: mobile ? MOBILE_GLOW : DESKTOP_GLOW,
          willChange: "opacity",
        }}
        animate={reduce ? { opacity: 0.7 } : { opacity: [0.55, 0.88, 0.62, 0.8, 0.55] }}
        transition={
          reduce
            ? undefined
            : { duration: BEAM_PULSE_S, repeat: Infinity, ease: "easeInOut" }
        }
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
