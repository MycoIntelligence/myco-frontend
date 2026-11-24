"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Section } from "./Section";
import { Pill } from "./Pill";
import { Button } from "./Button";
import { StreakTexture } from "./StreakTexture";
import { siteContent } from "@/src/lib/content";
import { DIAGRAM_PRESETS } from "@/src/lib/diagrams";

const PRINCIPLES = [
  {
    index: "01",
    title: "Context before reasoning",
    body: "Evaluating changes without codebase topology, dependencies, and requirements produces noisy reviews. We reconstruct the full intent before generating findings.",
  },
  {
    index: "02",
    title: "Deterministic AST verification",
    body: "Rather than relying entirely on statistical generation, Myco combines language models with deterministic syntax tree analysis and interface boundary checks.",
  },
  {
    index: "03",
    title: "Actionable engineering evidence",
    body: "Every finding links the affected module, the intended requirement, and downstream impact, giving developers the evidence to fix or merge with confidence.",
  },
];

export function PostGrid() {
  const [activeStage, setActiveStage] = useState(0);
  const principlesRef = useRef<HTMLDivElement>(null);
  const dashesRef = useRef<(SVGRectElement | null)[]>([]);

  const posts = siteContent.posts;

  // 6.9 Principles pinned scene & dash morphing
  useEffect(() => {
    if (typeof window === "undefined" || !principlesRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    if (prefersReducedMotion || isMobile) return;

    gsap.registerPlugin(ScrollTrigger);

    const st = ScrollTrigger.create({
      trigger: principlesRef.current,
      start: "top top",
      end: "+=180vh",
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const stage = Math.min(2, Math.max(0, Math.floor(self.progress * 3)));
        setActiveStage(stage);
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  // Animate dashes when activeStage changes
  useEffect(() => {
    const currentPreset = DIAGRAM_PRESETS[activeStage];
    if (!currentPreset || !dashesRef.current.length) return;

    currentPreset.forEach((item, i) => {
      const el = dashesRef.current[i];
      if (el) {
        gsap.to(el, {
          attr: {
            x: item.x,
            y: item.y,
            width: item.width,
          },
          opacity: item.opacity,
          duration: 0.7,
          ease: "power2.out",
        });
      }
    });
  }, [activeStage]);

  return (
    <>
      {/* 6.9 Pinned Two-Column Principles Scene (Dark) */}
      <div ref={principlesRef} className="w-full">
        <Section
          id="principles"
          data-theme="dark"
          className="min-h-screen flex flex-col justify-center select-none relative overflow-hidden"
          style={{
            background: `radial-gradient(130% 60% at 50% 10%, #172622 0%, #101614 75%)`,
          }}
        >
          <StreakTexture tone="dark" density={0.5} />
          <div
            className="ambient-glow-emerald -bottom-20 -left-20"
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Sticky Left: Pixel Dash Diagram in Dark Glass Card */}
            <div className="md:col-span-6 flex flex-col items-center justify-center p-8 sm:p-12 rounded-[28px] glass-card-dark shadow-2xl">
              <svg
                viewBox="0 0 320 250"
                className="w-full max-w-[340px] h-[220px]"
                aria-hidden="true"
              >
                {DIAGRAM_PRESETS[0].map((d, i) => (
                  <rect
                    key={d.id}
                    ref={(el) => {
                      dashesRef.current[i] = el;
                    }}
                    x={d.x}
                    y={d.y}
                    width={d.width}
                    height="6"
                    rx="3"
                    fill="var(--accent)"
                    opacity={d.opacity}
                  />
                ))}
              </svg>
              <div className="mt-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                <span>Deterministic Pattern 0{activeStage + 1}</span>
              </div>
            </div>

            {/* Right Column: 3 Stages with Focus Shift */}
            <div className="md:col-span-6 flex flex-col gap-10">
              <Pill theme="dark">ARCHITECTURAL PRINCIPLES</Pill>
              {PRINCIPLES.map((pr, idx) => {
                const isActive = activeStage === idx;
                return (
                  <div
                    key={pr.index}
                    className={`transition-all duration-400 ${
                      isActive
                        ? "opacity-100 filter-none translate-x-0"
                        : "opacity-30 filter blur-[1.5px] translate-x-2"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2 font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold">
                      <span>{pr.index}</span>
                      <span className="w-3 h-[1px] bg-current" />
                      <span>PRINCIPIUM</span>
                    </div>
                    <h3 className="editorial-title text-[24px] sm:text-[28px] text-white mb-2 leading-[1.2]">
                      {pr.title}
                    </h3>
                    <p className="text-[15px] sm:text-[16px] leading-[1.6] text-[var(--ink-muted-on-dark)] max-w-[48ch] [text-wrap:pretty]">
                      {pr.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      </div>

      {/* 6.10 Latest Posts (Paper) */}
      <Section
        id="posts"
        data-theme="paper"
        className="relative overflow-hidden"
        style={{
          background: `radial-gradient(120% 70% at 50% 0%, #ffffff 0%, var(--bg-paper) 60%, #eaeaea 100%)`,
        }}
      >
        <div
          className="noise-overlay opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4">
            <Pill theme="light">{posts.eyebrow}</Pill>
            <h2 className="editorial-title text-[clamp(32px,4.4vw,68px)] leading-[1.05] text-[#16181c]">
              <span>{posts.titlePrimary} </span>
              <span className="opacity-50">{posts.titleMuted}</span>
            </h2>
          </div>
          <Button variant="text-link" href={posts.all}>
            {posts.all}
          </Button>
        </div>

        {/* 3 Post Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.items.map((post) => (
            <Link
              key={post.number}
              href={post.href}
              className="glass-card-light group relative rounded-[28px] p-8 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl flex flex-col justify-between min-h-[320px]"
            >
              <div>
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-[rgba(22,24,28,0.1)]">
                  <span className="font-doto-scanline text-[32px] text-[#16181c]">
                    {post.number}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#71747b]">
                    {post.date}
                  </span>
                </div>
                <h3 className="editorial-title text-[20px] sm:text-[22px] font-medium leading-[1.25] text-[#16181c] group-hover:text-[var(--accent)] transition-colors">
                  {post.title}
                </h3>
              </div>

              <div className="pt-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#71747b]">
                <span>Read paper</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
