"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { BlurText } from "@/components/ui/BlurText";
import { Button } from "@/components/ui/Button";
import { Grain } from "@/components/ui/Grain";
import { siteContent } from "@/lib/content";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  // Scroll exit animations over the first 90vh (~800px)
  const headlineY = useTransform(scrollY, [0, 600], [0, -80]);
  const headlineOpacity = useTransform(scrollY, [0, 600], [1, 0.2]);
  const headlineBlur = useTransform(scrollY, [0, 600], [0, 10]);

  // Sub copy & CTA fade by 45vh (~350px)
  const subOpacity = useTransform(scrollY, [0, 350], [1, 0]);

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative min-h-[100svh] flex flex-col justify-between overflow-hidden grain select-none pb-[6vh]"
      style={{
        background: `
          radial-gradient(135% 52% at 50% 118%, #efeeea 0%, #e4ece8 48%, rgba(239,238,234,0) 100%),
          linear-gradient(180deg, #101614 0%, #16221e 26%, #3a4d46 62%, #829a92 84%, #efeeea 100%)
        `,
      }}
    >
      <Grain opacity={0.14} />

      {/* Nav theme markers: top 68% dark, bottom 32% light */}
      <div
        aria-hidden="true"
        data-nav-theme="dark"
        className="absolute inset-x-0 top-0 h-[68%] pointer-events-none"
      />
      <div
        aria-hidden="true"
        data-nav-theme="light"
        className="absolute inset-x-0 bottom-0 h-[32%] pointer-events-none"
      />

      {/* Animated sunrise dome horizon */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute inset-x-0 bottom-0 h-[45%] pointer-events-none"
        style={{
          background: `radial-gradient(135% 52% at 50% 118%, #efeeea 0%, #e4ece8 48%, rgba(239,238,234,0) 100%)`,
        }}
        aria-hidden="true"
      />

      {/* Upper group: Eyebrow + Headline */}
      <motion.div
        style={{
          y: headlineY,
          opacity: headlineOpacity,
          filter: `blur(${headlineBlur}px)`,
        }}
        className="relative z-10 flex flex-col items-center pt-[22vh] sm:pt-[26vh] px-4 text-center will-change-transform"
      >
        {/* Eyebrow: SUPPORTED BY Ridgeline */}
        <div className="flex items-center gap-3.5 mb-8 animate-in fade-in duration-700 [animation-delay:100ms]">
          <span className="font-sans text-[12px] uppercase tracking-[0.1em] text-[rgba(203,225,227,0.55)]">
            {siteContent.hero.supportedPrefix}
          </span>
          <span className="inline-flex items-center gap-2 font-sans font-semibold text-[17px] tracking-[-0.02em] text-[rgba(203,225,227,0.7)]">
            <span className="inline-flex gap-[3px] items-center" aria-hidden="true">
              <span className="w-[1px] h-3 bg-current rotate-[20deg]" />
              <span className="w-[1px] h-3 bg-current rotate-[20deg]" />
            </span>
            {siteContent.hero.supportedBrand}
          </span>
        </div>

        {/* Headline */}
        <BlurText
          lines={[
            siteContent.hero.headlineLine1,
            siteContent.hero.headlineLine2,
          ]}
          className="max-w-[12.5em] mx-auto"
        />
      </motion.div>

      {/* Lower group: Sub copy + CTA */}
      <motion.div
        style={{ opacity: subOpacity }}
        className="relative z-10 flex flex-col items-center px-4 text-center mt-auto will-change-transform"
      >
        <p className="max-w-[440px] text-[16px] leading-[1.5] text-[rgba(236,244,244,0.88)] animate-in fade-in duration-700 [animation-delay:900ms] [text-wrap:pretty]">
          {siteContent.hero.subCopy}
        </p>

        <div className="mt-8 animate-in fade-in slide-in-from-bottom-3 duration-600 [animation-delay:1100ms] w-full sm:w-auto">
          <Button
            variant="glass"
            href={siteContent.hero.ctaHref}
            className="w-full sm:w-auto h-[38px] px-6 text-[12px]"
          >
            {siteContent.hero.cta}
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

