"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useNavTheme } from "@/hooks/useNavTheme";
import { NavLayer } from "./NavLayer";
import { MobileSheet } from "./MobileSheet";
import { Button } from "@/components/ui/Button";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const {
    topTheme,
    bottomTheme,
    seamPx,
    interactiveTheme,
    isHeaderHidden,
  } = useNavTheme(mobileMenuOpen || resourcesOpen);

  // Scroll progress hairline
  const { scrollY, scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });
  const hairlineOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <>
      {/* 2px Scroll progress hairline */}
      <motion.div
        style={{
          scaleX,
          opacity: hairlineOpacity,
        }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#6fb3b0] origin-left z-[40] pointer-events-none motion-reduce:hidden"
        aria-hidden="true"
      />

      {/* Fixed Header */}
      <header
        className="fixed inset-x-0 top-0 h-[64px] z-[50] pointer-events-none select-none"
        data-top-theme={topTheme}
        data-bottom-theme={bottomTheme}
        data-hidden={isHeaderHidden}
      >
        {/* Top layer (clipped from bottom) */}
        <NavLayer
          theme={topTheme}
          interactive={interactiveTheme === topTheme}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onResourcesOpenChange={setResourcesOpen}
          isHeaderHidden={isHeaderHidden}
          style={{
            clipPath: `inset(0 0 calc(100% - var(--seam, ${seamPx}px)) 0)`,
          }}
        />

        {/* Bottom layer (clipped from top) */}
        <NavLayer
          theme={bottomTheme}
          interactive={interactiveTheme === bottomTheme}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onResourcesOpenChange={setResourcesOpen}
          isHeaderHidden={isHeaderHidden}
          style={{
            clipPath: `inset(var(--seam, ${seamPx}px) 0 0 0)`,
          }}
        />
      </header>

      {/* Mobile Menu Sheet */}
      <MobileSheet
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        triggerRef={menuButtonRef}
      />
    </>
  );
}

