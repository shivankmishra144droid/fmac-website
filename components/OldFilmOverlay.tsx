"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const GRAIN_TILE = 140;
const GRAIN_FPS = 20;

type Artifact =
  | {
      id: number;
      kind: "scratch";
      left: number;
      top: number;
      height: number;
    }
  | {
      id: number;
      kind: "dust";
      left: number;
      top: number;
      size: number;
      tone: "light" | "dark";
    };

export type OldFilmOverlayProps = {
  className?: string;
  enabled?: boolean;
  /** Animated grain strength (0-1). */
  grainOpacity?: number;
  /** Warm sepia wash over the frame (0-1). */
  sepiaOpacity?: number;
};

/**
 * Aged film-stock texture for projected footage: grain, sparse scratches,
 * dust specks, and a faint sepia wash. Separate from beam/vignette layers.
 */
export function OldFilmOverlay({
  className = "",
  enabled = true,
  grainOpacity = 0.038,
  sepiaOpacity = 0.07,
}: OldFilmOverlayProps) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (!enabled || reduceMotion) return;

    let timeout = 0;

    const spawn = () => {
      const id = nextId.current++;
      const isScratch = Math.random() < 0.55;

      setArtifacts((prev) => {
        const next = isScratch
          ? [
              ...prev,
              {
                id,
                kind: "scratch" as const,
                left: 8 + Math.random() * 84,
                top: 6 + Math.random() * 72,
                height: 18 + Math.random() * 38,
              },
            ]
          : [
              ...prev,
              {
                id,
                kind: "dust" as const,
                left: 5 + Math.random() * 90,
                top: 8 + Math.random() * 84,
                size: 1 + Math.random() * 2.2,
                tone: Math.random() < 0.45 ? "light" : "dark",
              },
            ];
        return next.slice(-10);
      });

      const delay = 4200 + Math.random() * 4800;
      timeout = window.setTimeout(spawn, delay);
    };

    timeout = window.setTimeout(spawn, 1800 + Math.random() * 2200);
    return () => window.clearTimeout(timeout);
  }, [enabled, reduceMotion]);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const tile = document.createElement("canvas");
    tile.width = GRAIN_TILE;
    tile.height = GRAIN_TILE;
    const tileCtx = tile.getContext("2d");
    if (!tileCtx) return;

    let raf = 0;
    let last = 0;
    const interval = 1000 / GRAIN_FPS;

    const drawGrain = () => {
      const image = tileCtx.createImageData(GRAIN_TILE, GRAIN_TILE);
      const buf = image.data;
      for (let i = 0; i < buf.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        buf[i] = v;
        buf[i + 1] = (v * 0.96) | 0;
        buf[i + 2] = (v * 0.86) | 0;
        buf[i + 3] = v;
      }
      tileCtx.putImageData(image, 0, 0);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pattern = ctx.createPattern(tile, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));
      drawGrain();
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (reduceMotion) return;
      if (t - last < interval) return;
      last = t;
      drawGrain();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    if (!reduceMotion) {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [enabled, reduceMotion]);

  if (!enabled) return null;

  const removeArtifact = (id: number) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          backgroundColor: "#c8922f",
          opacity: sepiaOpacity,
        }}
      />

      {reduceMotion ? (
        <StaticFilmGrain opacity={grainOpacity * 0.92} />
      ) : (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full mix-blend-overlay"
          style={{ opacity: grainOpacity }}
        />
      )}

      {!reduceMotion &&
        artifacts.map((artifact) =>
          artifact.kind === "scratch" ? (
            <motion.div
              key={artifact.id}
              className="absolute w-px bg-parchment/25"
              style={{
                left: `${artifact.left}%`,
                top: `${artifact.top}%`,
                height: `${artifact.height}%`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.34, 0.22, 0] }}
              transition={{ duration: 0.62, ease: "easeInOut" }}
              onAnimationComplete={() => removeArtifact(artifact.id)}
            />
          ) : (
            <motion.span
              key={artifact.id}
              className="absolute rounded-full"
              style={{
                left: `${artifact.left}%`,
                top: `${artifact.top}%`,
                width: artifact.size,
                height: artifact.size,
                backgroundColor:
                  artifact.tone === "light"
                    ? "rgba(239,230,211,0.55)"
                    : "rgba(11,9,6,0.45)",
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.5, 0.35, 0], scale: [0.6, 1, 1, 0.8] }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              onAnimationComplete={() => removeArtifact(artifact.id)}
            />
          )
        )}
    </div>
  );
}

function StaticFilmGrain({ opacity }: { opacity: number }) {
  return (
    <div
      className="absolute inset-0 mix-blend-overlay"
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }}
    />
  );
}
