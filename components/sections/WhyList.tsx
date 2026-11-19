"use client";

import React, { useRef, useState, useEffect } from "react";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { DashGlyph } from "@/components/ui/DashGlyph";
import { PICTOGRAMS } from "@/lib/pictograms";
import { siteContent } from "@/lib/content";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/cn";

export function WhyList() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotionSafe();

  const wl = siteContent.whyList;

  // Track which item is closest to viewport center
  useEffect(() => {
    if (reducedMotion) return;

    const handleScroll = () => {
      const vCenter = window.innerHeight / 2;
      let closestIdx = 0;
      let minDistance = Infinity;

      itemsRef.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const dist = Math.abs(itemCenter - vCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      setActiveIndex(closestIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reducedMotion]);

  const activeItem = wl.items[activeIndex];
  const activePictogramRows = PICTOGRAMS[activeItem.id] || [];

  return (
    <section
      id="why"
      ref={containerRef}
      data-nav-theme="light"
      className="relative bg-[#efeeea] pt-[clamp(96px,11vw,168px)] pb-[clamp(96px,11vw,168px)] px-4 sm:px-9 lg:px-[clamp(20px,7vw,120px)]"
    >
      <div className="max-w-[1600px] mx-auto">
        {/* Unpinned Header Block */}
        <div className="relative mb-24">
          <div className="mb-6">
            <Pill tone="mint">{wl.eyebrow}</Pill>
          </div>
          <div className="relative">
            <h2 className="text-[clamp(34px,3.6vw,56px)] leading-[1.18] tracking-[-0.03em] font-normal [text-wrap:balance] max-w-[20ch]">
              <span className="text-[#071a1b]">{wl.headingPrimary}</span>{" "}
              <span className="text-[rgba(7,26,27,0.55)]">{wl.headingMuted}</span>
            </h2>
            <div className="mt-5 max-w-[460px] text-[20px] leading-[1.4] text-[#44595a] min-[900px]:absolute min-[900px]:top-1 min-[900px]:left-[57%]">
              <p>{wl.aside}</p>
              <div className="mt-7">
                <Button variant="primary" href={wl.ctaHref}>
                  {wl.cta}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Pictogram + Focus List Grid */}
        <div className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-8 min-[900px]:gap-14 relative">
          {/* Left: Sticky Pictogram Stage (5 cols) */}
          <div className="hidden min-[900px]:block min-[900px]:col-span-5 relative">
            <div className="sticky top-0 h-[100svh] flex flex-col justify-center items-center select-none">
              <div className="w-[384px] h-[264px] flex items-center justify-center text-[#071a1b] ml-[7%]">
                <DashGlyph
                  key={activeItem.id}
                  rows={activePictogramRows}
                  unit={7}
                  gap={5}
                  stagger
                />
              </div>
            </div>
          </div>

          {/* Right: Items list with focus blur (7 cols) */}
          <div className="min-[900px]:col-span-7 flex flex-col gap-16 min-[900px]:py-[25vh]">
            {wl.items.map((item, idx) => {
              const isActive = activeIndex === idx;

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemsRef.current[idx] = el;
                  }}
                  className={cn(
                    "min-h-[260px] sm:min-h-[310px] flex flex-col justify-center transition-all duration-500",
                    reducedMotion
                      ? "opacity-100 filter-none"
                      : isActive
                      ? "opacity-100 filter-none"
                      : "min-[900px]:opacity-25 min-[900px]:blur-[4px]"
                  )}
                >
                  {/* Mobile inline pictogram */}
                  <div className="block min-[900px]:hidden text-[#071a1b] mb-6">
                    <DashGlyph
                      rows={PICTOGRAMS[item.id] || []}
                      unit={5}
                      gap={3}
                    />
                  </div>

                  <span className="font-mono text-[13px] text-[#7f9292] mb-4 block">
                    {item.index}
                  </span>
                  <h3 className="font-sans text-[26px] sm:text-[30px] font-normal leading-[1.2] tracking-[-0.02em] text-[#071a1b] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-[17px] sm:text-[18px] leading-[1.55] text-[#44595a] max-w-[380px] [text-wrap:pretty]">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

