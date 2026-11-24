"use client";

import React, { useRef } from "react";
import { useInView } from "motion/react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DashGlyph } from "@/components/ui/DashGlyph";
import { Grain } from "@/components/ui/Grain";
import { StreakTexture } from "@/components/ui/StreakTexture";
import { PartnerLogo } from "@/components/ui/LogoCard";
import { composeDigits } from "@/lib/glyphs";
import { siteContent } from "@/lib/content";

export function Proof() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const pf = siteContent.proof;

  return (
    <section
      id="proof"
      ref={ref}
      data-nav-theme="dark"
      className="relative bg-[#122222] pt-[clamp(96px,11vw,168px)] pb-[clamp(96px,11vw,168px)] px-4 sm:px-9 lg:px-[clamp(20px,7vw,120px)] overflow-hidden [content-visibility:auto] [contain-intrinsic-size:1px_900px]"
    >
      <StreakTexture tone="dark" density={1} />
      <Grain opacity={0.12} />

      <div className="max-w-[1600px] mx-auto relative z-10">
        <SectionHeading
          eyebrow={pf.eyebrow}
          primary={pf.headingPrimary}
          muted={pf.headingMuted}
          aside={pf.aside}
          tone="dark"
          asideOffset="65%"
        />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-[1200px]:grid-cols-3 gap-4 mt-14">
          {/* Card 1: Stratus */}
          <div
            style={{
              transitionDelay: "0ms",
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(24px)",
              filter: isInView ? "blur(0)" : "blur(8px)",
            }}
            className="rounded-[24px] bg-[#0a1c1e] border border-[rgba(203,225,227,0.22)] hover:border-[rgba(203,225,227,0.75)] transition-all duration-[180ms] p-8 flex flex-col justify-between min-h-[278px]"
          >
            <div className="flex items-center justify-between font-mono text-[13px]">
              <span className="text-[#6f8282]">{pf.cards[0].index}</span>
              <span className="text-[#7f9292]">{pf.cards[0].category}</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-[#cbe1df] h-8 flex items-center">
                <PartnerLogo name={pf.cards[0].brand!} />
              </div>
              <p className="text-[16px] leading-[1.45] text-[#a8bcbc] max-w-[260px]">
                {pf.cards[0].description}
              </p>
            </div>
          </div>

          {/* Card 2: PYLON */}
          <div
            style={{
              transitionDelay: "80ms",
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(24px)",
              filter: isInView ? "blur(0)" : "blur(8px)",
            }}
            className="rounded-[24px] bg-[#0a1c1e] border border-[rgba(203,225,227,0.22)] hover:border-[rgba(203,225,227,0.75)] transition-all duration-[180ms] p-8 flex flex-col justify-between min-h-[278px]"
          >
            <div className="flex items-center justify-between font-mono text-[13px]">
              <span className="text-[#6f8282]">{pf.cards[1].index}</span>
              <span className="text-[#7f9292]">{pf.cards[1].category}</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-[#cbe1df] h-8 flex items-center">
                <PartnerLogo name={pf.cards[1].brand!} />
              </div>
              <p className="text-[16px] leading-[1.45] text-[#a8bcbc] max-w-[260px]">
                {pf.cards[1].description}
              </p>
            </div>
          </div>

          {/* Card 3: kiln/ */}
          <div
            style={{
              transitionDelay: "160ms",
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(24px)",
              filter: isInView ? "blur(0)" : "blur(8px)",
            }}
            className="rounded-[24px] bg-[#0a1c1e] border border-[rgba(203,225,227,0.22)] hover:border-[rgba(203,225,227,0.75)] transition-all duration-[180ms] p-8 flex flex-col justify-between min-h-[278px] md:col-span-2 min-[1200px]:col-span-1"
          >
            <div className="flex items-center justify-between font-mono text-[13px]">
              <span className="text-[#6f8282]">{pf.cards[2].index}</span>
              <span className="text-[#7f9292]">{pf.cards[2].category}</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-[#cbe1df] h-8 flex items-center">
                <PartnerLogo name={pf.cards[2].brand!} />
              </div>
              <p className="text-[16px] leading-[1.45] text-[#a8bcbc] max-w-[260px]">
                {pf.cards[2].description}
              </p>
            </div>
          </div>

          {/* Card 4: 240 Verified / Day (Spans 2 columns, inverted) */}
          <div
            style={{
              transitionDelay: "240ms",
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(24px)",
              filter: isInView ? "blur(0)" : "blur(8px)",
            }}
            className="relative rounded-[24px] bg-[#6e7c7c] border border-[rgba(255,255,255,0.12)] p-8 flex flex-col justify-between min-h-[300px] overflow-hidden md:col-span-2 text-[#0a1c1e]"
          >
            <Grain opacity={0.18} />

            {/* Scan line effect */}
            {isInView && (
              <div
                className="absolute inset-x-0 h-[2px] bg-white/50 pointer-events-none animate-scan-down motion-reduce:hidden"
                style={{ animation: "scanDown 900ms ease-out forwards" }}
              />
            )}

            <div className="flex items-center justify-between font-mono text-[13px] relative z-10">
              <span className="text-[#0a1c1e] font-medium">
                {pf.cards[3].index}
              </span>
              <span className="text-[#0a1c1e] font-medium tracking-wider">
                {pf.cards[3].category}
              </span>
            </div>

            <div className="flex flex-col gap-4 mt-6 relative z-10">
              <div className="text-[#0a1c1e] overflow-x-auto py-2">
                <DashGlyph
                  rows={composeDigits("240")}
                  unit={14}
                  gap={6}
                  stagger={isInView}
                />
              </div>
              <p className="text-[16px] leading-[1.45] text-[#0a1c1e] font-medium max-w-[420px]">
                {pf.cards[3].description}
              </p>
            </div>
          </div>

          {/* Card 5: 300+ Incidents */}
          <div
            style={{
              transitionDelay: "320ms",
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(24px)",
              filter: isInView ? "blur(0)" : "blur(8px)",
            }}
            className="rounded-[24px] bg-[#0a1c1e] border border-[rgba(203,225,227,0.22)] hover:border-[rgba(203,225,227,0.75)] transition-all duration-[180ms] p-8 flex flex-col justify-between min-h-[300px] md:col-span-2 min-[1200px]:col-span-1"
          >
            <div className="flex items-center justify-between font-mono text-[13px]">
              <span className="text-[#6f8282]">{pf.cards[4].index}</span>
              <span className="text-[#7f9292]">{pf.cards[4].category}</span>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <span className="font-sans text-[clamp(72px,9vw,130px)] font-normal tracking-[-0.04em] text-[#cbe1df] leading-none select-none">
                {pf.cards[4].value}
              </span>
              <p className="text-[16px] leading-[1.45] text-[#a8bcbc] max-w-[280px]">
                {pf.cards[4].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanDown {
          0% {
            top: 0;
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}

