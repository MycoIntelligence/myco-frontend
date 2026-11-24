"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

export function useReducedMotionSafe(): boolean {
  const motionReduced = useReducedMotion();
  const [mediaReduced, setMediaReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMediaReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMediaReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return Boolean(motionReduced || mediaReduced);
}

