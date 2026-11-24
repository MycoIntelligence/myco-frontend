"use client";

import React, { useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";
import { Pill } from "@/components/ui/Pill";
import { DashGlyph } from "@/components/ui/DashGlyph";
import { StreakTexture } from "@/components/ui/StreakTexture";
import { Grain } from "@/components/ui/Grain";
import { PhotoFallback } from "@/components/ui/PhotoFallback";
import { RequestFeed } from "@/components/mocks/RequestFeed";
import { ChainTable } from "@/components/mocks/ChainTable";
import { EvidenceRuns } from "@/components/mocks/EvidenceRuns";
import { DiffCard } from "@/components/mocks/DiffCard";
import { composeDigits } from "@/lib/glyphs";
import { siteContent } from "@/lib/content";
import { useLenis } from "@/components/layout/SmoothScroll";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/cn";

export function HowItWorks() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollTo } = useLenis();
  const reducedMotion = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.min(3, Math.max(0, Math.floor(p * 4)));
    setActiveIndex(idx);
  });

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      const targetScroll = top + ((index + 0.5) / 4) * (wrapperRef.current.offsetHeight - window.innerHeight);
      scrollTo(targetScroll);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      const next = Math.min(3, index + 1);
      handleCardClick(next);
    } else if (e.key === "ArrowLeft") {
      const prev = Math.max(0, index - 1);
      handleCardClick(prev);
    }
  };

  const hw = siteContent.howItWorks;

  const renderMock = (idx: number, isActive: boolean) => {
    switch (idx) {
      case 0:
        return <RequestFeed />;
      case 1:
        return <ChainTable active={isActive} />;
      case 2:
        return <EvidenceRuns active={isActive} />;
      case 3:
        return <DiffCard />;
      default:
        return null;
    }
  };

  return (
    <section
      id="how"
      ref={wrapperRef}
      data-nav-theme="dark"
      className="relative bg-[#122222] h-[420vh] max-[899px]:h-auto motion-reduce:h-auto"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(6,26,30,0.6) 0%, transparent 30%, transparent 70%, rgba(6,26,30,0.6) 100%)`,
      }}
    >
      <StreakTexture tone="dark" density={1} />
      <Grain opacity={0.12} />

      {/* Sticky Stage */}
      <div className="sticky top-0 h-[100svh] overflow-clip flex flex-col justify-center px-4 sm:px-9 lg:px-[clamp(20px,7vw,120px)] select-none motion-reduce:relative motion-reduce:h-auto motion-reduce:py-24 max-[899px]:relative max-[899px]:h-auto max-[899px]:py-24">
        <div className="max-w-[1600px] w-full mx-auto relative z-10 flex flex-col justify-between h-full max-h-[780px]">
          {/* Header */}
          <div className="relative pt-6">
            <div className="mb-6">
              <Pill tone="dark">{hw.eyebrow}</Pill>
            </div>
            <div className="relative">
              <h2 className="text-[clamp(34px,3.6vw,56px)] leading-[1.18] tracking-[-0.03em] font-normal text-[#cbe1df] [text-wrap:balance]">
                <span className="block">{hw.headingLine1}</span>
                <span className="block">{hw.headingLine2}</span>
              </h2>
              <p className="mt-4 max-w-[460px] text-[18px] sm:text-[20px] leading-[1.4] text-[rgba(203,225,227,0.62)] min-[900px]:absolute min-[900px]:top-1 min-[900px]:left-[62%] [text-wrap:pretty]">
                {hw.aside}
              </p>
            </div>
          </div>

          {/* Accordion Row (desktop) / Stack (mobile) */}
          <div className="flex flex-col min-[900px]:flex-row gap-4 mt-8 h-auto min-[900px]:h-[440px] w-full">
            {hw.cards.map((card, idx) => {
              const isActive = activeIndex === idx;

              return (
                <button
                  key={card.index}
                  type="button"
                  aria-expanded={isActive}
                  aria-controls={`how-card-panel-${idx}`}
                  onClick={() => handleCardClick(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  style={{
                    flexGrow: reducedMotion ? 1 : isActive ? 3.3 : 1,
                  }}
                  className={cn(
                    "relative rounded-[28px] bg-[#0a1c1e] overflow-hidden text-left cursor-pointer transition-all duration-[640ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
                    isActive
                      ? "border border-[rgba(203,225,227,0.35)] shadow-lg"
                      : "border border-[rgba(203,225,227,0.22)] hover:border-[rgba(203,225,227,0.60)]",
                    "min-h-[96px] min-[900px]:min-h-[440px]"
                  )}
                >
                  {/* Collapsed view (active = false) */}
                  <div
                    className={cn(
                      "p-7 flex flex-col justify-between h-full transition-opacity duration-200",
                      isActive ? "hidden min-[900px]:flex opacity-0 pointer-events-none absolute inset-0" : "flex"
                    )}
                  >
                    <div className="text-[rgba(203,225,227,0.45)]">
                      <DashGlyph
                        rows={composeDigits(card.index)}
                        unit={5}
                        gap={2}
                      />
                    </div>
                    <div className="mt-auto">
                      <span className="font-mono text-[13px] uppercase tracking-[0.06em] text-[#cbe1df] max-w-[140px] block">
                        {card.label}
                      </span>
                    </div>
                  </div>

                  {/* Active view (active = true) */}
                  <div
                    id={`how-card-panel-${idx}`}
                    className={cn(
                      "h-full p-3 min-[900px]:p-3 flex flex-col transition-opacity duration-300",
                      isActive ? "flex opacity-100" : "hidden opacity-0 pointer-events-none"
                    )}
                  >
                    {/* Media Mock Panel */}
                    <div className="relative w-full h-[212px] rounded-[20px] overflow-hidden bg-[#061a1e] flex items-center justify-center p-3">
                      <PhotoFallback seed={idx + 1} className="absolute inset-0 opacity-40 object-cover" />
                      <div className="absolute inset-0 bg-[#061a1e]/50 backdrop-blur-[2px]" />
                      <div className="relative z-10 w-full flex items-center justify-center">
                        {renderMock(idx, isActive)}
                      </div>
                    </div>

                    {/* Text Details */}
                    <div className="px-6 py-4 flex flex-col justify-center">
                      <h3 className="font-sans text-[26px] sm:text-[30px] font-normal tracking-[-0.02em] text-[#cbe1df] leading-[1.2]">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-[15px] sm:text-[16px] leading-[1.5] text-[#8fa3a3] max-w-[340px] [text-wrap:pretty]">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

