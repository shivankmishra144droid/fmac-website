/**
 * Fixed hairline frame — two vertical rules in the gutters and a rule under the nav,
 * with ✦ registration marks where they cross. Purely decorative.
 */
export function FrameGrid() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 hidden md:block">
      <div className="absolute inset-y-0 left-12 w-px bg-hairline" />
      <div className="absolute inset-y-0 right-12 w-px bg-hairline" />
      <div className="absolute inset-x-0 top-16 h-px bg-hairline" />
      <Mark className="left-12 top-16" />
      <Mark className="right-12 top-16" />
      <Mark className="bottom-6 left-12" />
      <Mark className="bottom-6 right-12" />
    </div>
  );
}

function Mark({ className }: { className: string }) {
  return (
    <span
      className={`absolute text-[10px] leading-none text-bone/55 ${className}`}
      style={{
        transform: `translate(${className.includes("right-") ? "50%" : "-50%"}, ${
          className.includes("bottom-") ? "50%" : "-50%"
        })`,
      }}
    >
      ✦
    </span>
  );
}
