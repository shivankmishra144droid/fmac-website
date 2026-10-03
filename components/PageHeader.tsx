type PageHeaderProps = {
  title: string;
  description?: string;
};

/** Editorial header for interior pages (clears the fixed navbar). */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="relative px-5 pb-16 pt-36 md:px-24 md:pb-24 md:pt-48">
      <h1 className="headline text-[clamp(3.25rem,9vw,9rem)] text-bone">{title}</h1>
      {description && (
        <p className="mt-8 max-w-xl text-base leading-relaxed text-bone/60 md:text-lg">
          {description}
        </p>
      )}
    </header>
  );
}
