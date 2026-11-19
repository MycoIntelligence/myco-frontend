"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Section } from "./Section";
import { Pill } from "./Pill";
import { Icon, IconName } from "./Icon";
import { siteContent } from "@/src/lib/content";
import { scrollToTarget } from "@/src/lib/scroll";

const STEP_SVGS = [
  "/assets/flow-code.svg",
  "/assets/flow-deps.svg",
  "/assets/how-validate.svg",
  "/assets/security-boundary.svg",
];

export function StepTabs() {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinTriggerRef = useRef<ScrollTrigger | null>(null);

  const steps = siteContent.steps;

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    if (prefersReducedMotion || isMobile) return;

    gsap.registerPlugin(ScrollTrigger);

    pinTriggerRef.current = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: `+=${steps.items.length * 70}vh`,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const idx = Math.min(
          steps.items.length - 1,
          Math.max(0, Math.floor(self.progress * steps.items.length))
        );
        setActiveStep(idx);
      },
    });

    return () => {
      pinTriggerRef.current?.kill();
    };
  }, [steps.items.length]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    if (containerRef.current && pinTriggerRef.current) {
      const start = pinTriggerRef.current.start;
      const end = pinTriggerRef.current.end;
      const target = start + ((index + 0.5) / steps.items.length) * (end - start);
      scrollToTarget(target);
    }
  };

  // 4 authentic engineering mini-visualizations
  const renderMiniVis = (stepIdx: number) => {
    const svgPath = STEP_SVGS[stepIdx];

    switch (stepIdx) {
      case 0:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 font-mono text-[11px]">
            <div className="relative w-full max-w-[340px] h-[120px] mb-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <Image src={svgPath} alt="" width={180} height={100} className="filter invert" />
              </div>
              <div className="relative z-10 flex items-end gap-2.5 h-[90px] w-full px-4 border-b border-[rgba(255,255,255,0.15)]">
                {[45, 90, 60, 110, 80, 125, 70, 95, 115, 65].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h * 0.7}px` }}
                    className="flex-1 bg-[var(--accent)] rounded-t-[2px] opacity-85 animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between w-full max-w-[340px] text-[11px] text-[#71747b] uppercase">
              <span>AST nodes: 1,284 indexed</span>
              <span className="text-[var(--accent)] font-semibold">{steps.items[0].chip}</span>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-8">
            <div className="relative w-full max-w-[320px] h-[120px] flex items-center justify-center">
              <svg viewBox="0 0 340 120" className="w-full h-auto" fill="none">
                <path
                  d="M30 60 L110 60 L190 60 L270 60"
                  stroke="rgba(220,232,228,0.2)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <circle cx="30" cy="60" r="14" fill="#16221e" stroke="#0e946e" strokeWidth="2" />
                <circle cx="110" cy="60" r="14" fill="#16221e" stroke="#0e946e" strokeWidth="2" />
                <circle cx="190" cy="60" r="16" fill="#0e946e" />
                <circle cx="270" cy="60" r="14" fill="#16221e" stroke="#0e946e" strokeWidth="2" />
                <text x="190" y="64" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace">
                  INTENT
                </text>
              </svg>
            </div>
            <div className="mt-4 px-3.5 py-1.5 rounded-full bg-[#0e946e]/20 border border-[#0e946e]/40 text-[var(--accent)] font-mono text-[11px] font-semibold">
              Topology Mapped: {steps.items[1].chip}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex flex-col justify-center p-8 max-w-[380px] mx-auto font-mono text-[12px] gap-4">
            <div className="flex justify-between text-[#dce8e4]">
              <span>toolAuthorization check</span>
              <span className="text-[#4fa36b] font-bold">PASS</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="w-full h-full bg-[#4fa36b]" />
            </div>

            <div className="flex justify-between text-[#dce8e4] pt-2">
              <span>Behavioral assertion</span>
              <span className="text-[#c0553c] font-bold">DRIFT DETECTED</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="w-[68%] h-full bg-[#c0553c]" />
            </div>
            <span className="text-[10px] text-[#71747b] uppercase mt-2">
              Automated behavioral test pass rate
            </span>
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center font-mono">
            <div className="w-14 h-14 rounded-full bg-[#0e946e]/20 border border-[var(--accent)] text-[var(--accent)] flex items-center justify-center mb-4 shadow-lg">
              <Icon name="shield-check" size={26} />
            </div>
            <div className="text-[15px] text-white font-medium mb-1">
              Validated Signal Ready
            </div>
            <div className="text-[12px] text-[#71747b] max-w-[280px]">
              Intent verified. Zero regression in downstream dependency graph.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      <Section
        id="steps"
        data-theme="paper"
        className="min-h-screen flex flex-col justify-center relative overflow-hidden"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, #ffffff 0%, var(--bg-paper) 70%, #eaeaea 100%)`,
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
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4 max-w-[640px]">
            <Pill theme="light">{steps.eyebrow}</Pill>
            <h2 className="editorial-title text-[clamp(32px,4.4vw,68px)] leading-[1.05] text-[#16181c]">
              <span>{steps.titlePrimary} </span>
              <span className="opacity-50">{steps.titleMuted}</span>
            </h2>
          </div>
          <p className="max-w-[42ch] text-[16px] sm:text-[18px] leading-[1.6] text-[var(--ink-muted-on-light)] lg:pt-8 [text-wrap:pretty]">
            {steps.body}
          </p>
        </div>

        {/* 2-Column Split: Steps list (38%) + Dark Showcase (62%) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Left Column (38% ~ 5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-center relative pl-6 border-l-2 border-[var(--line-light)]">
            {/* Active Rail Indicator */}
            <div
              className="absolute left-[-2px] w-[3px] bg-[var(--accent)] rounded-full transition-all duration-300"
              style={{
                top: `${(activeStep / steps.items.length) * 100}%`,
                height: `${100 / steps.items.length}%`,
              }}
            />

            <div className="flex flex-col gap-6">
              {steps.items.map((step, idx) => {
                const isActive = activeStep === idx;

                return (
                  <div
                    key={step.title}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStepClick(idx)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleStepClick(idx)}
                    className={`cursor-pointer transition-all duration-300 select-none p-3 rounded-[12px] ${
                      isActive
                        ? "opacity-100 bg-[rgba(22,24,28,0.04)]"
                        : "opacity-45 hover:opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-[#16181c] text-[var(--accent)] shadow-md"
                            : "bg-[rgba(22,24,28,0.08)] text-[#16181c]"
                        }`}
                      >
                        <Icon name={step.icon as IconName} size={18} />
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#71747b]">
                        0{idx + 1} / 04
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-[20px] sm:text-[22px] font-medium text-[#16181c] leading-[1.2]">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] sm:text-[15px] leading-[1.5] text-[var(--ink-muted-on-light)] [text-wrap:pretty]">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column Dark Showcase (62% ~ 7 cols) */}
          <div className="md:col-span-7 flex items-center">
            <div className="w-full h-[360px] sm:h-[420px] rounded-[28px] bg-[#0e1614] border border-[rgba(255,255,255,0.08)] shadow-2xl relative overflow-hidden flex flex-col justify-between">
              {/* Top Bar with Stage Title & Chip */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-white">
                    {steps.items[activeStep].title}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] px-2.5 py-0.5 rounded-full bg-[rgba(14,148,110,0.15)] border border-[rgba(14,148,110,0.3)]">
                  {steps.items[activeStep].chip}
                </span>
              </div>

              {/* Dynamic Center Visualization */}
              <div className="flex-1 relative flex items-center justify-center">
                {renderMiniVis(activeStep)}
              </div>

              {/* Bottom Progress Bar */}
              <div className="px-6 py-3 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between font-mono text-[10px] text-[#71747b] uppercase">
                <span>Phase {activeStep + 1} of {steps.items.length}</span>
                <span className="text-[var(--accent)]">ACTIVE ENGINE PIPELINE</span>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
