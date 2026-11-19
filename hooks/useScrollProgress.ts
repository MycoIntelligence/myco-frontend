"use client";

import { useRef } from "react";
import { useScroll, MotionValue } from "motion/react";

export function useScrollProgress<T extends HTMLElement = HTMLDivElement>() {
  const targetRef = useRef<T>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  return { targetRef, progress: scrollYProgress };
}

