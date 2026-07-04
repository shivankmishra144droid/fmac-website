"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BEAM_PULSE_S,
  FEED_REEL_S,
  LENS_BREATH_OPACITY,
  LENS_BREATH_SCALE,
  TAKEUP_REEL_S,
} from "@/lib/projector-timing";
import {
  PROJECTOR_IMAGE_PATHS,
  PROJECTOR_LENS_GLOW,
  PROJECTOR_REEL_SLOTS,
  type ReelSlot,
} from "@/lib/projector-layout";

export type ProjectorRigPhase = "idle" | "flicker" | "black" | "leader" | "punch";

export type ProjectorRigProps = {
  bodyImage?: string;
  feedReelImage?: string;
  takeUpReelImage?: string;
  /** Colored-circle stand-ins until real PNG assets are ready */
  placeholder?: boolean;
  feedReelSlot?: ReelSlot;
  takeUpReelSlot?: ReelSlot;
  lensGlowSlot?: typeof PROJECTOR_LENS_GLOW;
  reduceMotion?: boolean;
  transitionPhase?: ProjectorRigPhase;
  className?: string;
};

const BODY_DROP_SHADOW =
  "drop-shadow(0 10px 18px rgba(42, 30, 14, 0.55)) drop-shadow(0 4px 8px rgba(20, 14, 6, 0.35))";

/**
 * Photoreal layered projector — static body PNG, independently rotating reel cutouts,
 * lens glow overlay. No SVG shading; photographic detail carries realism.
 */
