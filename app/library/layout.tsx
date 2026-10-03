import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library",
  description: "Browse films from the Film Making Club, BITS Goa.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-stage">{children}</div>;
}
