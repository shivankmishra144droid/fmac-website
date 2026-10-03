import type { Metadata } from "next";
import { WatchlistPage } from "@/components/library/WatchlistPage";
import { listMovies } from "@/lib/movies";
import { withMedia } from "@/lib/film-media";

export const metadata: Metadata = {
  title: "Watchlist",
};

export const dynamic = "force-dynamic";

export default async function WatchlistRoute() {
  const movies = await withMedia(await listMovies());
  return <WatchlistPage movies={movies} />;
}
