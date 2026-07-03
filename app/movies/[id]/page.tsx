import { redirect, notFound } from "next/navigation";
import { getMovie } from "@/lib/movies";
import { movieHref } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function MovieIdRedirect({
  params,
}: {
  params: { id: string };
}) {
  const movie = await getMovie(params.id);
  if (!movie) notFound();
  redirect(movieHref(movie));
}
