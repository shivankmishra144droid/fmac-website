import "server-only";
import { listMovies } from "./movies";
import { withMedia } from "./film-media";
import { movieHref } from "./slug";
import { groupMoviesByTenure } from "./tenure";
import type { WallFilm } from "@/components/library/PosterWall";

/**
 * Films on the poster wall: the library's tenures from 2022–23 onward (founding-years and
 * undated films stay off). Built on the cached catalogue + media, so the home page warming it
 * and the wall page itself share the same work.
 */
export async function getWallFilms(): Promise<WallFilm[]> {
  const tenureFilms = groupMoviesByTenure((await listMovies()).filter((m) => m.youtubeId))
    .filter((g) => g.startYear >= 2022)
    .flatMap((g) => g.films);
  const movies = await withMedia(tenureFilms);
  return movies.flatMap((m) =>
    m.media
      ? [{ id: m.id, title: m.title, year: m.releaseYear, href: movieHref(m), thumb: m.media.thumb, blur: m.media.blur }]
      : []
  );
}
