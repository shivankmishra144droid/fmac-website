"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BEAM_PULSE_S,
  FEED_REEL_S,
  FILM_FLICKER_OPACITY,
  FILM_FLICKER_S,
  FILM_PATH_S,
  JUDDER_BODY_DELAY_S,
  LENS_BREATH_OPACITY,
  LENS_BREATH_SCALE,
  PROJECTOR_JUDDER_BODY,
  TAKEUP_REEL_S,
} from "@/lib/projector-timing";

export type ProjectorRigPhase = "idle" | "flicker" | "black" | "leader" | "punch";

export type ProjectorRigProps = {
  reduceMotion?: boolean;
  reelChanging?: boolean;
  transitionPhase?: ProjectorRigPhase;
  className?: string;
};

const COLORS = {
  shadow: "#0f0c08",
  body: "#1a140c",
  mid: "#3d2e1a",
  brass: "#c8922f",
  highlight: "#ffd98a",
  edge: "#f6e0a8",
  film: "#8a6b3a",
} as const;

const FILM_PATH_D =
  "M 28 64 C 34 76, 40 88, 46 96 C 48 100, 50 88, 52 72 C 54 58, 52 50, 52 46";

/**
 * Premium vintage projector — duotone line-art, dual reels, film path,
 * lens glow + flicker, vent shimmer, hover response, reel-change catch.
 */
