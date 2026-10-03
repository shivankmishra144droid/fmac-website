import { FocusHero } from "@/components/home/FocusHero";
import { ManifestoPinned } from "@/components/home/ManifestoPinned";
import { Laurels } from "@/components/home/Laurels";
import { CrewReel } from "@/components/home/CrewReel";
import { Filmstrip } from "@/components/Filmstrip";
import { getLatestMovie, listFilmstripMovies } from "@/lib/movies";
import { movieHref } from "@/lib/slug";
import { firstSentence } from "@/lib/synopsis";
import { formatRuntime, movieCardThumbnail, youtubeFrame } from "@/lib/youtube";
import { filmMedia, withMedia } from "@/lib/film-media";
import { heroClipFor, previewClipFor } from "@/lib/media";
import { getWallFilms } from "@/lib/wall";
import { WallPrefetch } from "@/components/home/WallPrefetch";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [latest, stripMovies, wallFilms] = await Promise.all([
    getLatestMovie(),
    listFilmstripMovies(),
    // Also warms the wall's server-side data (same caches) so /library/wall renders instantly.
    getWallFilms(),
  ]);
  const [stripWithMedia, heroMedia] = await Promise.all([
    withMedia(stripMovies),
    latest ? filmMedia(latest) : Promise.resolve(undefined),
  ]);

  const filmstrip = stripWithMedia.flatMap((m) => {
    const thumbnailUrl = m.media?.thumb ?? movieCardThumbnail(m);
    if (!thumbnailUrl) return [];
    return [
      {
        id: m.id,
        title: m.title,
        year: m.releaseYear,
        href: movieHref(m),
        thumbnailUrl,
        blurDataURL: m.media?.blur,
        youtubeId: m.youtubeId,
        previewClip: previewClipFor(m.youtubeId),
      },
    ];
  });

  return (
    <>
      {latest && (
        <FocusHero
          film={{
            title: latest.title,
            tagline:
              latest.tagline ?? (latest.synopsis ? firstSentence(latest.synopsis) : null),
            year: latest.releaseYear,
            runtime: formatRuntime(latest.runtimeSeconds),
            href: movieHref(latest),
            youtubeId: latest.youtubeId,
            // A real frame from the film reads better under the headline than the title-card thumbnail.
            image: latest.youtubeId ? youtubeFrame(latest.youtubeId, 1) : latest.posterUrl,
            letterboxed: Boolean(latest.youtubeId),
            fallbackImage: heroMedia?.thumb ?? movieCardThumbnail(latest),
            blurDataURL: heroMedia?.blur,
            clip: heroClipFor(latest.youtubeId),
          }}
        />
      )}
      <Filmstrip films={filmstrip} />
      <Laurels />
      <CrewReel />
      {/* Closing statement — hands off straight into the "Lights. Camera. FMAC." credits. */}
      <ManifestoPinned />
      {/* Background-load the poster wall (route + posters) once this page is idle. */}
      <WallPrefetch thumbs={wallFilms.map((f) => f.thumb)} />
    </>
  );
}
