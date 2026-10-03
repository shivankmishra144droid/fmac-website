"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { INSTAGRAM_URL, YOUTUBE_URL } from "@/components/SocialNavIcons";
import { scrollToTarget } from "./SmoothScroll";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV = [
  { href: "/library", label: "The library" },
  { href: "/achievements", label: "Laurels" },
];

export function EditorialFooter() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Observe the heading, not the words: each word starts clipped below its mask and would never count as "in view".
  const inView = useInView(titleRef, { once: true, amount: 0.25 });
  const reduce = useReducedMotion();
  const shown = inView || reduce;

  return (
    <footer className="relative overflow-hidden border-t border-hairline bg-stage">
      {/* Soft projector glow behind the title. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[42rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(246,196,83,0.10),transparent)]"
      />

      <div className="relative px-5 pb-8 pt-28 md:px-24 md:pt-40">
        <p className="kicker mb-10 text-bone/55">
          <span className="mr-2 text-beam">✦</span>End credits
        </p>

        <h2 ref={titleRef} className="headline text-[clamp(3.75rem,14vw,14rem)] leading-[0.9] text-bone">
          {[
            { word: "Lights.", cls: "" },
            { word: "Camera.", cls: "md:pl-[12vw]" },
            { word: "FMAC.", cls: "italic text-beam md:pl-[24vw]" },
          ].map(({ word, cls }, i) => (
            <span key={word} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className={`block ${cls}`}
                initial={reduce ? false : { y: "105%" }}
                animate={shown ? { y: "0%" } : undefined}
                transition={{ duration: 1.2, ease: EASE, delay: i * 0.12 }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h2>

        <div className="mt-20 grid gap-10 border-t border-hairline pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="kicker mb-4 text-bone/55">The club</p>
            <p className="max-w-xs text-sm leading-relaxed text-bone/70">
              Film Making Club, BITS Pilani K.K. Birla Goa Campus.
            </p>
          </div>
          <div>
            <p className="kicker mb-4 text-bone/55">Navigate</p>
            <ul className="space-y-2">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline text-sm text-bone/80 hover:text-bone">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="kicker mb-4 text-bone/55">Follow the reel</p>
            <ul className="space-y-2">
              <li>
                <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="link-underline text-sm text-bone/80 hover:text-bone">
                  YouTube ↗
                </a>
              </li>
              <li>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="link-underline text-sm text-bone/80 hover:text-bone">
                  Instagram ↗
                </a>
              </li>
            </ul>
          </div>
          <div className="lg:text-right">
            <p className="kicker mb-4 text-bone/55">Reel change</p>
            <button
              type="button"
              onClick={() => scrollToTarget(0)}
              data-magnetic
              className="kicker inline-flex items-center gap-2 border border-bone/25 px-3.5 py-2 text-bone transition-colors hover:border-beam hover:bg-beam hover:text-stage"
            >
              Back to the top ↑
            </button>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 text-bone/55 sm:flex-row sm:items-center sm:justify-between">
          <p className="kicker">© {new Date().getFullYear()} FMAC</p>
          <Link href="/admin/login" className="kicker text-bone/55 transition-colors hover:text-bone/50">
            Team login
          </Link>
        </div>
      </div>
    </footer>
  );
}