export function ProjectorRig({
  reduceMotion = false,
  reelChanging = false,
  transitionPhase = "idle",
  className = "",
}: ProjectorRigProps) {
  const still = reduceMotion;
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    setIsTouch(
      window.matchMedia("(pointer: coarse)").matches || !window.matchMedia("(hover: hover)").matches
    );
  }, []);

  const hoverBoost = hovered && !isTouch && !still;
  const feedDuration = hoverBoost ? FEED_REEL_S * 0.78 : FEED_REEL_S;
  const takeupDuration = hoverBoost ? TAKEUP_REEL_S * 0.8 : TAKEUP_REEL_S;

  const takeupCatching =
    transitionPhase === "black" || transitionPhase === "leader";
  const takeupResuming = transitionPhase === "punch";

  const bodyMotion = still
    ? undefined
    : reelChanging && transitionPhase !== "idle"
      ? { x: [0, -1.2, 1, 0], y: [0, 3, -2, 0] }
      : PROJECTOR_JUDDER_BODY.animate;

  const bodyTransition = still
    ? undefined
    : reelChanging && transitionPhase !== "idle"
      ? { duration: 0.32, ease: [0.55, 0.06, 0.68, 0.19] as const }
      : PROJECTOR_JUDDER_BODY.transition;

  const gpuHint = !still && (hovered || transitionPhase === "idle");

  return (
    <motion.div
      ref={rootRef}
      aria-hidden
      className={`relative select-none ${className}`}
      animate={bodyMotion}
      transition={bodyTransition}
      style={{ willChange: gpuHint ? "transform" : undefined }}
      onPointerEnter={() => !isTouch && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        className="pointer-events-none absolute -inset-x-3 bottom-[6%] z-0 h-[14%] rounded-[50%]"
        style={{
          background: "radial-gradient(ellipse, rgba(58,42,20,0.55) 0%, transparent 72%)",
          filter: "blur(10px)",
        }}
      />

      {!still && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            width: "22%",
            height: "14%",
            right: "-4%",
            top: "44%",
            transform: "translateY(-50%)",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-beam blur-lg"
            animate={{
              opacity: hoverBoost
                ? [...LENS_BREATH_OPACITY].map((o) => Math.min(1, o * 1.15))
                : [...LENS_BREATH_OPACITY],
              scale: hoverBoost
                ? [...LENS_BREATH_SCALE].map((s) => s * 1.06)
                : [...LENS_BREATH_SCALE],
            }}
            transition={{
              duration: BEAM_PULSE_S,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ willChange: "transform, opacity" }}
          />
          <motion.div
            className="absolute inset-[15%] rounded-full bg-beam-soft blur-sm"
            animate={{ opacity: [...FILM_FLICKER_OPACITY] }}
            transition={{
              duration: FILM_FLICKER_S,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ willChange: "opacity" }}
          />
        </div>
      )}

      <svg
        viewBox="0 0 128 172"
        className="relative z-[1] h-full w-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="proj-body-fill" x1="0%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor={COLORS.mid} />
            <stop offset="55%" stopColor={COLORS.body} />
            <stop offset="100%" stopColor={COLORS.shadow} />
          </linearGradient>
          <linearGradient id="proj-brass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={COLORS.highlight} />
            <stop offset="100%" stopColor={COLORS.brass} />
          </linearGradient>
          <linearGradient id="proj-lens-glass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={COLORS.highlight} stopOpacity="0.9" />
            <stop offset="100%" stopColor={COLORS.brass} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <rect x="12" y="130" width="66" height="9" fill="url(#proj-body-fill)" stroke={COLORS.mid} strokeWidth="1.2" />
        <rect x="16" y="139" width="58" height="24" rx="1" fill="url(#proj-body-fill)" stroke={COLORS.mid} strokeWidth="1.2" />

        <path
          d="M20 74 L20 130 L78 130 L78 74 Z"
          fill="url(#proj-body-fill)"
          stroke={COLORS.mid}
          strokeWidth="1.3"
        />
        <path d="M21 74 L77 74" stroke={COLORS.edge} strokeWidth="1" strokeLinecap="square" opacity="0.85" />
        <path d="M20 74 L20 88" stroke={COLORS.edge} strokeWidth="0.75" opacity="0.5" />

        <g opacity="0.55">
          {[0, 1, 2, 3].map((i) => (
            <line
              key={`vent-${i}`}
              x1={26 + i * 5}
              y1="118"
              x2={26 + i * 5}
              y2="126"
              stroke={COLORS.shadow}
              strokeWidth="1.2"
            />
          ))}
        </g>

        <line x1="20" y1="92" x2="78" y2="92" stroke={COLORS.mid} strokeWidth="0.8" opacity="0.45" />
        <line x1="20" y1="110" x2="78" y2="110" stroke={COLORS.mid} strokeWidth="0.8" opacity="0.35" />

        <rect x="78" y="84" width="28" height="34" fill={COLORS.body} stroke={COLORS.brass} strokeWidth="1.3" />
        <path
          d="M106 90 L124 76 L124 110 L106 118 Z"
          fill={COLORS.shadow}
          stroke={COLORS.brass}
          strokeWidth="1.3"
        />
        <circle cx="122" cy="94" r="6" stroke="url(#proj-brass)" strokeWidth="1.4" fill={COLORS.shadow} />
        <circle cx="122" cy="94" r="2.5" fill="url(#proj-lens-glass)" />

        {!still && (
          <motion.path
            d={FILM_PATH_D}
            stroke={COLORS.film}
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="3 5"
            opacity="0.65"
            animate={{ strokeDashoffset: [0, -32] }}
            transition={{
              duration: FILM_PATH_S,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
        {still && (
          <path d={FILM_PATH_D} stroke={COLORS.film} strokeWidth="1.1" fill="none" opacity="0.45" />
        )}

        <g transform="translate(28, 58)">
          {still ? (
            <ReelGraphic size="feed" />
          ) : (
            <motion.g
              animate={{ rotate: 360 }}
              transition={{
                duration: feedDuration,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ transformOrigin: "0px 0px", willChange: "transform" }}
            >
              <ReelGraphic size="feed" />
            </motion.g>
          )}
        </g>

        <g transform="translate(52, 44)">
          {still ? (
            <ReelGraphic size="takeup" />
          ) : (
            <motion.g
              animate={
                takeupCatching && !takeupResuming
                  ? { rotate: [0, 6, 2, 0, 0, 0] }
                  : takeupResuming
                    ? { rotate: [0, 14, 360] }
                    : { rotate: 360 }
              }
              transition={
                takeupCatching && !takeupResuming
                  ? {
                      duration: 0.22,
                      ease: [0.55, 0.06, 0.68, 0.19],
                      times: [0, 0.2, 0.35, 0.5, 0.75, 1],
                    }
                  : takeupResuming
                    ? { duration: 0.28, ease: [0.16, 1, 0.3, 1], times: [0, 0.15, 1] }
                    : { duration: takeupDuration, repeat: Infinity, ease: "linear" }
              }
              style={{ transformOrigin: "0px 0px", willChange: "transform" }}
            >
              <ReelGraphic size="takeup" />
            </motion.g>
          )}
        </g>
      </svg>

      {!still && (
        <motion.div
          className="pointer-events-none absolute z-[2] mix-blend-screen"
          style={{
            left: "18%",
            top: "62%",
            width: "28%",
            height: "12%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,217,138,0.12), transparent)",
            willChange: "transform, opacity",
          }}
          animate={{
            opacity: [0.06, 0.16, 0.08, 0.14, 0.06],
            x: [0, 3, -2, 2, 0],
            skewX: [0, 2, -1, 1.5, 0],
          }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}

function ReelGraphic({ size }: { size: "feed" | "takeup" }) {
  const r = size === "feed" ? 11 : 24;
  const strokeW = size === "feed" ? 1.1 : 1.4;

  return (
    <>
      <circle r={r} fill={COLORS.shadow} stroke="url(#proj-brass)" strokeWidth={strokeW} />
      <circle r={r * 0.28} fill={COLORS.mid} stroke={COLORS.brass} strokeWidth="0.9" />
      {[0, 45, 90, 135].map((deg) => (
        <line
          key={deg}
          x1="0"
          y1={-r}
          x2="0"
          y2={r}
          stroke={COLORS.brass}
          strokeWidth="0.9"
          opacity="0.65"
          transform={`rotate(${deg})`}
        />
      ))}
      {size === "takeup" &&
        [0, 60, 120, 180, 240, 300].map((deg) => (
          <circle
            key={`h-${deg}`}
            cx="0"
            cy={-r * 0.72}
            r="2"
            fill={COLORS.highlight}
            opacity="0.3"
            transform={`rotate(${deg})`}
          />
        ))}
      <path
        d={`M ${-r * 0.6} ${-r * 0.75} A ${r} ${r} 0 0 1 ${r * 0.6} ${-r * 0.75}`}
        stroke={COLORS.edge}
        strokeWidth="0.7"
        fill="none"
        opacity="0.7"
      />
    </>
  );
}

export { BEAM_PULSE_S, FILM_FLICKER_S, JUDDER_BODY_DELAY_S };
