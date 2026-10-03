"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { scrollToTarget } from "./SmoothScroll";

type RailItem = { id: string; label: string; el: HTMLElement };

/**
 * Left-gutter section index. Any element with `data-rail="Label"` and an id becomes a stop;
 * the active stop grows into a longer dash with its label.
 */
export function SectionRail() {
  const pathname = usePathname();
  const [items, setItems] = useState<RailItem[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rail][id]"));
    setItems(els.map((el) => ({ id: el.id, label: el.dataset.rail ?? "", el })));
    if (els.length === 0) return;

    // Active = the section crossing the viewport's vertical middle.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Sections"
      className="fixed left-0 top-1/2 z-40 hidden w-12 -translate-y-1/2 md:block"
    >
      <ol className="flex flex-col gap-3">
        {items.map((item, i) => {
          const on = item.id === active;
          return (
            <li key={item.id} className="relative h-3">
              <button
                type="button"
                onClick={() => scrollToTarget(item.el)}
                aria-label={`${String(i + 1).padStart(2, "0")} ${item.label}`}
                aria-current={on ? "true" : undefined}
                className="group absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-3"
              >
                <span
                  className={`block h-px transition-all duration-500 ease-out ${
                    on ? "w-6 bg-beam" : "w-3 bg-bone/30 group-hover:w-5 group-hover:bg-bone/60"
                  }`}
                />
                {/* Label only on hover/focus — always-on labels collide with page copy in the gutter. */}
                <span className="kicker -translate-x-1 whitespace-nowrap bg-stage/80 px-1.5 py-0.5 text-bone/70 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  <span className="mr-2 text-bone/40">{String(i + 1).padStart(2, "0")}</span>
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
