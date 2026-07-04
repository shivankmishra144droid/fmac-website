export type CommitteePhoto = {
  year: string;
  /** Short tab label, e.g. "26-27" */
  shortLabel: string;
  imageUrl: string;
  alt: string;
  /** Optional alpha-masked foreground for lenticular depth (stretch goal) */
  foregroundUrl?: string;
};

/**
 * Coordinating Committee group photos by tenure year.
 * Swap imageUrl paths when real photos are ready — structure supports
 * a future DB/CMS fetch without changing the slider component.
 */
export const COMMITTEE_PHOTOS: CommitteePhoto[] = [
  {
    year: "2026-2027",
    shortLabel: "26-27",
    imageUrl: "/committee/2026-2027.jpg",
    alt: "FMAC Coordinating Committee 2026–2027",
  },
  {
    year: "2025-2026",
    shortLabel: "25-26",
    imageUrl: "/committee/2025-2026.jpg",
    alt: "FMAC Coordinating Committee 2025–2026",
  },
  {
    year: "2024-2025",
    shortLabel: "24-25",
    imageUrl: "/committee/2024-2025.jpeg",
    alt: "FMAC Coordinating Committee 2024–2025",
  },
  {
    year: "2023-2024",
    shortLabel: "23-24",
    imageUrl: "/committee/2023-2024.png",
    alt: "FMAC Coordinating Committee 2023–2024",
  },
];
