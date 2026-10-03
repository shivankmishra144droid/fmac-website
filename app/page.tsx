import { FocusHero } from "@/components/home/FocusHero";
import { ManifestoPinned } from "@/components/home/ManifestoPinned";
import { Laurels } from "@/components/home/Laurels";
import { CrewReel } from "@/components/home/CrewReel";
import { Filmstrip } from "@/components/Filmstrip";
import { getLatestMovie, listFilmstripMovies } from "@/lib/movies";
import { movieHref } from "@/lib/slug";
import { firstSentence } from "@/lib/synopsis";
import { formatRuntime, movieCardThumbnail, youtubeFrame } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [latest, stripMovies] = await Promise.all([getLatestMovie(), listFilmstripMovies()]);

  const filmstrip = stripMovies.flatMap((m) => {
    const thumbnailUrl = movieCardThumbnail(m);
    if (!thumbnailUrl) return [];
    return [
      {
        id: m.id,
        title: m.title,
        year: m.releaseYear,
        href: movieHref(m),
        thumbnailUrl,
        youtubeId: m.youtubeId,
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
            fallbackImage: movieCardThumbnail(latest),
          }}
        />
      )}
      <Filmstrip films={filmstrip} />
      <Laurels />
      <CrewReel />
      {/* Closing statement — hands off straight into the "Lights. Camera. FMAC." credits. */}
      <ManifestoPinned />
    </>
  );
}
