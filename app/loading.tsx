/** Instant loading state while a page streams in (also what route prefetch can show early). */
export default function Loading() {
  return (
    <div aria-busy className="min-h-[100svh] bg-stage px-5 pt-36 md:px-24 md:pt-48">
      <div className="h-[clamp(3rem,9vw,9rem)] w-2/3 max-w-3xl animate-pulse bg-bone/[0.05]" />
      <div className="mt-8 h-4 w-80 max-w-full animate-pulse bg-bone/[0.04]" />
      <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="aspect-video animate-pulse border border-hairline bg-bone/[0.03]" />
        ))}
      </div>
    </div>
  );
}
