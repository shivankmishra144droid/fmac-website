"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { INSTAGRAM_URL, YOUTUBE_URL } from "@/components/SocialNavIcons";

const LINKS = [
  { href: "/library", label: "Films" },
  { href: "/library/watchlist", label: "Watchlist" },
  { href: "/achievements", label: "Laurels" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function EditorialNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  // Hide on scroll down, reveal on scroll up — keeps the frame clean while reading.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 240 && y > prev && !open);
  });

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // "/library" shouldn't light up while on its own sub-page "/library/watchlist".
  const isActive = (href: string) =>
    href === "/library"
      ? pathname.startsWith("/library") && !pathname.startsWith("/library/watchlist")
      : pathname.startsWith(href);

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.5, ease: EASE }}
        className={`fixed inset-x-0 top-0 z-50 h-16 transition-colors duration-500 ${
          scrolled && !open ? "bg-stage/70 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="flex h-full items-center justify-between px-5 md:px-16">
          <Link href="/" className="group flex items-baseline gap-3" aria-label="FMAC home">
            <span className="font-serif text-2xl leading-none text-bone">FMAC</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`kicker link-underline pb-0.5 transition-colors ${
                  isActive(l.href) ? "text-bone" : "text-bone/55 hover:text-bone"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/library"
              className="kicker group inline-flex items-center gap-2 border border-bone/25 px-3.5 py-2 text-bone transition-colors hover:border-beam hover:bg-beam hover:text-stage"
            >
              Watch
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="kicker relative flex h-9 items-center gap-2 text-bone md:hidden"
          >
            <span>{open ? "Close" : "Menu"}</span>
            <span className="relative block h-2 w-5">
              <span
                className={`absolute left-0 h-px w-5 bg-current transition-transform duration-300 ${
                  open ? "top-1 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 h-px w-5 bg-current transition-transform duration-300 ${
                  open ? "top-1 -rotate-45" : "top-2"
                }`}
              />
            </span>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: EASE }}
            // Sits under the header (z-50) so the logo and Close stay on top.
            className="fixed inset-0 z-[45] flex flex-col justify-between bg-stage px-5 pb-10 pt-28 md:hidden"
          >
            <ul className="space-y-2">
              {[{ href: "/", label: "Home" }, ...LINKS].map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: EASE }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 py-1"
                  >
                    <span className="kicker text-bone/35">{String(i + 1).padStart(2, "0")}</span>
                    <span className="headline text-6xl text-bone">{l.label}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="flex gap-6">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="kicker text-bone/60">
                Instagram ↗
              </a>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="kicker text-bone/60">
                YouTube ↗
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
