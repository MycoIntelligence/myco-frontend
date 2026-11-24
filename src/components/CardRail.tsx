"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Section } from "./Section";
import { Pill } from "./Pill";
import { StreakTexture } from "./StreakTexture";
import { siteContent } from "@/src/lib/content";

const CARD_SCHEMATICS = [
  "/assets/how-reason.svg",
  "/assets/how-layers.svg",
  "/assets/how-validate.svg",
  "/assets/how-surface.svg",
];

export function CardRail() {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const currentIdxRef = useRef(0);
  const visibleCountRef = useRef(4);

  const how = siteContent.how;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setVisibleCount(4);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const isDesktop = window.innerWidth >= 768;
    const sec = sectionRef.current;
    if (!sec) return;

    if (isDesktop) {
      // Initialize with Box 01 on desktop; reveal one by one as user scrolls
      setVisibleCount(1);
      visibleCountRef.current = 1;
      setExpandedIndex(0);
      currentIdxRef.current = 0;

      const trigger = ScrollTrigger.create({
        trigger: sec,
        start: "top top",
        end: "+=220vh",
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;

          // 4 distinct scroll-driven stages
          let targetIdx = 0;
          if (p < 0.24) targetIdx = 0;
          else if (p < 0.50) targetIdx = 1;
          else if (p < 0.74) targetIdx = 2;
          else targetIdx = 3;

          if (targetIdx !== currentIdxRef.current) {
            currentIdxRef.current = targetIdx;
            setExpandedIndex(targetIdx);
          }

          // Progressive reveal: box appears when its scroll threshold is reached
          let targetCount = 1;
          if (p < 0.12) targetCount = 1;
          else if (p < 0.38) targetCount = 2;
          else if (p < 0.64) targetCount = 3;
          else targetCount = 4;

          if (targetCount !== visibleCountRef.current) {
            visibleCountRef.current = targetCount;
            setVisibleCount(targetCount);
          }
        },
      });

      return () => {
        trigger.kill();
      };
    } else {
      // On mobile, reveal each box sequentially as it enters the viewport
      setVisibleCount(4);
      const cards = sec.querySelectorAll<HTMLElement>(".capability-card");
      const triggers: ScrollTrigger[] = [];

      cards.forEach((card, i) => {
        const tr = ScrollTrigger.create({
          trigger: card,
          start: "top 85%",
          onEnter: () => {
            gsap.fromTo(
              card,
              { opacity: 0, y: 35 },
              { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: i * 0.08 }
            );
          },
          once: true,
        });
        triggers.push(tr);
      });

      return () => {
        triggers.forEach((t) => t.kill());
      };
    }
  }, [how.cards.length]);

  const handleSelect = (idx: number) => {
    setExpandedIndex(idx);
    setHasInteracted(true);
    // When clicked, ensure clicked card and preceding cards are revealed
    if (idx + 1 > visibleCount) {
      setVisibleCount(idx + 1);
      visibleCountRef.current = idx + 1;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      handleSelect((idx + 1) % how.cards.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      handleSelect((idx - 1 + how.cards.length) % how.cards.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(idx);
    }
  };

  return (
    <Section
      id="how"
      data-theme="dark"
      ref={sectionRef}
      className="relative select-none overflow-hidden min-h-screen flex flex-col justify-center py-12 md:py-16"
      style={{
        background: `radial-gradient(140% 60% at 50% -10%, #172622 0%, #101614 75%)`,
      }}
    >
      <StreakTexture tone="dark" density={0.5} />
      <div
        className="ambient-glow-emerald -top-20 left-1/4 pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="noise-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Header Row */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8 md:mb-10">
        <div className="flex flex-col gap-3 max-w-[680px]">
          <Pill theme="dark">{how.eyebrow}</Pill>
          <h2 className="editorial-title text-[clamp(28px,3.8vw,56px)] leading-[1.05] text-[#ffffff]">
            {how.title}
          </h2>
        </div>
        <p className="max-w-[42ch] text-[15px] sm:text-[17px] leading-[1.55] text-[var(--ink-muted-on-dark)] lg:pt-6 [text-wrap:pretty]">
          {how.body}
        </p>
      </div>

      {/* Card Rail (Desktop Flex Row with scroll-driven reveal / Mobile Stack) */}
      <div
        ref={railRef}
        role="tablist"
        aria-label="Capabilities"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative z-10 flex flex-col md:flex-row gap-4 h-auto md:h-[clamp(420px,52vh,560px)] w-full items-stretch"
      >
        {how.cards.map((card, idx) => {
          const isVisible = idx < visibleCount;
          const isExpanded = expandedIndex === idx;
          const schematicSvg = CARD_SCHEMATICS[idx % CARD_SCHEMATICS.length];

          return (
            <div
              key={card.index}
              role="tab"
              tabIndex={0}
              aria-selected={isExpanded}
              aria-expanded={isExpanded}
              onClick={() => handleSelect(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`capability-card relative overflow-hidden rounded-[28px] border transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between cursor-pointer select-none ${
                isVisible
                  ? isExpanded
                    ? "md:grow-[52] opacity-100 translate-x-0 scale-100 p-6 sm:p-8 bg-[rgba(23,38,34,0.9)] border-[var(--accent)]/55 shadow-2xl backdrop-blur-[14px]"
                    : "md:grow-[14] opacity-100 translate-x-0 scale-100 p-6 sm:p-8 bg-[rgba(22,34,30,0.55)] border-[rgba(220,232,228,0.12)] hover:border-[rgba(220,232,228,0.3)] backdrop-blur-[10px]"
                  : "md:grow-0 md:w-0 md:max-w-0 md:p-0 md:m-0 md:border-0 opacity-0 translate-x-12 scale-95 pointer-events-none overflow-hidden"
              }`}
            >
              {/* Collapsed State Elements */}
              {!isExpanded && isVisible && (
                <div className="flex flex-row md:flex-col justify-between h-full items-center md:items-start transition-opacity duration-300">
                  <span className="font-doto-scanline text-[clamp(32px,3.6vw,52px)] text-[var(--accent)]">
                    {card.index}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted-on-dark)] md:-rotate-90 md:origin-bottom-left md:translate-x-3 whitespace-nowrap">
                    {card.label}
                  </span>
                </div>
              )}

              {/* Expanded State Elements */}
              {isExpanded && isVisible && (
                <div className="flex flex-col justify-between h-full transition-opacity duration-400">
                  {/* Top Preview Panel with Authentic Schematic */}
                  <div className="relative w-full h-[160px] sm:h-[200px] rounded-[16px] overflow-hidden border border-[rgba(255,255,255,0.1)] mb-5 flex items-center justify-center bg-[#0c1311]">
                    {/* Background SVG Schematic */}
                    <div className="absolute inset-0 opacity-20 flex items-center justify-center p-4">
                      <Image
                        src={schematicSvg}
                        alt=""
                        width={240}
                        height={240}
                        className="object-contain filter invert"
                      />
                    </div>

                    {/* Floating White UI Card Table */}
                    <div className="relative z-10 w-[92%] max-w-[390px] bg-white rounded-[12px] p-3.5 shadow-2xl border border-black/10 select-none">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                        <span>Artifact</span>
                        <span>Requirement</span>
                        <span>Status</span>
                      </div>
                      <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                        {card.table.map((row, rIdx) => (
                          <div
                            key={rIdx}
                            className="flex items-center justify-between py-0.5 border-b border-gray-50 last:border-none"
                          >
                            <span className="font-medium text-[#16181c] truncate max-w-[130px]">
                              {row.col1}
                            </span>
                            <span className="text-[#0a7c5c] text-[10px]">
                              {row.col2}
                            </span>
                            <span className="text-[10px] font-semibold text-[#c0553c]">
                              {row.col3}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Text Content */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-doto-scanline text-[26px] text-[var(--accent)]">
                        {card.index}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold">
                        {card.label}
                      </span>
                    </div>
                    <h3 className="editorial-title text-[clamp(19px,1.9vw,26px)] text-white">
                      {card.title}
                    </h3>
                    <p className="text-[13.5px] sm:text-[14.5px] leading-[1.5] text-[var(--ink-muted-on-dark)] max-w-[50ch] [text-wrap:pretty]">
                      {card.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
