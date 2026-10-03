"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { COMMITTEE_PHOTOS } from "@/lib/committeePhotos";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Horizontal travel (px) that counts as a swipe on the photo. */
const SWIPE_PX = 50;

/**
 * Coordinating Committee by tenure. Holds still on the current tenure (first entry);
 * visitors switch years via the tabs, the arrows, or by swiping the photo.
 * Each change racks focus like the hero.
 */
export function CrewReel() {
  const reduce = useReducedMotion();
  const photos = COMMITTEE_PHOTOS;
  const [index, setIndex] = useState(0);
  const swipeStart = useRef<number | null>(null);

  const go = (next: number) => setIndex(Math.max(0, Math.min(photos.length - 1, next)));

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    swipeStart.current = e.clientX;
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (dx <= -SWIPE_PX) go(index + 1);
    else if (dx >= SWIPE_PX) go(index - 1);
  };

  const current = photos[index];
  if (!current) return null;

  return (
    <section
      id="coordinators"
      data-rail="The coordinators"
      className="relative bg-stage px-5 py-28 md:px-24 md:py-40"
    >
      <div className="mb-12 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h2 className="headline text-[clamp(2.75rem,6.5vw,6.5rem)] text-bone">
            The people
            <br />
            <span className="italic text-bone/60">behind the camera.</span>
          </h2>
        </div>

        {/* Tenure tabs */}
        <div
          role="tablist"
          aria-label="Coordinators by tenure"
          className="flex flex-wrap gap-x-6 gap-y-3"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(index + 1);
            if (e.key === "ArrowLeft") go(index - 1);
          }}
        >
          {photos.map((p, i) => {
            const on = i === index;
            return (
              <button
                key={p.year}
                role="tab"
                aria-selected={on}
                aria-controls="crew-panel"
                onClick={() => setIndex(i)}
                className={`kicker relative pb-2 transition-colors ${on ? "text-bone" : "text-bone/55 hover:text-bone/75"}`}
              >
                {p.year.replace("-", " – ")}
                <span className="absolute inset-x-0 bottom-0 h-px bg-bone/15" />
                {on && <span className="absolute inset-x-0 bottom-0 h-px bg-beam" />}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="crew-panel"
        role="tabpanel"
        aria-label={`Coordinators ${current.year}`}
        data-cursor="Swipe"
        className="relative aspect-[4/3] cursor-grab touch-pan-y select-none overflow-hidden border border-hairline bg-stage-900 active:cursor-grabbing md:aspect-[21/9]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
        onDragStart={(e) => e.preventDefault()}
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={current.imageUrl}
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.06, filter: "blur(18px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            // Outgoing photo holds underneath until the incoming one has racked into focus.
            exit={{ opacity: 0, transition: { delay: 1.2, duration: 0.3 } }}
            transition={{ duration: 1.3, ease: EASE }}
          >
            <Image
              src={current.imageUrl}
              alt={current.alt}
              fill
              sizes="(max-width: 768px) 100vw, 85vw"
              priority={index === 0}
              draggable={false}
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stage/80 via-transparent to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-8">
          <p className="kicker text-bone/80">
            {index === 0 ? "Current coordinators" : "Coordinators"}
            <span className="mt-1 block font-serif text-3xl normal-case tracking-normal text-bone md:text-5xl">
              {current.year.replace("-", " – ")}
            </span>
          </p>
          <div className="flex items-center gap-3">
            <p className="kicker mr-1 tabular-nums text-bone/60">
              {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
            </p>
            {[
              { label: "Newer tenure", dir: -1, glyph: "←" },
              { label: "Older tenure", dir: 1, glyph: "→" },
            ].map((b) => {
              const disabled = b.dir < 0 ? index === 0 : index === photos.length - 1;
              return (
                <button
                  key={b.label}
                  type="button"
                  aria-label={b.label}
                  disabled={disabled}
                  data-magnetic
                  // Don't let the arrow press start a swipe on the photo underneath.
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => go(index + b.dir)}
                  className="kicker flex h-10 w-10 items-center justify-center border border-bone/30 bg-stage/40 text-bone backdrop-blur-sm transition-colors hover:border-beam hover:bg-beam hover:text-stage disabled:pointer-events-none disabled:opacity-30"
                >
                  {b.glyph}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
