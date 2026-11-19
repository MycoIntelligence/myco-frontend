"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Section } from "./Section";
import { Pill } from "./Pill";
import { Button } from "./Button";
import { RevealText } from "./RevealText";
import { StreakTexture } from "./StreakTexture";
import { TypewriterHeading } from "./TypewriterHeading";
import { siteContent } from "@/src/lib/content";

export function Timeline() {
  const caseStudyPinRef = useRef<HTMLDivElement>(null);
  const timelinePinRef = useRef<HTMLDivElement>(null);
  const titleARef = useRef<HTMLHeadingElement>(null);
  const titleBRef = useRef<HTMLHeadingElement>(null);
  const barsContainerRef = useRef<HTMLDivElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const dashedLineRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    // 6.2 Case study pin for 60vh
    let caseTrigger: ScrollTrigger | null = null;
    const caseEl = caseStudyPinRef.current;
    if (caseEl) {
      caseTrigger = ScrollTrigger.create({
        trigger: caseEl,
        start: "top top",
        end: "+=60vh",
        pin: true,
        anticipatePin: 1,
      });
    }

    // 6.3 Timeline scene pin
    const isMobile = window.innerWidth < 768;
    const timeEl = timelinePinRef.current;
    if (timeEl && barsContainerRef.current) {
      const bars = barsContainerRef.current.querySelectorAll<HTMLElement>(".timeline-bar");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: timeEl,
          start: "top top",
          end: isMobile ? "+=110vh" : "+=220vh",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // Stage A (0 - 50%): Title A visible
      tl.to(titleARef.current, { opacity: 0, y: -10, duration: 0.4 }, 0.45);

      // Stage B (50% - 100%): Title B morphs in
      tl.fromTo(
        titleBRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4 },
        0.55
      );

      // Bars illuminate and transition height
      tl.to(
        bars,
        {
          opacity: (i) => (i > 80 ? 1 : 0.4),
          scaleY: (i) => (i % 7 === 0 ? 1.4 : 1),
          stagger: 0.002,
        },
        0.3
      );

      // Capsule pops in
      if (capsuleRef.current) {
        tl.fromTo(
          capsuleRef.current,
          { opacity: 0, scale: 0.9, y: 10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.3 },
          0.65
        );
      }

      // Badge pops in
      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.2 },
          0.7
        );
      }

      if (dashedLineRef.current) {
        tl.fromTo(
          dashedLineRef.current,
          { strokeDashoffset: 1000 },
          { strokeDashoffset: 0, duration: 0.5 },
          0.5
        );
      }
    }

    return () => {
      caseTrigger?.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === caseEl || st.trigger === timeEl) {
          st.kill();
        }
      });
    };
  }, []);

  const cs = siteContent.caseStudy;
  const tl = siteContent.timeline;

  // Generate 120 bars
  const totalBars = 120;
  const barElements = Array.from({ length: totalBars }).map((_, i) => {
    const isAccent = i % 7 === 0;
    const height = isAccent ? 48 : 24;
    return { id: i, isAccent, height };
  });

  return (
    <>
      {/* 6.2 Statement and Case-Study Section */}
      <div ref={caseStudyPinRef} className="w-full">
        <Section
          id="case-study"
          data-theme="dark"
          className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden"
          style={{
            background: `radial-gradient(120% 70% at 50% 10%, #172622 0%, #101614 75%)`,
          }}
        >
          <StreakTexture tone="dark" density={0.5} />
          <div
            className="noise-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-[1100px] mx-auto py-12 flex flex-col gap-8">
            <Pill theme="dark">SYSTEM CONTEXT GAP</Pill>
            <RevealText
              as="h2"
              className="editorial-headline text-[clamp(36px,5.2vw,84px)] font-normal text-white leading-[1.02]"
            >
              {cs.title}
            </RevealText>
            <p className="max-w-[640px] text-[18px] sm:text-[20px] leading-[1.6] text-[var(--ink-muted-on-dark)] [text-wrap:pretty]">
              {cs.body}
            </p>
            <div className="pt-2">
              <Button variant="primary" href={cs.ctaHref}>
                {cs.cta}
              </Button>
            </div>
          </div>
        </Section>
      </div>

      {/* 6.3 Timeline Section */}
      <div ref={timelinePinRef} className="w-full">
        <Section
          id="timeline"
          data-theme="dark"
          className="relative min-h-screen flex flex-col justify-center overflow-hidden"
          style={{
            background: `linear-gradient(180deg, #101614 0%, #141f1b 60%, var(--bg-pale) 100%)`,
          }}
        >
          <StreakTexture tone="dark" density={0.6} />
          <div
            className="ambient-glow-emerald top-1/3 -right-24"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col gap-8 max-w-[1280px] mx-auto w-full">
            <Pill theme="dark">{tl.eyebrow}</Pill>

            {/* Changing Headline Stage A / B */}
            <div className="relative min-h-[140px] sm:min-h-[120px] md:min-h-[96px]">
              <h2
                ref={titleARef}
                className="absolute inset-0 editorial-title text-[clamp(28px,4.2vw,60px)] leading-[1.08] text-white"
              >
                {tl.titleA}
              </h2>
              <h2
                ref={titleBRef}
                className="absolute inset-0 editorial-title text-[clamp(28px,4.2vw,60px)] leading-[1.08] text-[var(--accent)] opacity-0 pointer-events-none"
              >
                {tl.titleB}
              </h2>
            </div>

            {/* Visual Timeline Bar Grid */}
            <div className="relative w-full mt-10 pt-16 pb-8 glass-card-dark rounded-[24px] px-6 sm:px-10">
              {/* Badge above 85% marker */}
              <div
                ref={badgeRef}
                style={{ left: "85%" }}
                className="absolute -top-4 -translate-x-1/2 z-20 opacity-0 transition-opacity"
              >
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--accent)] text-[#0e1614] font-mono text-[11px] font-bold uppercase tracking-wider shadow-lg">
                  {tl.badge}
                </span>
              </div>

              {/* Marker line at 85% */}
              <div
                style={{ left: "85%" }}
                className="absolute top-4 bottom-8 w-[2px] bg-[var(--accent)] z-10"
              >
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-[11px] text-[var(--accent)] font-semibold whitespace-nowrap">
                  {tl.todayLabel}
                </span>
              </div>

              {/* Connecting Dashed SVG line */}
              <svg
                className="absolute inset-x-0 bottom-[44px] h-[2px] w-full pointer-events-none z-10"
                aria-hidden="true"
              >
                <line
                  ref={dashedLineRef}
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke="rgba(14,148,110,0.6)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              </svg>

              {/* 120 Timeline Bars */}
              <div
                ref={barsContainerRef}
                className="flex items-end justify-between gap-[2px] h-[72px] w-full relative z-0"
              >
                {barElements.map((bar) => (
                  <div
                    key={bar.id}
                    className="timeline-bar flex-1 rounded-full transition-colors will-change-transform"
                    style={{
                      height: `${bar.height}px`,
                      backgroundColor: bar.isAccent ? "var(--accent)" : "rgba(220,232,228,0.22)",
                      opacity: bar.isAccent ? 0.9 : 0.35,
                    }}
                  />
                ))}
              </div>

              {/* 12 Months Labels */}
              <div className="flex justify-between items-center mt-6 pt-3 border-t border-[rgba(220,232,228,0.12)] font-mono text-[11px] text-[var(--ink-muted-on-dark)] uppercase tracking-wider">
                {tl.months.map((m, idx) => (
                  <span key={idx} className={idx === 10 ? "text-[var(--accent)] font-bold" : ""}>
                    {m}
                  </span>
                ))}
              </div>

              {/* Dynamic Capsule Output */}
              <div
                ref={capsuleRef}
                className="mt-8 flex items-center justify-between p-4 rounded-[14px] bg-[rgba(14,148,110,0.12)] border border-[rgba(14,148,110,0.3)] text-[13px] font-mono opacity-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
                  <span className="text-white font-medium">{tl.capsule}</span>
                </div>
                <span className="text-[var(--accent)] tracking-wider uppercase text-[11px]">
                  VERIFIED RUN
                </span>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
