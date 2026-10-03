import {
  Bebas_Neue,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Instrument_Serif,
  Inter_Tight,
  JetBrains_Mono,
} from "next/font/google";

/** Ultra-condensed display — tenure headers, film titles, active category chips (library). */
export const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

/** Readable body copy — synopsis, descriptions, sentence-case UI (library + admin). */
export const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

/** Editorial/technical labels — metadata, eyebrows, inactive chips (library + admin). */
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

/* ── Editorial system (home + interior marketing pages) ─────────────────────── */

/** High-contrast editorial serif — headlines, pull quotes, the big footer line. */
export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

/** Tight grotesk — editorial body copy. */
export const grotesk = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-grotesk",
  display: "swap",
});

/** Small uppercase technical labels — section rail, captions, meta. */
export const label = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-label",
  display: "swap",
});

/** @deprecated Use `body` — kept so existing `font-sans` classes resolve to body. */
export const sans = body;
