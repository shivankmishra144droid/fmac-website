import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getLocationInfo } from "@/lib/location";

export const metadata: Metadata = {
  title: "Location",
  description: "Where the Film Making Club, BITS Goa screens and meets.",
};

export const dynamic = "force-dynamic";

export default async function LocationMapPage() {
  const loc = await getLocationInfo();

  return (
    <div className="min-h-screen bg-ink">
      <PageHeader
        eyebrow="Find Us"
        title="Location"
        description="Screenings, workshops and club meets. Here's where to find the projector running."
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-28 lg:grid-cols-[1fr_minmax(0,380px)]">
        {/* Map embed */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-ink-800">
          <div className="aspect-[16/10] w-full">
            <iframe
              title={`Map to ${loc.name}`}
              src={loc.mapEmbedUrl}
              className="h-full w-full grayscale-[0.35] contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          {/* Subtle warm frame so the map sits inside the theatre aesthetic. */}
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-marquee/10" />
        </div>

        {/* Venue info */}
        <aside className="flex flex-col gap-6">
          <div className="rounded-xl border border-white/10 bg-ink-800/60 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-marquee/80">
              The Venue
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-parchment">
              {loc.name}
            </h2>
            <p className="mt-4 font-mono text-sm leading-relaxed text-parchment/70">
              {loc.address}
            </p>
          </div>

          {loc.description && (
            <div className="rounded-xl border border-white/10 bg-ink-800/60 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-marquee/80">
                Good to Know
              </p>
              <p className="mt-3 font-mono text-sm leading-relaxed text-parchment/70">
                {loc.description}
              </p>
            </div>
          )}

          <a
            href={loc.mapEmbedUrl.replace("&output=embed", "").replace("?output=embed", "")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-parchment/25 px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-parchment/90 transition-all hover:border-marquee/70 hover:text-marquee hover:shadow-[0_0_22px_rgba(234,179,8,0.28)] focus-visible:border-marquee/70 focus-visible:text-marquee"
          >
            Open in Maps ↗
          </a>
        </aside>
      </section>
    </div>
  );
}
