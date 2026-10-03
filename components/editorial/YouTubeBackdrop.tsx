"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** Muted, chromeless, looping YouTube embed URL for ambient backgrounds and previews. */
export function ambientEmbedUrl(id: string, start = 30): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    loop: "1",
    playlist: id,
    start: String(start),
    playsinline: "1",
    modestbranding: "1",
    rel: "0",
    disablekb: "1",
    iv_load_policy: "3",
    enablejsapi: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

/**
 * True once the embedded player reports it is actually playing (state 1).
 * Lets callers keep the poster up when autoplay is blocked instead of showing YouTube's play button.
 */
export function useYouTubePlaying(iframeRef: RefObject<HTMLIFrameElement>, active: boolean) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!active) {
      setPlaying(false);
      return;
    }

    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      let data: { event?: string; info?: unknown };
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const state =
        data.event === "onStateChange"
          ? data.info
          : data.event === "infoDelivery" && data.info && typeof data.info === "object"
            ? (data.info as { playerState?: number }).playerState
            : undefined;
      if (state === 1) setPlaying(true);
    };

    // Ask the player to start posting state; repeat briefly since it may not be listening yet.
    const ping = () =>
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
        "*"
      );
    window.addEventListener("message", onMessage);
    const interval = setInterval(ping, 400);
    const stop = setTimeout(() => clearInterval(interval), 8000);
    ping();

    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [active, iframeRef]);

  return playing;
}

/**
 * Full-cover ambient film loop. Only mounts the iframe on desktop-class pointers,
 * when not reduced-motion, and once the container is in view (after `delayMs`).
 * Fades in over whatever poster sits beneath it once playback has really started.
 */
export function YouTubeBackdrop({
  youtubeId,
  start = 30,
  delayMs = 1200,
  className = "",
}: {
  youtubeId: string;
  start?: number;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [inView, setInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const playing = useYouTubePlaying(iframeRef, mounted);

  useEffect(() => {
    const ok =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.innerWidth >= 768;
    setAllowed(ok);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !allowed) return;
    const io = new IntersectionObserver(([e]) => setInView(Boolean(e?.isIntersecting)), {
      rootMargin: "200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [allowed]);

  useEffect(() => {
    if (!inView) {
      setMounted(false);
      return;
    }
    const t = setTimeout(() => setMounted(true), delayMs);
    return () => clearTimeout(t);
  }, [inView, delayMs]);

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {mounted && (
        <iframe
          ref={iframeRef}
          src={ambientEmbedUrl(youtubeId, start)}
          title=""
          tabIndex={-1}
          allow="autoplay; encrypted-media"
          // Cover-fit a 16:9 frame, oversized a touch so YouTube's edges never show.
          className={`absolute left-1/2 top-1/2 h-[max(112%,63vw)] w-[max(112%,199vh)] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-[1600ms] ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
