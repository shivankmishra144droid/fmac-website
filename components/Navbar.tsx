"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialNavIcons } from "@/components/SocialNavIcons";

const LEFT = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Films" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-ink/60 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8">
        <nav className="hidden items-center gap-8 md:flex">
          {LEFT.map((l) => (
            <NavLink key={l.href} {...l} active={isActive(l.href)} />
          ))}
        </nav>

        <Link
          href="/"
          className="justify-self-center font-display text-base tracking-tightest text-parchment sm:text-lg"
        >
          FMAC
        </Link>

        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <SocialNavIcons />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center border border-white/10 text-parchment/70 transition-colors hover:border-marquee/40 hover:text-marquee md:hidden"
          >
            <span className="font-mono text-sm">{open ? "×" : "≡"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/[0.06] bg-ink/95 md:hidden"
          >
            <ul className="flex flex-col px-3 py-2">
              {LEFT.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-2.5 font-mono text-xs uppercase tracking-[0.18em] ${
                      isActive(l.href) ? "text-marquee" : "text-parchment/60"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
        active ? "text-parchment" : "text-parchment/45 hover:text-parchment/80"
      }`}
    >
      {label}
    </Link>
  );
}
