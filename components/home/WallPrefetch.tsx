"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getImageProps } from "next/image";
import { wallImageSizes } from "@/lib/wall-layout";

/** Wait this long after the home page settles, so warming the wall never competes with it. */
const START_AFTER_MS = 1500;

type Conn = { saveData?: boolean; effectiveType?: string };

/**
 * Warms the poster wall in the background while someone is on the home page:
 * 1. prefetches the /library/wall route (its server render lands in the client router cache);
 * 2. preloads every poster at the exact srcset/sizes the wall will request, so they come from
 *    the browser cache on arrival.
 * Starts only after load + idle, one image at a time at low priority; skipped on Save-Data / 2G.
 */
export function WallPrefetch({ thumbs }: { thumbs: string[] }) {
  const router = useRouter();

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle: number | undefined;

    const preloadImages = async () => {
      const sizes = wallImageSizes(window.innerWidth);
      for (const src of thumbs) {
        if (cancelled) return;
        // Same props the wall's <Image fill sizes=…> uses → same /_next/image URLs.
        const { props } = getImageProps({ src, alt: "", fill: true, sizes });
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "low";
          img.sizes = props.sizes ?? sizes;
          if (props.srcSet) img.srcset = props.srcSet;
          img.onload = img.onerror = () => resolve();
          img.src = props.src;
        });
      }
    };

    const run = () => {
      if (cancelled) return;
      router.prefetch("/library/wall");
      void preloadImages();
    };

    const schedule = () => {
      timer = setTimeout(() => {
        const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
        if (ric) idle = ric(run);
        else run();
      }, START_AFTER_MS);
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (timer) clearTimeout(timer);
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (idle !== undefined && cic) cic(idle);
    };
  }, [router, thumbs]);

  return null;
}
