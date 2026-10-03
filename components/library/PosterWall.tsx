"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { wallCardWidth, wallImageSizes } from "@/lib/wall-layout";

export type WallFilm = {
  id: string;
  title: string;
  year: number;
  href: string;
  thumb: string;
  blur?: string;
};

type Layout = {
  cols: number;
  rows: number;
  cardW: number;
  cardH: number;
  gap: number;
  tileW: number;
  tileH: number;
  colOffset: number[];
};

type Item = {
  key: string;
  film: WallFilm;
  x: number;
  y: number;
  /** 0.5–1: how strongly this card lags/leads on movement (depth). */
  depth: number;
  /** Intro stagger (s), by distance from the screen centre. */
  delay: number;
  /** Intro start offset: from screen centre to the card's resting spot. */
  fromX: number;
  fromY: number;
};

const CAPTION_H = 34;
const LERP = 0.085;
const DRAG_THRESHOLD = 6;

/** Deterministic 0–1 hash so depth/order are stable between server and client renders. */
function rand(n: number) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function computeLayout(vw: number, vh: number): Layout {
  const mobile = vw < 768;
  const cardW = wallCardWidth(vw);
  const gap = mobile ? 14 : 28;
  const cardH = Math.round((cardW * 9) / 16) + CAPTION_H;
  // The tile must exceed the viewport by a card each way, or wrapping would show seams.
  const cols = Math.max(mobile ? 4 : 6, Math.ceil((vw + cardW * 2) / (cardW + gap)));
  const rows = Math.max(4, Math.ceil((vh + cardH * 2) / (cardH + gap)) + 1);
  const colOffset = Array.from({ length: cols }, (_, c) => Math.round((c % 2) * cardH * 0.48 + rand(c + 1) * 24));
  return { cols, rows, cardW, cardH, gap, tileW: cols * (cardW + gap), tileH: rows * (cardH + gap), colOffset };
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Infinite, pan-anywhere wall of every film. Drag, scroll or use the arrow keys; cards wrap
 * around a tile larger than the viewport, ease toward the input with a little per-card depth,
 * and fly out from the centre on arrival.
 */
export function PosterWall({ films }: { films: WallFilm[] }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [entered, setEntered] = useState(false);
  /** New shuffle every visit (client-only: the wall never server-renders cards). */
  const [seed, setSeed] = useState<number | null>(null);
  useEffect(() => setSeed(Math.random() * 1000), []);
  /** Last time the user moved the wall; the idle drift waits for a pause. */
  const lastInput = useRef(0);

  const scroll = useRef({ x: 0, y: 0, tx: 0, ty: 0, lx: 0, ly: 0 });
  const mouse = useRef({ x: 0.5, y: 0.5, cx: 0.5, cy: 0.5 });
  const drag = useRef({ id: -1, sx: 0, sy: 0, ox: 0, oy: 0, lx: 0, ly: 0, lt: 0, vx: 0, vy: 0, active: false, moved: false });

  useEffect(() => {
    const measure = () => setLayout(computeLayout(window.innerWidth, window.innerHeight));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The wall is the page: freeze document scroll while it's mounted.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  const items = useMemo<Item[]>(() => {
    if (!layout || seed === null || films.length === 0) return [];
    const { cols, rows, cardW, cardH, gap, colOffset } = layout;
    // Shuffled per visit: every film appears once before any repeats.
    const order = films
      .map((f, i) => ({ f, k: rand(i * 1.618 + seed) }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.f);
    const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
    const vh = typeof window === "undefined" ? 900 : window.innerHeight;
    // Start slightly off-origin so the first view isn't pinned to a corner.
    const startX = -cardW * 0.6;
    const startY = -cardH * 0.4;
    const out: Item[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const film = order[i % order.length]!;
        const x = c * (cardW + gap);
        const y = r * (cardH + gap) + colOffset[c]!;
        const sx = x + startX;
        const sy = y + startY;
        const dx = vw / 2 - (sx + cardW / 2);
        const dy = vh / 2 - (sy + cardH / 2);
        const dist = Math.hypot(dx, dy);
        out.push({
          key: `${film.id}-${i}`,
          film,
          x,
          y,
          depth: 0.5 + rand(i + 3) * 0.5,
          delay: Math.min(0.9, dist / 1800),
          fromX: dx,
          fromY: dy,
        });
      }
    }
    scroll.current = { x: startX, y: startY, tx: startX, ty: startY, lx: startX, ly: startY };
    return out;
  }, [layout, films, seed]);

  // Kick off the fly-out once cards are positioned.
  useEffect(() => {
    if (!items.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setEntered(true);
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(t);
  }, [items.length]);

  // Render loop: ease scroll toward target, wrap every card, add depth drift.
  useEffect(() => {
    if (!layout || !items.length) return;
    const { tileW, tileH, cardW, cardH } = layout;
    let raf = 0;
    const tick = () => {
      const s = scroll.current;
      // Idle drift: after 2.5s without input the wall wanders slowly up-left.
      if (!drag.current.active && performance.now() - lastInput.current > 2500) {
        s.tx -= 0.22;
        s.ty -= 0.12;
      }
      s.x += (s.tx - s.x) * LERP;
      s.y += (s.ty - s.y) * LERP;
      const vx = s.x - s.lx;
      const vy = s.y - s.ly;
      s.lx = s.x;
      s.ly = s.y;
      const m = mouse.current;
      m.cx += (m.x - m.cx) * 0.06;
      m.cy += (m.y - m.cy) * 0.06;

      for (let i = 0; i < items.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const it = items[i]!;
        const lagX = Math.max(-80, Math.min(80, vx * 5 * it.depth)) + (m.cx - 0.5) * 30 * it.depth;
        const lagY = Math.max(-80, Math.min(80, vy * 5 * it.depth)) + (m.cy - 0.5) * 30 * it.depth;
        const px = mod(it.x + s.x + cardW, tileW) - cardW + lagX;
        const py = mod(it.y + s.y + cardH, tileH) - cardH + lagY;
        el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout, items]);

  // Wheel / trackpad pans the wall (non-passive so the page itself never scrolls).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastInput.current = performance.now();
      const k = e.deltaMode === 1 ? 32 : 1;
      scroll.current.tx -= e.deltaX * k * 0.9;
      scroll.current.ty -= e.deltaY * k * 0.9;
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const s = scroll.current;
    lastInput.current = performance.now();
    drag.current = {
      id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: s.tx, oy: s.ty,
      lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0, active: true, moved: false,
    };
    rootRef.current?.removeAttribute("data-dragged");
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = rootRef.current?.getBoundingClientRect();
    if (r && e.pointerType === "mouse") {
      mouse.current.x = (e.clientX - r.left) / r.width;
      mouse.current.y = (e.clientY - r.top) / r.height;
    }
    const d = drag.current;
    if (!d.active || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      rootRef.current?.setAttribute("data-grabbing", "1");
    }
    const now = performance.now();
    const dt = Math.max(1, now - d.lt);
    d.vx = d.vx * 0.6 + ((e.clientX - d.lx) / dt) * 0.4;
    d.vy = d.vy * 0.6 + ((e.clientY - d.ly) / dt) * 0.4;
    d.lx = e.clientX;
    d.ly = e.clientY;
    d.lt = now;
    lastInput.current = now;
    scroll.current.tx = d.ox + dx;
    scroll.current.ty = d.oy + dy;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.id) return;
    d.active = false;
    rootRef.current?.removeAttribute("data-grabbing");
    if (d.moved) {
      // Fling: carry release velocity (px/ms) forward ~300ms, then the lerp settles it.
      scroll.current.tx += d.vx * 300;
      scroll.current.ty += d.vy * 300;
      rootRef.current?.setAttribute("data-dragged", "1");
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (rootRef.current?.getAttribute("data-dragged") === "1") {
      e.preventDefault();
      e.stopPropagation();
      rootRef.current.removeAttribute("data-dragged");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 220;
    const s = scroll.current;
    if (e.key === "ArrowLeft") s.tx += step;
    else if (e.key === "ArrowRight") s.tx -= step;
    else if (e.key === "ArrowUp") s.ty += step;
    else if (e.key === "ArrowDown") s.ty -= step;
    else return;
    lastInput.current = performance.now();
    e.preventDefault();
  };

  return (
    <div
      ref={rootRef}
      data-cursor="Drag"
      data-lenis-prevent
      tabIndex={0}
      role="region"
      aria-label={`Poster wall: ${films.length} films. Drag, scroll or use the arrow keys to explore.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      onDragStart={(e) => e.preventDefault()}
      className="poster-wall fixed inset-0 z-0 cursor-grab touch-none select-none overflow-hidden bg-stage outline-none data-[grabbing]:cursor-grabbing"
    >
      {layout &&
        items.map((it, i) => (
          <div
            key={it.key}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="wall-item absolute left-0 top-0 will-change-transform"
            style={{ width: layout.cardW }}
          >
            {/* Inner wrapper owns the intro (outer transform is driven every frame). */}
            <div
              className="transition-[transform,opacity,filter] duration-[1400ms] ease-[cubic-bezier(0.87,0,0.13,1)]"
              style={{
                transitionDelay: `${it.delay}s`,
                transform: entered
                  ? "translate3d(0,0,0) scale(1) rotate(0deg)"
                  : `translate3d(${it.fromX}px, ${it.fromY}px, 0) scale(0.55) rotate(${(it.depth - 0.75) * 24}deg)`,
                opacity: entered ? 1 : 0,
                filter: entered ? "blur(0px)" : "blur(14px)",
              }}
            >
              <Link
                href={it.film.href}
                draggable={false}
                // Hover prefetches; skip Next's viewport prefetch (dozens of cards would each hit the server).
                prefetch={false}
                tabIndex={-1}
                data-cursor="Watch"
                data-transition-title={it.film.title}
                onPointerEnter={() => router.prefetch(it.film.href)}
                onPointerMove={tilt}
                onPointerLeave={untilt}
                className="wall-card group block"
              >
                <div className="wall-card__frame relative aspect-video overflow-hidden border border-hairline bg-stage-900">
                  <Image
                    src={it.film.thumb}
                    alt=""
                    fill
                    draggable={false}
                    sizes={wallImageSizes(window.innerWidth)}
                    placeholder={it.film.blur ? "blur" : "empty"}
                    blurDataURL={it.film.blur}
                    className="wall-card__img object-cover"
                  />
                  {/* Sheen that follows the pointer across the tilted card. */}
                  <span aria-hidden className="wall-card__sheen" />
                </div>
                <p className="wall-card__caption kicker mt-2.5 flex gap-2 text-bone/55">
                  <span className="truncate">{it.film.title}</span>
                  <span className="shrink-0 text-bone/55">· {it.film.year}</span>
                </p>
              </Link>
            </div>
          </div>
        ))}

      {/* Edge vignette keeps the frame calm and the nav legible. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(11,10,9,0.85)_100%)]"
      />
    </div>
  );
}

/** 3D tilt toward the pointer (writes CSS vars; no React state per frame). */
function tilt(e: React.PointerEvent<HTMLAnchorElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty("--rx", `${(-py * 10).toFixed(2)}deg`);
  el.style.setProperty("--ry", `${(px * 12).toFixed(2)}deg`);
  el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
  el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
}

function untilt(e: React.PointerEvent<HTMLAnchorElement>) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
}

/** Accessible list of every film (the wall itself is decorative for screen readers / keyboards). */
export function WallIndex({ films }: { films: WallFilm[] }) {
  return (
    <nav aria-label="All films" className="sr-only">
      <ul>
        {films.map((f) => (
          <li key={f.id}>
            <Link href={f.href}>
              {f.title} ({f.year})
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
