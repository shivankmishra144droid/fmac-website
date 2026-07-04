"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PROJECTOR_SOUND_PATHS = {
  winding: { mp3: "/sounds/reel-winding.mp3", ogg: "/sounds/reel-winding.ogg" },
  catch: { mp3: "/sounds/reel-catch.mp3", ogg: "/sounds/reel-catch.ogg" },
} as const;

const MUTE_KEY = "fmac-projector-sound-muted";
const AMBIENT_PLAYED_KEY = "fmac-projector-ambient-played";

const FADE_MS = 420;
const OBSERVER_THRESHOLD = 0.45;
const AMBIENT_VOLUME = 0.32;
const CATCH_VOLUME = 0.48;

function prefersReducedExperience(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(prefers-reduced-data: reduce)").matches
  );
}

function readStoredMuted(): boolean {
  if (typeof window === "undefined") return true;
  if (prefersReducedExperience()) return true;
  const stored = localStorage.getItem(MUTE_KEY);
  return stored === null ? true : stored === "true";
}

function pickAudioSrc(paths: { mp3: string; ogg: string }): string {
  const probe = document.createElement("audio");
  const oggOk = probe.canPlayType('audio/ogg; codecs="vorbis"');
  return oggOk ? paths.ogg : paths.mp3;
}

function fadeVolume(
  audio: HTMLAudioElement,
  target: number,
  onDone?: () => void
): () => void {
  const start = audio.volume;
  const t0 = performance.now();
  let raf = 0;

  const step = (now: number) => {
    const t = Math.min((now - t0) / FADE_MS, 1);
    audio.volume = start + (target - start) * t;
    if (t < 1) raf = requestAnimationFrame(step);
    else onDone?.();
  };

  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export type UseProjectorSoundResult = {
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  showEnablePrompt: boolean;
  dismissEnablePrompt: () => void;
  playReelCatch: () => void;
};

export function useProjectorSound(
  sectionRef: React.RefObject<HTMLElement | null>
): UseProjectorSoundResult {
  const [muted, setMutedState] = useState(true);
  const [showEnablePrompt, setShowEnablePrompt] = useState(false);
  const [interactionUnlocked, setInteractionUnlocked] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);

  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const catchRef = useRef<HTMLAudioElement | null>(null);
  const ambientPlayingRef = useRef(false);
  const cancelAmbientFadeRef = useRef<(() => void) | null>(null);
  const cancelCatchFadeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMutedState(readStoredMuted());
  }, []);

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value);
    localStorage.setItem(MUTE_KEY, String(value));
    if (value) setShowEnablePrompt(false);
  }, []);

  const toggleMuted = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, String(next));
      setShowEnablePrompt(false);
      return next;
    });
  }, []);

  const dismissEnablePrompt = useCallback(() => {
    setShowEnablePrompt(false);
  }, []);

  useEffect(() => {
    const unlock = () => setInteractionUnlocked(true);
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("scroll", unlock, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("scroll", unlock);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ambient = new Audio(pickAudioSrc(PROJECTOR_SOUND_PATHS.winding));
    ambient.loop = true;
    ambient.preload = "auto";
    ambient.volume = 0;

    const catchClip = new Audio(pickAudioSrc(PROJECTOR_SOUND_PATHS.catch));
    catchClip.loop = false;
    catchClip.preload = "auto";
    catchClip.volume = 0;

    ambientRef.current = ambient;
    catchRef.current = catchClip;

    return () => {
      cancelAmbientFadeRef.current?.();
      cancelCatchFadeRef.current?.();
      ambient.pause();
      catchClip.pause();
      ambientRef.current = null;
      catchRef.current = null;
    };
  }, []);

  const stopAmbient = useCallback(() => {
    const audio = ambientRef.current;
    if (!audio || !ambientPlayingRef.current) return;

    cancelAmbientFadeRef.current?.();
    cancelAmbientFadeRef.current = fadeVolume(audio, 0, () => {
      audio.pause();
      ambientPlayingRef.current = false;
    });
  }, []);

  const playAmbient = useCallback(async () => {
    const audio = ambientRef.current;
    if (!audio || muted || !interactionUnlocked) return;
    if (sessionStorage.getItem(AMBIENT_PLAYED_KEY)) return;

    try {
      audio.currentTime = 0;
      await audio.play();
      sessionStorage.setItem(AMBIENT_PLAYED_KEY, "1");
      ambientPlayingRef.current = true;
      cancelAmbientFadeRef.current?.();
      cancelAmbientFadeRef.current = fadeVolume(audio, AMBIENT_VOLUME);
    } catch {
      /* autoplay policy — fail silently */
    }
  }, [muted, interactionUnlocked]);

  useEffect(() => {
    if (muted) stopAmbient();
    else if (sectionVisible) void playAmbient();
  }, [muted, sectionVisible, playAmbient, stopAmbient]);

  const playReelCatch = useCallback(() => {
    if (muted || !interactionUnlocked) return;

    const audio = catchRef.current;
    if (!audio) return;

    void (async () => {
      try {
        audio.currentTime = 0;
        audio.volume = 0;
        await audio.play();
        cancelCatchFadeRef.current?.();
        cancelCatchFadeRef.current = fadeVolume(audio, CATCH_VOLUME);
      } catch {
        /* silent */
      }
    })();
  }, [muted, interactionUnlocked]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible =
          Boolean(entry?.isIntersecting) &&
          (entry?.intersectionRatio ?? 0) >= OBSERVER_THRESHOLD;
        setSectionVisible(visible);

        if (visible && muted && !sessionStorage.getItem(AMBIENT_PLAYED_KEY)) {
          setShowEnablePrompt(true);
        }
      },
      { threshold: [0, OBSERVER_THRESHOLD, 0.75, 1] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionRef, muted]);

  return {
    muted,
    setMuted,
    toggleMuted,
    showEnablePrompt,
    dismissEnablePrompt,
    playReelCatch,
  };
}
