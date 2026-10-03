"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AWARDS, primaryAwardImage } from "@/lib/awards";

const EASE = [0.22, 1, 0.36, 1] as const;

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

/**
 * Laurels as an editorial index. Rows expand to the full citation; on desktop a sticky
 * "screen" beside the list shows the hovered (or open) film, so nothing ever covers the text.
 */
export function Laurels() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(AWARDS[0]?.id ?? null);
  const [hovered, setHovered] = useState<string | null>(null);

  const featured = AWARDS.find((a) => a.id === (hovered ?? open)) ?? AWARDS[0];

  return (
    <section
      id="laurels"
      data-rail="Laurels"
      className="relative bg-stage px-5 py-28 md:px-24 md:py-40"
    >
      <div className="mb-16 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h2 className="headline text-[clamp(2.75rem,6.5vw,6.5rem)] text-bone">
            Student crews,
            <br />
            <span className="italic text-bone/60">festival stages.</span>
          </h2>
        </div>
        <Link href="/achievements" className="kicker link-underline self-end pb-0.5 text-bone/60 hover:text-bone">
          All achievements →
        </Link>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,30rem)] lg:gap-16">
        <ul className="border-t border-hairline" onPointerLeave={() => setHovered(null)}>
          {AWARDS.map((a) => {
            const isOpen = open === a.id;
            return (
              <li key={a.id} className="border-b border-hairline">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : a.id)}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(a.id)}
                  onFocus={() => setHovered(a.id)}
                  aria-expanded={isOpen}
                  aria-controls={`laurel-${a.id}`}
                  data-cursor={isOpen ? "Close" : "Open"}
                  className="group grid w-full grid-cols-[3.5rem_1fr_auto] items-baseline gap-x-4 gap-y-3 py-7 text-left md:grid-cols-[4.5rem_1fr_auto] md:py-9"
                >
                  <span className="kicker text-bone/55">{a.year}</span>
                  <span
                    className={`headline text-[clamp(1.9rem,3.4vw,3.2rem)] transition-[color,transform] duration-500 ease-out group-hover:translate-x-2 ${
                      featured?.id === a.id ? "text-bone" : "text-bone/55"
                    }`}
                  >
                    {titleCase(a.film)}
                  </span>
                  <span
                    aria-hidden
                    className={`kicker text-lg text-bone/55 transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                  <span className="kicker col-start-2 col-end-4 text-bone/55">
                    <span className="text-beam">{titleCase(a.award)}</span>
                    <span className="mx-2 text-bone/55">/</span>
                    <span className="text-bone/55">{titleCase(a.festival)}</span>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`laurel-${a.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.55, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-6 pb-10 sm:pl-[4.5rem] md:pl-[5.5rem] lg:pr-10">
                        <p className="max-w-xl text-base leading-relaxed text-bone/70">{a.description}</p>
                        {/* Phones/tablets: the still sits inline (the side screen is desktop-only). */}
                        <div className="relative aspect-video overflow-hidden border border-hairline lg:hidden">
                          <Image src={primaryAwardImage(a)} alt={`${titleCase(a.film)} still`} fill sizes="90vw" className="object-cover" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        {/* Desktop "screen": sticky, crossfades to whichever laurel is hovered or open. */}
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <div className="relative aspect-[4/3] overflow-hidden border border-hairline bg-stage-900">
              <AnimatePresence initial={false}>
                {featured && (
                  <motion.div
                    key={featured.id}
                    className="absolute inset-0"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, transition: { delay: 0.5, duration: 0.3 } }}
                    transition={{ duration: 0.8, ease: EASE }}
                  >
                    <Image
                      src={primaryAwardImage(featured)}
                      alt={`${titleCase(featured.film)} still`}
                      fill
                      sizes="30rem"
                      className="object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Caption sits under the frame — award stills often have their own text baked in. */}
            {featured && (
              <div className="mt-5 flex items-baseline justify-between gap-6">
                <p className="headline text-3xl text-bone">{titleCase(featured.film)}</p>
                <p className="kicker shrink-0 text-bone/55">{featured.year}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
