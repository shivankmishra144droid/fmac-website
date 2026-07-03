import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Awards and festival selections for FMAC films.",
};

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  let achievements: Awaited<ReturnType<typeof prisma.achievement.findMany>> = [];
  try {
    achievements = await prisma.achievement.findMany({
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    });
  } catch {
    /* db unavailable */
  }

  return (
    <div className="min-h-screen bg-ink">
      <PageHeader
        eyebrow="Laurels"
        title="Achievements"
        description="Festival selections, nominations, and premieres from the Film Making Club."
      />
      <section className="mx-auto max-w-3xl space-y-4 px-6 pb-28">
        {achievements.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center font-mono text-sm text-parchment/50">
            Achievements will appear here after seeding the database.
          </p>
        ) : (
          achievements.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-white/10 bg-ink-800/60 p-6 transition-colors hover:border-marquee/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-marquee">
                    {a.year}
                    {a.laurel && ` · ${a.laurel}`}
                  </p>
                  <h2 className="mt-2 font-display text-2xl uppercase tracking-tight text-parchment">
                    {a.title}
                  </h2>
                  {a.movieTitle && (
                    <p className="mt-1 font-mono text-xs text-parchment/55">
                      Film: {a.movieTitle}
                    </p>
                  )}
                </div>
                <span className="rounded-full border border-marquee/40 bg-marquee/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-marquee">
                  FMAC Select
                </span>
              </div>
              {a.description && (
                <p className="mt-4 font-mono text-sm leading-relaxed text-parchment/65">
                  {a.description}
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
