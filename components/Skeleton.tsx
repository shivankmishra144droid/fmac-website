/** Cinematic skeleton loaders — warm amber pulse, not generic spinners. */

export function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gradient-to-r from-ink-800 via-ink-700/80 to-ink-800 ${className}`}
      aria-hidden
    />
  );
}

export function MovieGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-white/5 bg-ink-800/40"
        >
          <SkeletonBar className="aspect-[2/3] w-full rounded-none" />
          <div className="space-y-2 p-3">
            <SkeletonBar className="h-2 w-12" />
            <SkeletonBar className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-6 px-6">
      <SkeletonBar className="h-3 w-40" />
      <SkeletonBar className="h-24 w-full max-w-2xl" />
      <SkeletonBar className="h-4 w-64" />
      <div className="flex gap-4">
        <SkeletonBar className="h-11 w-32 rounded-full" />
        <SkeletonBar className="h-11 w-32 rounded-full" />
      </div>
    </div>
  );
}
