"use client";

import { usePathname } from "next/navigation";
import { FilmGrainOverlay } from "@/components/FilmGrainOverlay";
import { Navbar } from "@/components/Navbar";
import { EditorialNav } from "@/components/editorial/EditorialNav";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { FrameGrid } from "@/components/editorial/FrameGrid";
import { SectionRail } from "@/components/editorial/SectionRail";
import { SmoothScroll } from "@/components/editorial/SmoothScroll";
import { Cursor } from "@/components/editorial/Cursor";
import { PageTransition } from "@/components/editorial/PageTransition";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  // The poster wall is a full-screen canvas: no page chrome below or beside it.
  const isWall = pathname === "/library/wall";

  // Admin keeps the original utilitarian chrome.
  if (isAdmin) {
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  }

  return (
    <div className="editorial">
      <SmoothScroll />
      <FilmGrainOverlay opacity={0.018} />
      <FrameGrid />
      {!isWall && <SectionRail />}
      <EditorialNav />
      {children}
      {!isWall && <EditorialFooter />}
      <PageTransition />
      <Cursor />
    </div>
  );
}
