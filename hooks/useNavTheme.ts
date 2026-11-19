"use client";

import { useEffect, useState } from "react";

export type NavTheme = "dark" | "light";

interface NavThemeState {
  topTheme: NavTheme;
  bottomTheme: NavTheme;
  seamPx: number;
  interactiveTheme: NavTheme;
  isHeaderHidden: boolean;
}

export function useNavTheme(isMenuOrSheetOpen = false): NavThemeState {
  const [themeState, setThemeState] = useState<NavThemeState>({
    topTheme: "dark",
    bottomTheme: "dark",
    seamPx: 64,
    interactiveTheme: "dark",
    isHeaderHidden: false,
  });

  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let scrollStopTimeout: NodeJS.Timeout | null = null;
    let isHidden = false;

    const HEADER_HEIGHT = 64;

    const checkThemes = () => {
      const now = performance.now();
      const currentScrollY = window.scrollY;
      const dt = now - lastScrollTime;
      const dy = currentScrollY - lastScrollY;

      // Header hide on scroll down
      if (!isMenuOrSheetOpen) {
        if (currentScrollY > 160 && dt > 0) {
          const velocity = dy / dt; // px per ms
          if (velocity > 0.6) {
            isHidden = true;
          } else if (dy < -24) {
            isHidden = false;
          }
        } else {
          isHidden = false;
        }

        // Clear stop timer and set new one
        if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
        scrollStopTimeout = setTimeout(() => {
          if (isHidden) {
            isHidden = false;
            updateState();
          }
        }, 700);
      } else {
        isHidden = false;
      }

      lastScrollY = currentScrollY;
      lastScrollTime = now;

      // Query themed elements
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>("[data-nav-theme]")
      );

      let themeAt0: NavTheme = "dark";
      let themeAt64: NavTheme = "dark";
      let boundarySeamPx = HEADER_HEIGHT;

      // Find theme at y=0 and y=64 in viewport coordinates
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        const elTheme = (el.getAttribute("data-nav-theme") as NavTheme) || "dark";

        if (rect.top <= 0 && rect.bottom > 0) {
          themeAt0 = elTheme;
        }
        if (rect.top <= HEADER_HEIGHT && rect.bottom > HEADER_HEIGHT) {
          themeAt64 = elTheme;
        }

        // Check if top boundary of this element is between 0 and 64
        if (rect.top > 0 && rect.top <= HEADER_HEIGHT) {
          boundarySeamPx = rect.top;
        }
      }

      const hasSeam = themeAt0 !== themeAt64;
      const seamPx = hasSeam
        ? Math.max(0, Math.min(HEADER_HEIGHT, boundarySeamPx))
        : HEADER_HEIGHT;

      // If no seam, the layer matching themeAt0 covers the entire header
      const topTheme = themeAt0;
      const bottomTheme = hasSeam ? themeAt64 : themeAt0;
      const interactiveTheme = seamPx >= 32 ? topTheme : bottomTheme;

      // Update CSS variable on document root or header
      document.documentElement.style.setProperty("--seam", `${seamPx}px`);

      setThemeState((prev) => {
        if (
          prev.topTheme === topTheme &&
          prev.bottomTheme === bottomTheme &&
          Math.abs(prev.seamPx - seamPx) < 0.5 &&
          prev.interactiveTheme === interactiveTheme &&
          prev.isHeaderHidden === isHidden
        ) {
          return prev;
        }
        return {
          topTheme,
          bottomTheme,
          seamPx,
          interactiveTheme,
          isHeaderHidden: isHidden,
        };
      });
    };

    const updateState = () => {
      checkThemes();
    };

    const onScrollOrFrame = () => {
      checkThemes();
    };

    window.addEventListener("scroll", onScrollOrFrame, { passive: true });
    window.addEventListener("resize", onScrollOrFrame, { passive: true });
    checkThemes();

    return () => {
      window.removeEventListener("scroll", onScrollOrFrame);
      window.removeEventListener("resize", onScrollOrFrame);
      if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    };
  }, [isMenuOrSheetOpen]);

  return themeState;
}
