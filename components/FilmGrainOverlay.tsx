"use client";

import { useEffect, useRef } from "react";

type FilmGrainOverlayProps = {
  /** Overall opacity of the grain layer. Spec calls for ~3-4%. */
  opacity?: number;
  /** Frames per second for the grain re-roll. Lower is cheaper + more "film". */
  fps?: number;
};

/**
 * A looping, animated film-grain texture rendered on a lightweight canvas.
 * Sits fixed over the whole viewport, ignores pointer events, and freezes
 * itself when the user prefers reduced motion.
 */
export function FilmGrainOverlay({
  opacity = 0.035,
  fps = 24,
}: FilmGrainOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const TILE = 140;
    const tile = document.createElement("canvas");
    tile.width = TILE;
    tile.height = TILE;
    const tileCtx = tile.getContext("2d");

    let raf = 0;
    let last = 0;
    const interval = 1000 / fps;

    const drawGrain = () => {
      if (!tileCtx) return;
      const image = tileCtx.createImageData(TILE, TILE);
      const buf = image.data;
      for (let i = 0; i < buf.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        buf[i] = v;
        buf[i + 1] = (v * 0.96) | 0;
        buf[i + 2] = (v * 0.86) | 0;
        buf[i + 3] = v;
      }
      tileCtx.putImageData(image, 0, 0);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const pattern = ctx.createPattern(tile, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth);
      canvas.height = Math.floor(window.innerHeight);
      drawGrain();
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < interval) return;
      last = t;
      drawGrain();
    };

    resize();
    window.addEventListener("resize", resize);

    if (!prefersReduced) {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [fps]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full mix-blend-overlay"
      style={{ opacity }}
    />
  );
}
