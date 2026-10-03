/** Film page skeleton: full-bleed hero block + title bar, matching FilmDetail's layout. */
export default function Loading() {
  return (
    <div aria-busy className="bg-stage">
      <div className="flex min-h-[88svh] flex-col justify-end bg-bone/[0.02] px-5 pb-16 md:px-24 md:pb-20">
        <div className="h-4 w-40 animate-pulse bg-bone/[0.06]" />
        <div className="mt-6 h-[clamp(3rem,8.5vw,8.5rem)] w-3/4 max-w-4xl animate-pulse bg-bone/[0.06]" />
        <div className="mt-10 h-12 w-64 animate-pulse bg-bone/[0.06]" />
      </div>
    </div>
  );
}
