/** Default asset paths — swap in real PNGs under /public/images/projector/ */
export const PROJECTOR_IMAGE_PATHS = {
  body: "/images/projector/projector-body.png",
  feedReel: "/images/projector/feed-reel.png",
  takeUpReel: "/images/projector/take-up-reel.png",
} as const;

export const PROJECTOR_SOUND_PATHS = {
  winding: { mp3: "/sounds/reel-winding.mp3", ogg: "/sounds/reel-winding.ogg" },
  catch: { mp3: "/sounds/reel-catch.mp3", ogg: "/sounds/reel-catch.ogg" },
} as const;

/** Percentage-based placement — tweak when real photo assets land */
export type ReelSlot = {
  top: string;
  left: string;
  width: string;
  height: string;
};

export const PROJECTOR_REEL_SLOTS = {
  feed: { top: "19%", left: "11%", width: "21%", height: "21%" },
  takeUp: { top: "7.5%", left: "37%", width: "37%", height: "37%" },
} as const satisfies Record<string, ReelSlot>;

export const PROJECTOR_LENS_GLOW = {
  top: "41%",
  left: "71%",
  width: "26%",
  height: "18%",
} as const;