export function ProjectorRig({
  bodyImage = PROJECTOR_IMAGE_PATHS.body,
  feedReelImage = PROJECTOR_IMAGE_PATHS.feedReel,
  takeUpReelImage = PROJECTOR_IMAGE_PATHS.takeUpReel,
  placeholder = true,
  feedReelSlot = PROJECTOR_REEL_SLOTS.feed,
  takeUpReelSlot = PROJECTOR_REEL_SLOTS.takeUp,
  lensGlowSlot = PROJECTOR_LENS_GLOW,
  reduceMotion = false,
  transitionPhase = "idle",
  className = "",
}: ProjectorRigProps) {
  const still = reduceMotion;
  const [hovered, setHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(true);
  const [bodyFailed, setBodyFailed] = useState(false);
  const [feedFailed, setFeedFailed] = useState(false);
  const [takeUpFailed, setTakeUpFailed] = useState(false);

  useEffect(() => {
    setIsTouch(
      window.matchMedia("(pointer: coarse)").matches ||
        !window.matchMedia("(hover: hover)").matches
    );
  }, []);

  const useBodyPlaceholder = placeholder || bodyFailed;
  const useFeedPlaceholder = placeholder || feedFailed;
  const useTakeUpPlaceholder = placeholder || takeUpFailed;

  const hoverBoost = hovered && !isTouch && !still;
  const feedDuration = hoverBoost ? FEED_REEL_S * 0.78 : FEED_REEL_S;
  const takeupDuration = hoverBoost ? TAKEUP_REEL_S * 0.8 : TAKEUP_REEL_S;

  const takeupCatching =
    transitionPhase === "black" || transitionPhase === "leader";
  const takeupResuming = transitionPhase === "punch";

  const feedRotate = still ? undefined : { rotate: 360 };
  const feedTransition = still
    ? undefined
    : { duration: feedDuration, repeat: Infinity, ease: "linear" as const };

  const takeupAnimate = still
    ? undefined
    : takeupCatching && !takeupResuming
      ? { rotate: [0, 6, 2, 0, 0, 0] }
      : takeupResuming
        ? { rotate: [0, 14, 360] }
        : { rotate: 360 };

  const takeupTransition = still
    ? undefined
    : takeupCatching && !takeupResuming
      ? {
          duration: 0.22,
          ease: [0.55, 0.06, 0.68, 0.19] as const,
          times: [0, 0.2, 0.35, 0.5, 0.75, 1],
        }
      : takeupResuming
        ? { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const, times: [0, 0.15, 1] }
        : { duration: takeupDuration, repeat: Infinity, ease: "linear" as const };

  return (
    <div
      aria-hidden
      className={`relative aspect-[3/4] w-full select-none ${className}`}
      onPointerEnter={() => !isTouch && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Static body — never animates */}
      <div
        className="relative z-[1] h-full w-full"
        style={{ filter: BODY_DROP_SHADOW }}
      >
        {useBodyPlaceholder ? (
          <PlaceholderBody />
        ) : (
          <Image
            src={bodyImage}
            alt=""
            fill
            priority
            sizes="(max-width: 767px) 52px, 148px"
            className="object-contain object-center"
            onError={() => setBodyFailed(true)}
          />
        )}
      </div>

      {/* Feed reel */}
      <motion.div
        className="absolute z-[2] relative"
        style={{
          top: feedReelSlot.top,
          left: feedReelSlot.left,
          width: feedReelSlot.width,
          height: feedReelSlot.height,
          transformOrigin: "center center",
          willChange: still ? undefined : "transform",
        }}
        animate={feedRotate}
        transition={feedTransition}
      >
        {useFeedPlaceholder ? (
          <PlaceholderReel variant="feed" />
        ) : (
          <Image
            src={feedReelImage}
            alt=""
            fill
            sizes="48px"
            className="object-contain object-center"
            onError={() => setFeedFailed(true)}
          />
        )}
      </motion.div>

      {/* Take-up reel */}
      <motion.div
        className="absolute z-[2] relative"
        style={{
          top: takeUpReelSlot.top,
          left: takeUpReelSlot.left,
          width: takeUpReelSlot.width,
          height: takeUpReelSlot.height,
          transformOrigin: "center center",
          willChange: still ? undefined : "transform",
        }}
        animate={takeupAnimate}
        transition={takeupTransition}
      >
        {useTakeUpPlaceholder ? (
          <PlaceholderReel variant="takeup" />
        ) : (
          <Image
            src={takeUpReelImage}
            alt=""
            fill
            sizes="72px"
            className="object-contain object-center"
            onError={() => setTakeUpFailed(true)}
          />
        )}
      </motion.div>

      {/* Lens glow — lighting overlay, not part of the photo */}
      {!still && (
        <motion.div
          className="pointer-events-none absolute z-[3] rounded-full"
          style={{
            top: lensGlowSlot.top,
            left: lensGlowSlot.left,
            width: lensGlowSlot.width,
            height: lensGlowSlot.height,
            background:
              "radial-gradient(ellipse at center, rgba(255, 217, 138, 0.55) 0%, rgba(246, 196, 83, 0.22) 42%, transparent 72%)",
            willChange: "transform, opacity",
          }}
          animate={{
            opacity: hoverBoost
              ? [...LENS_BREATH_OPACITY].map((o) => Math.min(1, o * 1.12))
              : [...LENS_BREATH_OPACITY],
            scale: hoverBoost
              ? [...LENS_BREATH_SCALE].map((s) => s * 1.05)
              : [...LENS_BREATH_SCALE],
          }}
          transition={{
            duration: BEAM_PULSE_S,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </div>
  );
}

function PlaceholderBody() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-[8%] bottom-[6%] top-[14%] rounded-sm bg-ink-800 shadow-inner">
        <div className="absolute inset-x-[6%] top-[8%] h-[3%] rounded-sm bg-ink-700/80" />
        <div className="absolute inset-x-[6%] top-[18%] h-[52%] rounded-sm bg-ink-700" />
        <div className="absolute bottom-[18%] right-[4%] h-[22%] w-[34%] rounded-sm bg-ink-900" />
        <div className="absolute bottom-[8%] left-[6%] right-[6%] h-[10%] rounded-sm bg-ink-900" />
      </div>
      <p className="type-label absolute bottom-1 left-0 right-0 text-center text-[0.5rem] tracking-label text-parchment/25">
        body PNG
      </p>
    </div>
  );
}

function PlaceholderReel({ variant }: { variant: "feed" | "takeup" }) {
  const isFeed = variant === "feed";
  return (
    <div
      className={`relative h-full w-full rounded-full border-2 ${
        isFeed
          ? "border-beam-deep/70 bg-gradient-to-br from-ink-700 to-ink-900"
          : "border-beam/50 bg-gradient-to-br from-ink-800 to-ink-950"
      }`}
    >
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-900 ${
          isFeed ? "h-[28%] w-[28%]" : "h-[22%] w-[22%]"
        }`}
      />
      {[0, 45, 90, 135].map((deg) => (
        <span
          key={deg}
          className="absolute left-1/2 top-1/2 h-[88%] w-px origin-bottom -translate-x-1/2 bg-beam-deep/35"
          style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}
        />
      ))}
    </div>
  );
}
