"use client";

import { useState } from "react";
import { UploadField, YoutubeField } from "./UploadField";
import type { MovieCategory } from "@prisma/client";

export type MovieFormValues = {
  id?: string;
  title: string;
  tagline: string;
  description: string;
  releaseYear: number;
  posterUrl: string;
  youtubeUrl: string;
  youtubeId: string;
  category: MovieCategory;
  runtimeSeconds: number | "";
  format: string;
  crew: string;
  isLatestRelease: boolean;
  isFmacSelect: boolean;
};

const EMPTY: MovieFormValues = {
  title: "",
  tagline: "",
  description: "",
  releaseYear: new Date().getFullYear(),
  posterUrl: "",
  youtubeUrl: "",
  youtubeId: "",
  category: "SHORT",
  runtimeSeconds: "",
  format: "Digital · YouTube",
  crew: "Film Making Club, BITS Goa",
  isLatestRelease: false,
  isFmacSelect: false,
};

export function MovieForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<MovieFormValues>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<MovieFormValues>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(values.id);

  function set<K extends keyof MovieFormValues>(key: K, val: MovieFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      title: values.title,
      tagline: values.tagline || null,
      description: values.description || null,
      releaseYear: Number(values.releaseYear),
      posterUrl: values.posterUrl || null,
      youtubeUrl: values.youtubeUrl || null,
      youtubeId: values.youtubeId || null,
      category: values.category,
      runtimeSeconds: values.runtimeSeconds ? Number(values.runtimeSeconds) : null,
      format: values.format || null,
      crew: values.crew || null,
      isLatestRelease: values.isLatestRelease,
      isFmacSelect: values.isFmacSelect,
    };

    try {
      const res = await fetch(isEdit ? `/api/movies/${values.id}` : "/api/movies", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  const inputCls =
    "mt-2 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2.5 font-mono text-sm text-parchment focus:border-marquee/60";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-ink-800/70 p-6">
      <h3 className="font-display text-lg uppercase tracking-tight text-parchment">
        {isEdit ? "Edit film" : "Add film"}
      </h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">
            Title *
          </span>
          <input required value={values.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
        </label>

        <YoutubeField
          value={values.youtubeUrl}
          onChange={(url, id, poster) => {
            set("youtubeUrl", url);
            if (id) set("youtubeId", id);
            if (poster && !values.posterUrl) set("posterUrl", poster);
          }}
        />

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">
            Year *
          </span>
          <input type="number" required value={values.releaseYear} onChange={(e) => set("releaseYear", Number(e.target.value))} className={inputCls} />
        </label>

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">
            Category
          </span>
          <select
            value={values.category}
            onChange={(e) => set("category", e.target.value as MovieCategory)}
            className={inputCls}
          >
            <option value="MOVIE">Movie</option>
            <option value="SHORT">Short</option>
            <option value="DOCUMENTARY">Documentary</option>
            <option value="EXPERIMENTAL">Experimental</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" checked={values.isLatestRelease} onChange={(e) => set("isLatestRelease", e.target.checked)} className="accent-marquee" />
          <span className="font-mono text-xs text-parchment/70">Latest release (hero)</span>
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" checked={values.isFmacSelect} onChange={(e) => set("isFmacSelect", e.target.checked)} className="accent-marquee" />
          <span className="font-mono text-xs text-parchment/70">FMAC Select badge</span>
        </label>

        <label className="block sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">Tagline</span>
          <input value={values.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
        </label>

        <label className="block sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">Description</span>
          <textarea rows={4} value={values.description} onChange={(e) => set("description", e.target.value)} className={inputCls} />
        </label>

        <label className="block sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">Poster URL</span>
          <input value={values.posterUrl} onChange={(e) => set("posterUrl", e.target.value)} className={inputCls} />
        </label>
        <div className="sm:col-span-2">
          <UploadField label="Or upload custom poster" onUploaded={(url) => set("posterUrl", url)} />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 font-mono text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-marquee px-7 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink-900 disabled:opacity-60">
          {saving ? "Saving…" : isEdit ? "Save" : "Create"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-white/15 px-7 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-parchment/70">
          Cancel
        </button>
      </div>
    </form>
  );
}
