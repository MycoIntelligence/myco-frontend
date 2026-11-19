"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Section } from "./Section";
import { Button } from "./Button";
import { BrandMark } from "./Icon";
import { InteractiveGravityField } from "./InteractiveGravityField";
import { siteContent } from "@/src/lib/content";

const FULL_LINE_1 = "AI writes the code.";
const FULL_LINE_2 = "Myco understands it.";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);

  // Typewriter state
  const [mounted, setMounted] = useState(false);
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [activeLine, setActiveLine] = useState<1 | 2>(1);
  const [isTypingDone, setIsTypingDone] = useState(false);

  // Typewriter effect execution
  useEffect(() => {
    setMounted(true);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setText1(FULL_LINE_1);
      setText2(FULL_LINE_2);
      setActiveLine(2);
      setIsTypingDone(true);
      return;
    }

    let idx1 = 0;
    let idx2 = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId1: NodeJS.Timeout | null = null;
    let intervalId2: NodeJS.Timeout | null = null;

    // Start typing line 1 after a slight mount delay
    timeoutId = setTimeout(() => {
      intervalId1 = setInterval(() => {
        idx1++;
        setText1(FULL_LINE_1.slice(0, idx1));

        if (idx1 >= FULL_LINE_1.length) {
          if (intervalId1) clearInterval(intervalId1);
          setActiveLine(2);

          // Brief pause between line 1 and line 2
          timeoutId = setTimeout(() => {
            intervalId2 = setInterval(() => {
              idx2++;
              setText2(FULL_LINE_2.slice(0, idx2));

              if (idx2 >= FULL_LINE_2.length) {
                if (intervalId2) clearInterval(intervalId2);
                setIsTypingDone(true);
              }
            }, 36);
          }, 240);
        }
      }, 36);
    }, 180);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId1) clearInterval(intervalId1);
      if (intervalId2) clearInterval(intervalId2);
    };
  }, []);

  // Scroll parallax fade
  useEffect(() => {
    if (typeof window === "undefined" || !heroRef.current || !headlineRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const heroEl = heroRef.current;
    const st = ScrollTrigger.create({
      trigger: heroEl,
      start: "top top",
      end: "80% top",
      scrub: 0.5,
      onUpdate: (self) => {
        if (headlineRef.current) {
          const p = self.progress;
          headlineRef.current.style.transform = `translateY(${p * 48}px) scale(${1 - p * 0.05})`;
          headlineRef.current.style.opacity = `${Math.max(0, 1 - p * 1.15)}`;
        }
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  const hero = siteContent.hero;

  return (
    <Section
      ref={heroRef}
      id="top"
      data-theme="dark"
      noPadding
      className="relative min-h-[100svh] flex flex-col justify-between overflow-hidden select-none pb-[8vh] pt-[96px] sm:pt-[110px]"
      style={{
        background: `
          radial-gradient(135% 52% at 50% 118%, #081d1c 0%, #0d2a29 48%, rgba(13,42,41,0) 100%),
          linear-gradient(180deg, #051414 0%, #082120 30%, #0c2d2b 60%, #133936 85%, #184440 100%)
        `,
      }}
    >
      {/* Interactive cursor/touch gravity particle field */}
      <InteractiveGravityField />

      {/* Atmospheric center glow */}
      <div
        className="ambient-glow-emerald -top-24 left-1/2 -translate-x-1/2 opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Soft curved sunrise horizon */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38%] pointer-events-none will-change-transform"
        style={{
          background: `radial-gradient(160% 60% at 50% 118%, rgba(197, 224, 220, 0.15) 0%, rgba(197, 224, 220, 0.04) 45%, transparent 100%)`,
        }}
        aria-hidden="true"
      />

      {/* Grain noise overlay */}
      <div
        className="noise-overlay pointer-events-none opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Content Stack */}
      <div className="relative z-10 flex flex-col items-center text-center pt-[4vh] sm:pt-[8vh] px-4 max-w-[1200px] mx-auto my-auto w-full">
        {/* Brand identifier badge */}
        <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-sm">
          <BrandMark size={20} />
          <span className="text-[13px] sm:text-[14px] font-sans font-semibold tracking-tight text-white/95">
            {siteContent.brand.name}
          </span>
        </div>

        {/* Hero Headline with Typewriter Animation and Full Width Container */}
        <div
          ref={headlineRef}
          className="w-full max-w-[1040px] px-2 sm:px-4 mx-auto will-change-transform"
        >
          <h1
            aria-label={`${FULL_LINE_1} ${FULL_LINE_2}`}
            className="font-sans font-medium text-[clamp(34px,6.2vw,86px)] leading-[1.08] tracking-[-0.035em] text-white select-text"
          >
            {/* Accessible fallback for screen readers & SEO */}
            <span className="sr-only">{FULL_LINE_1} {FULL_LINE_2}</span>

            {/* Line 1: AI writes the code. */}
            <span
              suppressHydrationWarning
              className="block min-h-[1.15em] text-white"
              aria-hidden="true"
            >
              {mounted ? text1 : FULL_LINE_1}
              {mounted && activeLine === 1 && !isTypingDone && (
                <span className="inline-block w-[3px] h-[0.82em] bg-[var(--accent)] align-middle ml-1.5 animate-pulse" />
              )}
            </span>

            {/* Line 2: Myco understands it. */}
            <span
              suppressHydrationWarning
              className="block min-h-[1.15em] text-[#b9ded6]"
              aria-hidden="true"
            >
              {mounted ? text2 : FULL_LINE_2}
              {mounted && (activeLine === 2 || isTypingDone) && (
                <span
                  className={`inline-block w-[3px] h-[0.82em] bg-[var(--accent)] align-middle ml-1.5 ${
                    isTypingDone ? "animate-pulse opacity-75" : "animate-pulse"
                  }`}
                />
              )}
            </span>
          </h1>

          {/* Subcopy */}
          <p className="mt-6 sm:mt-7 text-[clamp(15px,1.2vw,19px)] leading-[1.55] text-[#dce8e4]/85 max-w-[52ch] mx-auto font-sans [text-wrap:pretty] tracking-tight px-2">
            {hero.sub}
          </p>

          {/* CTA Button */}
          <div className="mt-8 flex items-center justify-center">
            <Button
              variant="primary"
              href={hero.ctaHref}
              className="h-[48px] sm:h-[50px] px-8 sm:px-9 text-[14px] font-medium shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {hero.cta}
            </Button>
          </div>
        </div>

        {/* Backed by integration label */}
        <div className="mt-12 sm:mt-14 flex items-center gap-2.5 text-[#889994] font-mono text-[11px] uppercase tracking-wider">
          <span>{hero.backedBy.label}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span className="text-[#dce8e4] font-medium">{hero.backedBy.brand}</span>
        </div>
      </div>
    </Section>
  );
}
