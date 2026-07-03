"use client";

import { usePathname } from "next/navigation";
import { FilmGrainOverlay } from "@/components/FilmGrainOverlay";
import { Navbar } from "@/components/Navbar";
import { SocialNavIcons } from "@/components/SocialNavIcons";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLibrary = pathname.startsWith("/library");

  return (
    <>
      {!isLibrary && <FilmGrainOverlay opacity={0.022} />}
      {!isLibrary && <Navbar />}
      {children}
      {!isLibrary && (
        <footer className="relative z-10 border-t border-white/10 px-6 py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg uppercase tracking-tightest">FMAC</p>
              <p className="mt-1 font-mono text-xs text-parchment/50">
                Film Making Club · BITS Pilani K.K. Birla Goa Campus
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <SocialNavIcons />
              <a
                href="/admin/login"
                className="font-mono text-[9px] uppercase tracking-[0.22em] text-parchment/25 transition-colors hover:text-parchment/45"
              >
                Team login
              </a>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
