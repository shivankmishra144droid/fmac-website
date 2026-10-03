/** Poster wall card width for a viewport width (shared by the wall and the home-page prefetcher). */
export function wallCardWidth(vw: number): number {
  return vw < 768 ? Math.round(vw * 0.44) : Math.round(Math.min(340, Math.max(220, vw * 0.19)));
}

/** The `sizes` value the wall gives each poster image (must match for preloads to hit the cache). */
export function wallImageSizes(vw: number): string {
  return `${wallCardWidth(vw)}px`;
}
