import type { Movie } from "@prisma/client";

/** URL-safe slug from a film title. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Unique slug; appends a short suffix when the base is taken. */
export function uniqueSlug(title: string, taken: Set<string>): string {
  const base = slugify(title) || "film";
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  const slug = `${base}-${n}`;
  taken.add(slug);
  return slug;
}

export function movieHref(movie: Pick<Movie, "slug" | "id">): string {
  return `/library/${movie.slug ?? movie.id}`;
}
