"use client";

import { useEffect, useState, type RefObject } from "react";

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
