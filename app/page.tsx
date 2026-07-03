import { Hero } from "@/components/Hero";
import { AwardsShowcase } from "@/components/AwardsShowcase";
import { Manifesto } from "@/components/Manifesto";
import { CommitteeSlider } from "@/components/CommitteeSlider";
import { getLatestMovie } from "@/lib/movies";
import { movieHref } from "@/lib/slug";
import { firstSentence } from "@/lib/synopsis";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latest = await getLatestMovie();

  return (
    <>
      <Hero
        movie={
          latest
            ? {
                title: latest.title,
                tagline:
                  latest.tagline ??
                  (latest.synopsis ? firstSentence(latest.synopsis) : null),
                releaseYear: latest.releaseYear,
                runtimeSeconds: latest.runtimeSeconds,
                format: latest.format,
                crew: latest.crew,
                posterUrl: latest.posterUrl,
                youtubeId: latest.youtubeId,
                watchHref: movieHref(latest),
                infoHref: movieHref(latest),
              }
            : undefined
        }
      />
      <AwardsShowcase />
      <Manifesto />
      <CommitteeSlider />
    </>
  );
}
