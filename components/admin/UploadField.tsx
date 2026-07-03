"use client";

import { useRef, useState } from "react";
import { extractYoutubeId, youtubeThumbnail } from "@/lib/youtube";

type UploadFieldProps = {
  label: string;
  onUploaded: (url: string) => void;
};

export function UploadField({ label, onUploaded }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  async function handleFile(file: File) {
    setStatus("uploading");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        return;
      }
      onUploaded(data.url);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">
        {label}
      </span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 rounded-lg border border-white/10 bg-ink-900 px-4 py-2 font-mono text-xs text-parchment/80 hover:border-marquee/50"
      >
        {status === "uploading" ? "Uploading…" : status === "done" ? "✓ Uploaded" : "Choose poster"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

export function YoutubeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string, id: string | null, poster: string | null) => void;
}) {
  function handleBlur() {
    const id = extractYoutubeId(value);
    if (id) {
      onChange(
        `https://www.youtube.com/watch?v=${id}`,
        id,
        youtubeThumbnail(id, "max")
      );
    }
  }

  return (
    <label className="block sm:col-span-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">
        YouTube URL
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value, null, null)}
        onBlur={handleBlur}
        placeholder="https://youtube.com/watch?v=…"
        className="mt-2 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2.5 font-mono text-sm text-parchment focus:border-marquee/60"
      />
      <p className="mt-1 font-mono text-[10px] text-parchment/40">
        Auto-extracts video ID and pulls the YouTube thumbnail.
      </p>
    </label>
  );
}
