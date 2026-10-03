import type { Metadata } from "next";
import { SiteChrome } from "@/components/SiteChrome";
import { INTRO_DECIDER, IntroOverlay } from "@/components/editorial/Intro";
import { display, mono, body, serif, grotesk, label } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FMAC · Film Making Club, BITS Goa",
    template: "%s · FMAC",
  },
  description:
    "Film Making Club, BITS Pilani K.K. Birla Goa Campus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [display, body, mono, serif, grotesk, label].map((f) => f.variable).join(" ");

  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        {/* Decides before first paint whether the intro plays (sets html[data-intro]). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_DECIDER }} />
      </head>
      <body className="min-h-screen bg-ink font-body text-parchment antialiased">
        <IntroOverlay />
        <SiteChrome>
          <main>{children}</main>
        </SiteChrome>
      </body>
    </html>
  );
}
