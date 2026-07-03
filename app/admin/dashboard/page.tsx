"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MovieForm, type MovieFormValues } from "@/components/admin/MovieForm";
import type { Movie } from "@prisma/client";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [editing, setEditing] = useState<
    { mode: "closed" } | { mode: "new" } | { mode: "edit"; movie: Movie }
  >({ mode: "closed" });
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);

  const loadMovies = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/movies", { cache: "no-store" });
    const data = await res.json().catch(() => ({ movies: [] }));
    setMovies(data.movies ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) router.push("/admin/login?from=/admin/dashboard");
        else setEmail(d.user?.email ?? null);
      });
    loadMovies();
  }, [loadMovies, router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/movies/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    loadMovies();
  }

  function toForm(m: Movie): Partial<MovieFormValues> {
    return {
      id: m.id,
      title: m.title,
      tagline: m.tagline ?? "",
      description: m.description ?? "",
      releaseYear: m.releaseYear,
      posterUrl: m.posterUrl ?? "",
      youtubeUrl: m.youtubeUrl ?? "",
      youtubeId: m.youtubeId ?? "",
      category: m.category,
      runtimeSeconds: m.runtimeSeconds ?? "",
      format: m.format ?? "",
      crew: m.crew ?? "",
      isLatestRelease: m.isLatestRelease,
      isFmacSelect: m.isFmacSelect,
    };
  }

  return (
    <div className="min-h-screen bg-ink px-6 pb-28 pt-28">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(234,179,8,0.1),transparent)]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-marquee">Admin</p>
            <h1 className="mt-2 font-display text-4xl uppercase tracking-tightest text-parchment">
              Dashboard
            </h1>
            {email && <p className="mt-1 font-mono text-xs text-parchment/50">{email}</p>}
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-full border border-white/15 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-parchment/70">
              Site
            </Link>
            <button type="button" onClick={logout} className="rounded-full border border-white/15 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-parchment/70 hover:text-red-300">
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-8">
          {editing.mode === "closed" ? (
            <button
              type="button"
              onClick={() => setEditing({ mode: "new" })}
              className="rounded-full bg-marquee px-7 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink-900"
            >
              + Add film
            </button>
          ) : (
            <MovieForm
              initial={editing.mode === "edit" ? toForm(editing.movie) : undefined}
              onSaved={() => {
                setEditing({ mode: "closed" });
                loadMovies();
              }}
              onCancel={() => setEditing({ mode: "closed" })}
            />
          )}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-ink-800/50">
          <div className="border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-parchment/50">
            Films ({movies.length})
          </div>
          {loading ? (
            <p className="p-6 font-mono text-sm text-parchment/40">Loading…</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {movies.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base uppercase text-parchment">{m.title}</p>
                    <p className="font-mono text-xs text-parchment/45">
                      {m.releaseYear} · {m.category}
                      {m.isLatestRelease ? " · latest" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setEditing({ mode: "edit", movie: m })} className="rounded-full border border-white/15 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-parchment/70 hover:border-marquee/50 hover:text-marquee">
                      Edit
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(m)} className="rounded-full border border-white/15 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-parchment/70 hover:border-red-400/50 hover:text-red-300">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-6">
            <h2 className="font-display text-xl uppercase text-parchment">Delete film?</h2>
            <p className="mt-2 font-mono text-sm text-parchment/60">
              Remove <strong className="text-parchment">{deleteTarget.title}</strong> from the site. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={confirmDelete} className="rounded-full bg-red-600 px-6 py-2 font-mono text-xs uppercase tracking-[0.15em] text-white">
                Delete
              </button>
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-white/15 px-6 py-2 font-mono text-xs uppercase tracking-[0.15em] text-parchment/70">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
