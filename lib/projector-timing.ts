/** Shared projector / beam / flicker timing — keep all rigs in sync */

export const BEAM_PULSE_S = 3.2;

/** Fast film-gate flicker — lens + projected image */
export const FILM_FLICKER_S = 0.13;

/** Feed reel spins marginally faster (film unspooling) */
export const FEED_REEL_S = 7.4;
export const TAKEUP_REEL_S = 9.6;

export const JUDDER_CYCLE_S = 0.13;
/** Body judder lags photo — light hits screen after mechanism moves */
export const JUDDER_BODY_DELAY_S = 0.016;

/** Film strip dash travel — paced to reel speeds */
export const FILM_PATH_S = 2.15;

export const BEAM_BREATH_OPACITY = [0.72, 0.95, 0.78, 0.92, 0.72] as const;
export const BEAM_BREATH_SCALE = [1, 1.01, 0.995, 1.008, 1] as const;

export const LENS_BREATH_OPACITY = [0.42, 0.82, 0.48, 0.76, 0.42] as const;
export const LENS_BREATH_SCALE = [1, 1.14, 0.96, 1.1, 1] as const;

/** Micro flicker layered on lens + photo (same keyframes) */
export const FILM_FLICKER_OPACITY = [1, 0.86, 1, 0.9, 0.94, 1] as const;

export const PROJECTOR_JUDDER_KEYFRAMES = {
  x: [0, 1.2, -1, 0.6, -0.6, 0],
  y: [0, -0.8, 1, -0.4, 0.4, 0],
};

export const PROJECTOR_JUDDER_PHOTO = {
  animate: PROJECTOR_JUDDER_KEYFRAMES,
  transition: {
    duration: JUDDER_CYCLE_S,
    repeat: Infinity,
    ease: "linear" as const,
  },
};

export const PROJECTOR_JUDDER_BODY = {
  animate: PROJECTOR_JUDDER_KEYFRAMES,
  transition: {
    duration: JUDDER_CYCLE_S,
    repeat: Infinity,
    ease: "linear" as const,
    delay: JUDDER_BODY_DELAY_S,
  },
};

/** @deprecated use PROJECTOR_JUDDER_PHOTO */
export const PROJECTOR_JUDDER = PROJECTOR_JUDDER_PHOTO;
