import type { Metadata } from "next";
import { LibraryTopBar, MobileBottomNav } from "@/components/library/LibraryChrome";

export const metadata: Metadata = {
  title: "Library",
  description: "Browse films from the Film Making Club, BITS Goa.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink font-body text-white">
      <LibraryTopBar />
      {children}
      <MobileBottomNav />
    </div>
  );
}
