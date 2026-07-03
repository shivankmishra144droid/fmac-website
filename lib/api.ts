import type { Movie, MovieCategory } from "@prisma/client";

export type MovieDTO = Movie;
export type AchievementDTO = {
  id: string;
  title: string;
  year: number;
  description: string | null;
  laurel: string | null;
  movieTitle: string | null;
  sortOrder: number;
};

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchMovies(category?: MovieCategory) {
  const q = category ? `?category=${category}` : "";
  const data = await apiFetch<{ movies: MovieDTO[] }>(`/api/movies${q}`);
  return data.movies;
}

export async function fetchLatestMovie() {
  const data = await apiFetch<{ movie: MovieDTO | null }>("/api/movies/latest");
  return data.movie;
}

export async function fetchMovie(id: string) {
  const data = await apiFetch<{ movie: MovieDTO }>(`/api/movies/${id}`);
  return data.movie;
}

export async function fetchAchievements() {
  const data = await apiFetch<{ achievements: AchievementDTO[] }>("/api/achievements");
  return data.achievements;
}
