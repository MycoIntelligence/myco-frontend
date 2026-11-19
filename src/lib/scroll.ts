"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenisInstance: Lenis | null = null;

export function initSmoothScroll(): Lenis | null {
  if (typeof window === "undefined") return null;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return null;

  gsap.registerPlugin(ScrollTrigger);

  if (!lenisInstance) {
    lenisInstance = new Lenis({
      duration: 0.8,
      lerp: 0.14,
      wheelMultiplier: 1.05,
      touchMultiplier: 1.0,
      syncTouch: false,
      infinite: false,
    });

    lenisInstance.on("scroll", ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenisInstance?.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    // Allow normal lag smoothing to prevent stuttering and click delays
    gsap.ticker.lagSmoothing(500, 33);
  }

  return lenisInstance;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function scrollToTarget(target: string | number | HTMLElement, offset = 0) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { offset, duration: 0.8 });
  } else if (typeof window !== "undefined") {
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "smooth" });
    } else if (typeof target === "string") {
      const el = document.querySelector(target);
      el?.scrollIntoView({ behavior: "smooth" });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }
}
