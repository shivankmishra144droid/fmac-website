"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProjectorBeam } from "@/components/ProjectorBeam";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Invalid email or password");
        setLoading(false);
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6">
      <ProjectorBeam intensity={0.5} particleCount={8} className="opacity-60" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl uppercase tracking-tightest text-parchment">
            FMAC
          </Link>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.4em] text-marquee/80">
            Projection Booth
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-ink-800/80 p-7 backdrop-blur-sm"
        >
          <h1 className="font-display text-xl uppercase tracking-tight text-parchment">
            Admin sign in
          </h1>
          <label className="mt-6 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2.5 font-mono text-sm text-parchment focus:border-marquee/60"
            />
          </label>
          <label className="mt-4 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/60">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2.5 font-mono text-sm text-parchment focus:border-marquee/60"
            />
          </label>
          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 font-mono text-xs text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-marquee py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink-900 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
