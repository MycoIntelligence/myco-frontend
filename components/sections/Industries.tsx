"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useInView } from "motion/react";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { DashGlyph } from "@/components/ui/DashGlyph";
import { Grain } from "@/components/ui/Grain";
import { PhotoFallback } from "@/components/ui/PhotoFallback";
import { composeDigits } from "@/lib/glyphs";
import { siteContent } from "@/lib/content";
import { cn } from "@/lib/cn";

export function Industries() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [touchCenterIdx, setTouchCenterIdx] = useState<number | null>(null);

  const ind = siteContent.industries;

  // Touch center detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.matchMedia("(pointer: fine)").matches) return;
      const vCenter = window.innerHeight / 2;
      let closestIdx = 0;
      let minDistance = Infinity;

      cardRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - vCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });
      setTouchCenterIdx(closestIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="industries"
      ref={containerRef}
      data-nav-theme="light"
      className="relative bg-[#f3f3f3] pt-[clamp(96px,11vw,168px)] pb-[clamp(96px,11vw,168px)] [content-visibility:auto] [contain-intrinsic-size:1px_900px]"
    >
      <div className="px-4 sm:px-9 lg:px-[37px] max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col min-[900px]:flex-row items-start min-[900px]:items-end justify-between gap-6 mb-16">
          <div className="flex flex-col items-start">
            <div className="mb-6">
              <Pill tone="gray">{ind.eyebrow}</Pill>
            </div>
            <h2 className="text-[clamp(34px,3.6vw,56px)] leading-[1.18] tracking-[-0.03em] font-normal [text-wrap:balance]">
              <span className="text-[#071a1b]">{ind.headingPrimary}</span>{" "}
              <span className="text-[rgba(7,26,27,0.55)]">{ind.headingMuted}</span>
            </h2>
            <p className="mt-3 text-[20px] leading-[1.4] text-[#44595a]">
              {ind.lead}
            </p>
          </div>

          <div className="shrink-0">
            <Button variant="primary" href={ind.ctaHref}>
              {ind.cta}
            </Button>
          </div>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 min-[1200px]:grid-cols-3 gap-4">
          {ind.items.map((item, idx) => {
            const isTouchActive = touchCenterIdx === idx;

            return (
              <Link
                key={item.slug}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                href={`/book-demo?industry=${item.slug}`}
                style={{
                  transitionDelay: `${idx * 70}ms`,
                  clipPath: isInView ? "inset(0)" : "inset(100% 0 0 0)",
                }}
                className={cn(
                  "group relative aspect-square rounded-[4px] overflow-hidden bg-[#071a1b] select-none block transition-all duration-900 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
                  isTouchActive && "touch-active"
                )}
              >
                {/* Photo Layer 1: Blurred base */}
                <div className="absolute inset-0 scale-[1.12] transition-transform duration-900 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.16] group-[.touch-active]:scale-[1.16]">
                  <PhotoFallback seed={idx + 1} sharp={false} />
                </div>

                {/* Photo Layer 2: Sharp on hover */}
                <div className="absolute inset-0 scale-[1.12] opacity-0 transition-all duration-600 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:opacity-100 group-hover:scale-[1.16] group-[.touch-active]:opacity-100 group-[.touch-active]:scale-[1.16]">
                  <PhotoFallback seed={idx + 1} sharp={true} />
                </div>

                {/* Gradient Overlay */}
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(0deg, rgba(7,26,27,0.88) 0%, rgba(7,26,27,0.35) 38%, rgba(7,26,27,0) 62%)",
                  }}
                  aria-hidden="true"
                />

                <Grain opacity={0.1} />

                {/* Top-Left Numeral */}
                <div className="absolute top-6 left-6 z-20 text-[rgba(255,255,255,0.7)] group-hover:text-white group-[.touch-active]:text-white transition-colors duration-300">
                  <DashGlyph
                    rows={composeDigits(item.index)}
                    unit={10}
                    gap={4}
                  />
                </div>

                {/* Bottom-Left Text Block */}
                <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col">
                  <h3 className="font-sans text-[26px] font-normal tracking-[-0.02em] text-white">
                    {item.title}
                  </h3>
                  <p className="font-mono text-[12px] uppercase leading-[1.45] text-[rgba(230,240,240,0.82)] group-hover:text-white group-[.touch-active]:text-white transition-colors duration-300 mt-2.5 max-w-[24ch]">
                    {item.descriptor}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

