"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

interface LenisContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, offset?: number) => void;
  stop: () => void;
  start: () => void;
}

const LenisContext = createContext<LenisContextType>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useLenis = () => useContext(LenisContext);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const reducedMotion = useReducedMotionSafe();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  const scrollTo = (
    target: string | number | HTMLElement,
    offset = -80
  ) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset, duration: 1.2 });
    } else {
      if (typeof target === "number") {
        window.scrollTo({ top: target, behavior: "smooth" });
      } else if (typeof target === "string") {
        const el = document.querySelector(target);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY + offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      } else if (target instanceof HTMLElement) {
        const top = target.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  const stop = () => {
    lenisRef.current?.stop();
  };

  const start = () => {
    lenisRef.current?.start();
  };

  return (
    <LenisContext.Provider
      value={{
        lenis: lenisRef.current,
        scrollTo,
        stop,
        start,
      }}
    >
      {children}
    </LenisContext.Provider>
  );
}

