type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

/** Consistent cinematic header for interior pages (clears the fixed navbar). */
export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="relative px-6 pb-10 pt-32 sm:pt-40">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.42em] text-parchment/50">
          {eyebrow}
        </p>
        <h1 className="font-display text-5xl font-black leading-[0.9] tracking-tightest text-parchment sm:text-7xl">
          {title}
        </h1>
        {description && (
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-parchment/60">
            {description}
          </p>
        )}
      </div>
    </header>
  );
}
