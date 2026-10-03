import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { AWARDS } from "@/lib/awards";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Awards and festival selections for FMAC films.",
};

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  year: string;
  title: string;
  laurel: string | null;
  movieTitle: string | null;
  description: string | null;
};

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

/** Homepage laurels double as the fallback list when the DB is empty or unreachable. */
const FALLBACK: Row[] = AWARDS.map((a) => ({
  id: a.id,
  year: a.year,
  title: titleCase(a.award),
  laurel: titleCase(a.festival),
  movieTitle: titleCase(a.film),
  description: a.description,
}));

export default async function AchievementsPage() {
  let rows: Row[] = [];
  try {
    const found = await prisma.achievement.findMany({
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    });
    rows = found.map((a) => ({
      id: a.id,
      year: String(a.year),
      title: a.title,
      laurel: a.laurel,
      movieTitle: a.movieTitle,
      description: a.description,
    }));
  } catch {
    /* db unavailable */
  }
  if (rows.length === 0) rows = FALLBACK;

  return (
    <div className="min-h-screen bg-stage">
      <PageHeader
        title="Achievements"
        description="Festival selections, nominations, and premieres from the Film Making Club."
      />
      <section className="px-5 pb-32 md:px-24">
        <ol className="border-t border-hairline">
          {rows.map((a, i) => (
            <li
              key={a.id}
              className="grid gap-4 border-b border-hairline py-10 md:grid-cols-[5rem_1fr_1fr] md:gap-10 md:py-14"
            >
              <p className="kicker text-bone/40">
                {String(i + 1).padStart(2, "0")}
                <span className="mt-1 block text-bone/60">{a.year}</span>
              </p>
              <div>
                {a.movieTitle && (
                  <h2 className="headline text-[clamp(2.25rem,4.5vw,4.25rem)] text-bone">{a.movieTitle}</h2>
                )}
                <p className="kicker mt-4 text-beam">{a.title}</p>
                {a.laurel && <p className="kicker mt-1 text-bone/45">{a.laurel}</p>}
              </div>
              {a.description && (
                <p className="max-w-lg self-end text-base leading-relaxed text-bone/65">{a.description}</p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
