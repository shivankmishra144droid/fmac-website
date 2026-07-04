"use client";

import { motion, useReducedMotion } from "framer-motion";

/** ink-800 — reads on ink-950 page without breaking flat palette */
const DEFAULT_BODY = "#1a140c";
const DEFAULT_BODY_STROKE = "#2e2214";
const DEFAULT_ACCENT = "#eab308";
const BEAM_PULSE_S = 7;
/** Feed reel — full turn; fast enough to read at a glance */
const FEED_REEL_S = 2.5;
/** Take-up reel — marginally slower unspool */
const TAKEUP_REEL_S = 3.2;

export type ProjectorIconProps = {
  /** Pixel width/height (square). Omit to size via className. */
  size?: number;
  bodyColor?: string;
  bodyStroke?: string;
  accentColor?: string;
  /** Base beam fill opacity before pulse (0–1). */
  beamOpacity?: number;
  animate?: boolean;
  className?: string;
};

/**
 * Flat vintage-projector illustration — bold silhouette, yellow reels + beam.
 * Separate SVG groups for independent reel rotation and beam breathing.
 */
export function ProjectorIcon({
  size,
  bodyColor = DEFAULT_BODY,
  bodyStroke = DEFAULT_BODY_STROKE,
  accentColor = DEFAULT_ACCENT,
  beamOpacity = 0.45,
  animate = true,
  className = "",
}: ProjectorIconProps) {
  const reduceMotion = useReducedMotion();
  const motionOn = animate && !reduceMotion;

  const feedTransition = motionOn
    ? { duration: FEED_REEL_S, repeat: Infinity, ease: "linear" as const }
    : undefined;
  const takeupTransition = motionOn
    ? { duration: TAKEUP_REEL_S, repeat: Infinity, ease: "linear" as const }
    : undefined;
  const beamTransition = motionOn
    ? { duration: BEAM_PULSE_S, repeat: Infinity, ease: "easeInOut" as const }
    : undefined;

  return (
    <svg
      viewBox="0 0 128 148"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      width={size}
      height={size}
      className={className}
      style={size ? undefined : { width: "100%", height: "100%" }}
    >
      {/* Base shadow */}
      <ellipse cx="62" cy="140" rx="30" ry="4.5" fill="#000000" opacity="0.28" />

      {/* Light beam — behind body, flat triangle from lens */}
      <motion.polygon
        id="beam"
        points="94,74 126,56 126,96"
        fill={accentColor}
        animate={
          motionOn
            ? {
                opacity: [
                  beamOpacity,
                  beamOpacity * 1.25,
                  beamOpacity * 0.9,
                  beamOpacity * 1.12,
                  beamOpacity,
                ],
              }
            : { opacity: beamOpacity }
        }
        transition={beamTransition}
        style={{ willChange: motionOn ? "opacity" : undefined }}
      />

      {/* Tripod — static */}
      <g id="tripod" fill={bodyColor} stroke={bodyStroke} strokeWidth="1">
        <rect x="57" y="110" width="10" height="20" rx="1" />
        <path d="M62 128 L40 142 L43 142 L62 131 Z" />
        <path d="M62 128 L84 142 L81 142 L62 131 Z" />
        <path d="M59 128 L65 128 L64 142 L60 142 Z" />
      </g>

      {/* Body housing — static */}
      <g id="body" fill={bodyColor} stroke={bodyStroke} strokeWidth="1.2" strokeLinejoin="round">
        <path d="M22 100 H86 V108 H22 Z" />
        <path d="M18 56 H82 V100 H18 Z" />
        <path d="M80 64 H100 V92 H80 Z" />
        <circle cx="102" cy="78" r="6" />
        <circle cx="24" cy="80" r="4.5" fill={bodyColor} />
        <path
          d="M20 80 H11"
          stroke={bodyStroke}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {[0, 1, 2, 3].map((i) => (
          <rect key={`vent-${i}`} x={30 + i * 5.5} y="70" width="2.2" height="16" rx="0.5" />
        ))}
        <path d="M18 52 H82 V58 H18 Z" />
        <path d="M36 56 V100" stroke={bodyStroke} strokeWidth="0.8" opacity="0.5" />
      </g>

      {/* Feed reel */}
      <g transform="translate(36, 38)">
        {motionOn ? (
          <motion.g
            animate={{ rotate: 360 }}
            transition={feedTransition}
            style={{ transformOrigin: "0px 0px", willChange: "transform" }}
          >
            <ReelWheel r={13} bodyColor={bodyColor} accentColor={accentColor} />
          </motion.g>
        ) : (
          <ReelWheel r={13} bodyColor={bodyColor} accentColor={accentColor} />
        )}
      </g>

      {/* Take-up reel */}
      <g transform="translate(64, 28)">
        {motionOn ? (
          <motion.g
            animate={{ rotate: 360 }}
            transition={takeupTransition}
            style={{ transformOrigin: "0px 0px", willChange: "transform" }}
          >
            <ReelWheel r={17} bodyColor={bodyColor} accentColor={accentColor} spokes={8} />
          </motion.g>
        ) : (
          <ReelWheel r={17} bodyColor={bodyColor} accentColor={accentColor} spokes={8} />
        )}
      </g>
    </svg>
  );
}

function ReelWheel({
  r,
  bodyColor,
  accentColor,
  spokes = 6,
}: {
  r: number;
  bodyColor: string;
  accentColor: string;
  spokes?: number;
}) {
  const hub = r * 0.26;
  const strokeW = Math.max(1.4, r * 0.12);

  return (
    <>
      <circle r={r} fill={accentColor} />
      {Array.from({ length: spokes }, (_, i) => {
        const angle = (360 / spokes) * i;
        return (
          <line
            key={i}
            x1="0"
            y1={-r + 1}
            x2="0"
            y2={r - 1}
            stroke={bodyColor}
            strokeWidth={strokeW}
            strokeLinecap="round"
            transform={`rotate(${angle})`}
          />
        );
      })}
      <circle r={hub} fill={bodyColor} />
      {Array.from({ length: spokes }, (_, i) => {
        const angle = (360 / spokes) * i + 360 / spokes / 2;
        return (
          <circle
            key={`dot-${i}`}
            cx="0"
            cy={-(r * 0.6)}
            r={r * 0.1}
            fill={accentColor}
            transform={`rotate(${angle})`}
          />
        );
      })}
    </>
  );
}
