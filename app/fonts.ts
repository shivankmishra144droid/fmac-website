import { Bebas_Neue, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

/** Ultra-condensed display — tenure headers, film titles, active category chips. */
export const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

/** Readable body copy — synopsis, descriptions, sentence-case UI. */
export const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

/** Editorial/technical labels — metadata, eyebrows, inactive chips. */
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

/** @deprecated Use `body` — kept so existing `font-sans` classes resolve to body. */
export const sans = body;
