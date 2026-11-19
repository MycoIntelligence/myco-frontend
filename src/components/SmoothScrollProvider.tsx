"use client";

import React, { useEffect } from "react";
import { initSmoothScroll } from "@/src/lib/scroll";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = initSmoothScroll();
    return () => {
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}

