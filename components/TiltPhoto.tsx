"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

export type TiltPhotoProps = {
  src: string;
  alt: string;
  /** Optional cut-out foreground layer for true parallax depth */
  foregroundSrc?: string;
  priority?: boolean;
  /** Disable tilt/light-sweep (reduced motion or perf fallback) */
  disableTilt?: boolean;
  className?: string;
  sizes?: string;
};

const PHOTO_GRADE =
  "object-cover object-center brightness-[0.92] contrast-[1.06] saturate-[0.88] sepia-[0.12]";

/**
 * Lenticular-style tilt card: cursor-driven parallax, glossy light sweep,
 * optional foreground/background depth split, film grain, dynamic shadow.
 */
export function TiltPhoto({
  src,
  alt,
  foregroundSrc,
  priority,
  disableTilt = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 922px",
}: TiltPhotoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);
  const springX = useSpring(normX, { stiffness: 90, damping: 22, mass: 0.45 });
  const springY = useSpring(normY, { stiffness: 90, damping: 22, mass: 0.45 });

  const parallaxOn = !disableTilt;
  const cursorTiltOn = parallaxOn && !isTouch;

  useEffect(() => {
    setIsTouch(
      window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window
    );
  }, []);

  useEffect(() => {
    if (!cursorTiltOn) return;
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      normX.set((e.clientX - rect.left) / rect.width);
      normY.set((e.clientY - rect.top) / rect.height);
    };

    const onLeave = () => {
      normX.set(0.5);
      normY.set(0.5);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [cursorTiltOn, normX, normY]);

  useEffect(() => {
    if (!parallaxOn || !isTouch) return;

    let raf = 0;
    let usingGyro = false;

    const onOrient = (e: DeviceOrientationEvent) => {
      usingGyro = true;
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      normX.set(0.5 + Math.max(-0.45, Math.min(0.45, gamma / 50)));
      normY.set(0.5 + Math.max(-0.45, Math.min(0.45, (beta - 45) / 100)));
    };

    window.addEventListener("deviceorientation", onOrient);

    const start = performance.now();
    const ambient = (t: number) => {
      raf = requestAnimationFrame(ambient);
      if (usingGyro) return;
      const elapsed = (t - start) / 1000;
      normX.set(0.5 + Math.sin(elapsed * 0.35) * 0.12);
      normY.set(0.5 + Math.cos(elapsed * 0.28) * 0.09);
    };
    raf = requestAnimationFrame(ambient);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [parallaxOn, isTouch, normX, normY]);

  const shift = parallaxOn ? 1 : 0;

  const bgX = useTransform(springX, [0, 1], [4 * shift, -4 * shift]);
  const bgY = useTransform(springY, [0, 1], [3 * shift, -3 * shift]);
  const fgX = useTransform(springX, [0, 1], [-7 * shift, 7 * shift]);
  const fgY = useTransform(springY, [0, 1], [-5 * shift, 5 * shift]);
  const layerX = useTransform(springX, [0, 1], [-6 * shift, 6 * shift]);
  const layerY = useTransform(springY, [0, 1], [-4.5 * shift, 4.5 * shift]);

  const cardRotateY = useTransform(springX, [0, 1], cursorTiltOn ? [2.2, -2.2] : [0, 0]);
  const cardRotateX = useTransform(springY, [0, 1], cursorTiltOn ? [-1.8, 1.8] : [0, 0]);

  const highlightX = useTransform(springX, (v) => `${v * 100}%`);
  const highlightY = useTransform(springY, (v) => `${v * 100}%`);

  const glossRadial = useTransform(
    [highlightX, highlightY],
    ([hx, hy]) =>
      `radial-gradient(ellipse 55% 45% at ${hx} ${hy}, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 35%, transparent 68%)`
  );

  const glossStreak = useTransform(
    [highlightX, highlightY],
    ([hx, hy]) =>
      `linear-gradient(118deg, transparent 42%, rgba(255,255,255,0.14) 50%, transparent 58%)`
  );

  const glossPosition = useTransform(
    [highlightX, highlightY],
    ([hx, hy]) => `${hx} ${hy}`
  );

  const shadowX = useTransform(springX, [0, 1], [10 * shift, -10 * shift]);
  const shadowY = useTransform(springY, [0, 1], [8 * shift, -8 * shift]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      {parallaxOn && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-x-4 bottom-[-10%] z-0 h-[18%] rounded-[50%] bg-black/50 blur-2xl"
          style={{ x: shadowX, y: shadowY, willChange: "transform" }}
        />
      )}

      <div
        ref={containerRef}
        className="relative z-[1] h-full w-full overflow-hidden"
        style={{ perspective: cursorTiltOn ? 900 : undefined }}
      >
        <motion.div
          className="relative h-full w-full"
          style={{
            rotateX: cardRotateX,
            rotateY: cardRotateY,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <motion.div
            className="absolute inset-[-4%]"
            style={{
              x: foregroundSrc ? bgX : layerX,
              y: foregroundSrc ? bgY : layerY,
              willChange: "transform",
            }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              sizes={sizes}
              unoptimized
              className={PHOTO_GRADE}
              draggable={false}
            />
          </motion.div>

          {foregroundSrc && (
            <motion.div
              className="absolute inset-[-2%] z-[2]"
              style={{ x: fgX, y: fgY, willChange: "transform" }}
            >
              <Image
                src={foregroundSrc}
                alt=""
                fill
                sizes={sizes}
                unoptimized
                className="object-cover object-center"
                draggable={false}
                aria-hidden
              />
            </motion.div>
          )}

          {parallaxOn && (
            <>
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[3] mix-blend-soft-light"
                style={{ background: glossRadial }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[3] opacity-40 mix-blend-overlay"
                style={{
                  background: glossStreak,
                  backgroundPosition: glossPosition,
                  backgroundSize: "180% 180%",
                }}
              />
            </>
          )}

          <PhotoGrain animate={parallaxOn} />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[4] mix-blend-multiply"
            style={{
              background:
                "linear-gradient(145deg, rgba(58,42,20,0.28) 0%, transparent 45%, rgba(11,9,6,0.2) 100%)",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function PhotoGrain({ animate }: { animate: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const TILE = 96;
    const tile = document.createElement("canvas");
    tile.width = TILE;
    tile.height = TILE;
    const tileCtx = tile.getContext("2d");

    let raf = 0;
    let last = 0;
    const interval = 1000 / 20;

    const drawGrain = () => {
      if (!tileCtx) return;
      const image = tileCtx.createImageData(TILE, TILE);
      const buf = image.data;
      for (let i = 0; i < buf.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        buf[i] = v;
        buf[i + 1] = (v * 0.94) | 0;
        buf[i + 2] = (v * 0.86) | 0;
        buf[i + 3] = v;
      }
      tileCtx.putImageData(image, 0, 0);
      canvas.width = canvas.offsetWidth || 1;
      canvas.height = canvas.offsetHeight || 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pattern = ctx.createPattern(tile, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < interval) return;
      last = t;
      drawGrain();
    };

    drawGrain();
    if (animate) raf = requestAnimationFrame(loop);

    const onResize = () => drawGrain();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[3] h-full w-full mix-blend-overlay"
      style={{ opacity: 0.045 }}
    />
  );
}
