import manifest from "./media-manifest.json";

/** Self-hosted loops cut by `npm run media:clips` (see media/clips.config.json). */
export type HeroClip = { mp4: string; webm: string; poster: string };

const heroes = manifest.hero as Record<string, HeroClip | undefined>;
const previews = manifest.previews as Record<string, string | undefined>;

export function heroClipFor(youtubeId: string | null | undefined): HeroClip | null {
  return (youtubeId && heroes[youtubeId]) || null;
}

export function previewClipFor(youtubeId: string | null | undefined): string | null {
  return (youtubeId && previews[youtubeId]) || null;
}
