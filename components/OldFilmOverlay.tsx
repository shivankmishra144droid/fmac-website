"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const GRAIN_TILE = 140;
const GRAIN_FPS = 22;

type Artifact =
  | {
      id: number;
      kind: "scratch";
      left: number;
      top: number;
      height: number;
      duration: number;
    }
  | {
      id: number;
      kind: "dust";
      left: number;
      top: number;
      size: number;
      tone: "light" | "dark";
      duration: number;
    };

type LightLeak = {
  id: number;
  edge: "left" | "right" | "top";
  duration: number;
};

export type OldFilmOverlayProps = {
  className?: string;
  enabled?: boolean;
  /** Animated grain strength (~0.04–0.06). */
  grainOpacity?: number;
  /** Warm sepia wash over the frame. */
  sepiaOpacity?: number;
  /** Photo layer — jitters with irregular gate instability. */
  children?: ReactNode;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Aged projected-film texture: grain, scratches, dust, sepia wash,
 * irregular gate jitter, and rare light leaks.
 */
export function OldFilmOverlay({
  className = "",
  enabled = true,
  grainOpacity = 0.048,
  sepiaOpacity = 0.075,
  children,
}: OldFilmOverlayProps) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [lightLeak, setLightLeak] = useState<LightLeak | null>(null);
  const [jitterY, setJitterY] = useState(0);
  const nextId = useRef(0);

  const removeArtifact = (id: number) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
  };

  /* Scratches — sparse, ~every 4–8s */
  useEffect(() => {
    if (!enabled || reduceMotion) return;

    let timeout = 0;

    const spawnScratch = () => {
      const id = nextId.current++;
      const duration = rand(0.15, 0.25);

      setArtifacts((prev) =>
        [
          ...prev,
          {
            id,
            kind: "scratch" as const,
            left: 4 + Math.random() * 92,
            top: 4 + Math.random() * 78,
            height: 14 + Math.random() * 42,
            duration,
          },
        ].slice(-12)
      );

      timeout = window.setTimeout(spawnScratch, rand(4000, 8000));
    };

    timeout = window.setTimeout(spawnScratch, rand(1200, 3200));
    return () => window.clearTimeout(timeout);
  }, [enabled, reduceMotion]);

  /* Dust — occasional specks */
  useEffect(() => {
    if (!enabled || reduceMotion) return;

    let timeout = 0;

    const spawnDust = () => {
      const id = nextId.current++;
      const duration = rand(0.12, 0.28);

      setArtifacts((prev) =>
        [
          ...prev,
          {
            id,
            kind: "dust" as const,
            left: 3 + Math.random() * 94,
            top: 6 + Math.random() * 88,
            size: 0.8 + Math.random() * 2.4,
            tone: Math.random() < 0.45 ? ("light" as const) : ("dark" as const),
            duration,
          },
        ].slice(-12)
      );

      timeout = window.setTimeout(spawnDust, rand(1800, 4500));
    };

    timeout = window.setTimeout(spawnDust, rand(800, 2000));
    return () => window.clearTimeout(timeout);
  }, [enabled, reduceMotion]);

  /* Irregular vertical gate jitter — not rhythmic */
  useEffect(() => {
    if (!enabled || reduceMotion) return;

    let timeout = 0;
    let resetTimeout = 0;

    const schedule = () => {
      timeout = window.setTimeout(() => {
        const px = (Math.random() < 0.5 ? -1 : 1) * rand(1, 2);
        setJitterY(px);
        resetTimeout = window.setTimeout(() => setJitterY(0), rand(35, 90));
        schedule();
      }, rand(3500, 11000));
    };

    schedule();
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(resetTimeout);
    };
  }, [enabled, reduceMotion]);

  /* Rare warm light leak */
  useEffect(() => {
    if (!enabled || reduceMotion) return;

    let timeout = 0;

    const spawn = () => {
      const id = nextId.current++;
      const duration = rand(0.4, 0.6);
      const edges: LightLeak["edge"][] = ["left", "right", "top"];
      setLightLeak({
        id,
        edge: edges[Math.floor(Math.random() * edges.length)]!,
        duration,
      });
      timeout = window.setTimeout(spawn, rand(15000, 20000));
    };

    timeout = window.setTimeout(spawn, rand(6000, 12000));
    return () => window.clearTimeout(timeout);
  }, [enabled, reduceMotion]);

  /* Animated grain canvas */
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

    if (!reduceMotion) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [enabled, reduceMotion]);

  if (!enabled) return children ? <>{children}</> : null;

  const leakGradient = (edge: LightLeak["edge"]) => {
    switch (edge) {
      case "left":
        return "linear-gradient(to right, rgba(255,200,100,0.22) 0%, rgba(246,196,83,0.08) 35%, transparent 70%)";
      case "right":
        return "linear-gradient(to left, rgba(255,200,100,0.2) 0%, rgba(246,196,83,0.07) 35%, transparent 70%)";
      case "top":
        return "linear-gradient(to bottom, rgba(255,200,100,0.18) 0%, rgba(246,196,83,0.06) 40%, transparent 75%)";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 h-full w-full overflow-hidden ${className}`}
    >
      <motion.div
        className="relative z-[1] h-full w-full min-h-0"
        animate={{ y: reduceMotion ? 0 : jitterY }}
        transition={{ duration: 0.04, ease: "linear" }}
      >
        {children}
      </motion.div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] mix-blend-soft-light"
        style={{ backgroundColor: "#c8922f", opacity: sepiaOpacity }}
      />

      {reduceMotion ? (
        <StaticFilmGrain className="z-[3]" opacity={grainOpacity * 0.92} />
      ) : (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[3] h-full w-full mix-blend-overlay"
          style={{ opacity: grainOpacity }}
        />
      )}

      {!reduceMotion &&
        artifacts.map((artifact) =>
          artifact.kind === "scratch" ? (
            <motion.div
              key={artifact.id}
              aria-hidden
              className="pointer-events-none absolute z-[4] w-px bg-parchment/22"
              style={{
                left: `${artifact.left}%`,
                top: `${artifact.top}%`,
                height: `${artifact.height}%`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.32, 0.18, 0] }}
              transition={{ duration: artifact.duration, ease: "easeInOut" }}
              onAnimationComplete={() => removeArtifact(artifact.id)}
            />
          ) : (
            <motion.span
              key={artifact.id}
              aria-hidden
              className="pointer-events-none absolute z-[4] rounded-full"
              style={{
                left: `${artifact.left}%`,
                top: `${artifact.top}%`,
                width: artifact.size,
                height: artifact.size,
                backgroundColor:
                  artifact.tone === "light"
                    ? "rgba(239,230,211,0.5)"
                    : "rgba(11,9,6,0.4)",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.45, 0.28, 0], scale: [0.5, 1, 1, 0.7] }}
              transition={{ duration: artifact.duration, ease: "easeOut" }}
              onAnimationComplete={() => removeArtifact(artifact.id)}
            />
          )
        )}

      {!reduceMotion && lightLeak && (
        <motion.div
          key={lightLeak.id}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{ background: leakGradient(lightLeak.edge) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0.35, 0] }}
          transition={{ duration: lightLeak.duration, ease: "easeInOut" }}
          onAnimationComplete={() => setLightLeak(null)}
        />
      )}
    </div>
  );
}

function StaticFilmGrain({
  opacity,
  className = "",
}: {
  opacity: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 mix-blend-overlay ${className}`}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }}
    />
  );
}
