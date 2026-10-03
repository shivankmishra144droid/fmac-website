"use client";

import { useEffect, useState } from "react";

/** Total intro length is CSS-driven (see .fmac-intro in globals.css); the curtain starts lifting here. */
const LIFT_AT_MS = 950;

/**
 * Runs in <head> before first paint: decides whether this page view plays the intro.
 * Once per browser session, never on admin, never with reduced motion. Storage may be blocked.
 */
export const INTRO_DECIDER = `(function(){try{var d=document.documentElement;var skip=location.pathname.indexOf('/admin')===0||matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('fmac-intro');d.dataset.intro=skip?'skip':'play';if(!skip)sessionStorage.setItem('fmac-intro','1')}catch(e){document.documentElement.dataset.intro='skip'}})();`;

/** Server-rendered overlay so it paints with the HTML — no flash of the page underneath. */
export function IntroOverlay() {
  return (
    <div id="fmac-intro" className="fmac-intro" aria-hidden>
      <div className="fmac-intro__mark headline">FMAC</div>
      <div className="fmac-intro__meta kicker">
        <span>Film Making Club</span>
        <span className="fmac-intro__count" />
      </div>
      <div className="fmac-intro__bar" />
    </div>
  );
}

/** True once the intro has started lifting (immediately when no intro plays). */
export function useIntroDone() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (document.documentElement.dataset.intro !== "play") {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setDone(true), LIFT_AT_MS);
    return () => clearTimeout(t);
  }, []);
  return done;
}
