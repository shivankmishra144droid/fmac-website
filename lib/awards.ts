export type Award = {
  id: string;
  festival: string;
  award: string;
  film: string;
  description: string;
  year: string;
  /** Ambient full-bleed backdrop — can differ from evidence photos */
  backgroundUrl: string;
  /** Evidence photos for the framed slot — first is hero; 2+ shows thumbnail strip */
  images: string[];
};

/** Hero image in the evidence frame */
export function primaryAwardImage(award: Award): string {
  return award.images[0] ?? award.backgroundUrl;
}

/**
 * Homepage awards — most recent first.
 * Add entries to `images[]` when event / team photos are available.
 */
export const AWARDS: Award[] = [
  {
    id: "frames-2025",
    festival: "FRAMES SHORT FILM FESTIVAL",
    award: "BEST SCREENPLAY",
    film: "GOONS AND GULAABS",
    description:
      "We are so excited to announce that FMaC won the Best Screenplay award for our film Goons and Gulaabs at the FRAMES Short Film Festival!",
    year: "2025",
    backgroundUrl: "https://img.youtube.com/vi/ijtJJjmK7SQ/maxresdefault.jpg",
    images: ["https://img.youtube.com/vi/ijtJJjmK7SQ/maxresdefault.jpg"],
  },
  {
    id: "ifp-fish-molee-2024",
    festival: "IFP 50 HOUR WRITING CHALLENGE — SEASON 15",
    award: "SILVER SHORT SCRIPT OF THE YEAR",
    film: "FISH MOLEE",
    description:
      "We at FMaC BITS Goa are thrilled to share that our script, Fish Molee, won the Silver Short Script of the Year Award — the result of 50 hours of intense brainstorming, writing, rewriting, and pushing through deadlines together.",
    year: "2024",
    backgroundUrl: "/awards/fish-molee.jpg",
    images: ["/awards/fish-molee.jpg"],
  },
  {
    id: "jiff-rakshasa-2024",
    festival: "JAIPUR INTERNATIONAL FILM FESTIVAL (JIFF) 2024",
    award: "WINNER",
    film: "RAKSHASA",
    description:
      "Rakshasa — FMAC's horror short — travelled to JIFF 2024 and took home the top prize, proof that student crews can compete on a national festival stage.",
    year: "2024",
    backgroundUrl: "https://img.youtube.com/vi/hg3YkJYvOy0/maxresdefault.jpg",
    images: ["https://img.youtube.com/vi/hg3YkJYvOy0/maxresdefault.jpg"],
  },
];
