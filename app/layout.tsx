import type { Metadata } from "next";
import { SiteChrome } from "@/components/SiteChrome";
import { display, mono, body } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FMAC — Film Making Club, BITS Goa",
    template: "%s · FMAC",
  },
  description:
    "Film Making Club, BITS Pilani K.K. Birla Goa Campus. A collective of actors, writers, editors and dreamers turning the everyday into the cinematic.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink font-body text-parchment antialiased">
        <SiteChrome>
          <main>{children}</main>
        </SiteChrome>
      </body>
    </html>
  );
}
