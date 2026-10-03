"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Movie } from "@prisma/client";
import { FilmCard } from "./FilmCard";

const WATCHLIST_KEY = "fmac-watchlist";
const CHANGE_EVENT = "fmac-watchlist-change";

export function getWatchlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setWatchlistIds(ids: string[]) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
  } catch {
    /* storage blocked — watchlist just won't persist */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function toggleWatchlistId(id: string): string[] {
  const current = getWatchlistIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  setWatchlistIds(next);
  return next;
}

const TYPES = [
  { key: "ALL", label: "Everything" },
  { key: "SHORT", label: "Shorts" },
  { key: "MOVIE", label: "Features" },
  { key: "DOCUMENTARY", label: "Documentaries" },
  { key: "EXPERIMENTAL", label: "Experimental" },
] as const;

export function WatchlistPage({ movies }: { movies: Movie[] }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [type, setType] = useState<(typeof TYPES)[number]["key"]>("ALL");

  // Stay in sync when a card's Save toggle changes the list on this page.
  useEffect(() => {
    const sync = () => setIds(getWatchlistIds());
    sync();
    setReady(true);
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const watchlist = useMemo(() => movies.filter((m) => ids.includes(m.id)), [movies, ids]);
  const shown = useMemo(
    () => (type === "ALL" ? watchlist : watchlist.filter((m) => m.category === type)),
    [watchlist, type]
  );
  const presentTypes = TYPES.filter((t) => t.key === "ALL" || watchlist.some((m) => m.category === t.key));

  return (
    <div className="pb-32">
      <header className="px-5 pb-12 pt-36 md:px-24 md:pb-16 md:pt-48">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="headline text-[clamp(3.25rem,9vw,9rem)] text-bone">
              Your <span className="italic text-bone/60">watchlist.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-bone/60 md:text-lg">
              Films you&apos;ve saved for later. Kept on this device.
            </p>
          </div>
          {ready && watchlist.length > 0 && (
            <p className="kicker text-bone/40 md:text-right">
              <span className="block font-serif text-6xl normal-case tracking-normal text-bone">{watchlist.length}</span>
              Saved
            </p>
          )}
        </div>

        {presentTypes.length > 2 && (
          <nav aria-label="Filter" className="no-scrollbar mt-14 flex gap-8 overflow-x-auto border-b border-hairline">
            {presentTypes.map((t) => {
              const on = t.key === type;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  aria-pressed={on}
                  className={`kicker relative shrink-0 pb-4 transition-colors ${on ? "text-bone" : "text-bone/40 hover:text-bone/75"}`}
                >
                  {t.label}
                  {on && <span className="absolute inset-x-0 -bottom-px h-px bg-beam" />}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      <div className="px-5 md:px-24">
        {!ready ? null : watchlist.length === 0 ? (
          <div className="border-t border-hairline py-24">
            <p className="headline max-w-[20ch] text-[clamp(2rem,4vw,3.5rem)] text-bone/70">
              Nothing saved yet. Hover a film and hit <span className="italic text-beam">+ Save</span>.
            </p>
            <Link
              href="/library"
              className="kicker mt-10 inline-flex items-center gap-3 bg-bone px-5 py-3.5 text-stage transition-colors hover:bg-beam"
            >
              Browse the library →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((m) => (
              <FilmCard key={m.id} movie={m} fluid />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
