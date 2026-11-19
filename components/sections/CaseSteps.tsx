"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import {
  Eye,
  Layers,
  ShieldPlus,
  RefreshCw,
  Route,
  Check,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Outcome } from "./Outcome";
import { siteContent } from "@/lib/content";
import { useLenis } from "@/components/layout/SmoothScroll";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/cn";

const ICONS = [Eye, Layers, ShieldPlus, RefreshCw];

export function CaseSteps() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [dotPass, setDotPass] = useState(1);
  const { scrollTo } = useLenis();
  const reducedMotion = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const step = Math.min(3, Math.max(0, Math.floor(p * 4)));
    setActiveStep(step);
  });

  // Step 3 animation loop
  useEffect(() => {
    if (activeStep !== 2) return;
    const interval = setInterval(() => {
      setDotPass((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [activeStep]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      const targetScroll =
        top + ((index + 0.5) / 4) * (wrapperRef.current.offsetHeight - window.innerHeight);
      scrollTo(targetScroll);
    }
  };

  const cs = siteContent.caseSteps;

  const chipLabels = [
    "BEHAVIOR MAPPED",
    "CHAIN ASSEMBLED",
    "SEQUENCE REPRODUCED",
    "PATH CLOSED",
  ];

  return (
    <section
      id="steps"
      data-nav-theme="light"
      className="relative bg-[#f3f3f3] pt-[clamp(96px,11vw,168px)] px-4 sm:px-9 lg:px-[clamp(20px,7vw,120px)]"
    >
      <div className="max-w-[1600px] mx-auto">
        <SectionHeading
          eyebrow={cs.eyebrow}
          primary={cs.headingPrimary}
          muted={cs.headingMuted}
          aside={cs.aside}
          tone="gray"
          asideOffset="57%"
        />

        {/* 320vh Wrapper */}
        <div
          ref={wrapperRef}
          className="relative h-[320vh] max-[899px]:h-auto motion-reduce:h-auto"
        >
          {/* Sticky Container */}
          <div className="sticky top-[calc(50svh-212px)] h-auto max-[899px]:relative max-[899px]:top-0">
            <div className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-8 min-[900px]:gap-14 items-center">
              {/* Left Column: Step List with Rail (5 cols) */}
              <div
                role="tablist"
                aria-label="Case study steps"
                className="min-[900px]:col-span-5 relative flex flex-col pl-4 sm:pl-0"
              >
                {/* Vertical Rail */}
                <div
                  className="hidden min-[900px]:block absolute left-0 top-0 bottom-0 w-[2px] bg-[#d1d6d6]"
                  aria-hidden="true"
                />

                {/* Steps */}
                {cs.steps.map((step, idx) => {
                  const Icon = ICONS[idx];
                  const isActive = activeStep === idx;

                  return (
                    <button
                      key={step.id}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`step-panel-${idx}`}
                      onClick={() => handleStepClick(idx)}
                      className={cn(
                        "relative text-left py-4 min-[900px]:pl-[80px] cursor-pointer transition-colors duration-280 select-none group",
                        isActive ? "text-[#071a1b]" : "text-[#9aa3a3] hover:text-[#071a1b]"
                      )}
                    >
                      {/* Active Rail Marker (desktop) */}
                      {isActive && (
                        <motion.div
                          layoutId="stepRailActive"
                          transition={{ duration: 0.42, ease: [0.65, 0, 0.35, 1] }}
                          className="hidden min-[900px]:block absolute left-0 top-0 bottom-0 w-[4px] bg-[#6f8a89]"
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={cn(
                          "min-[900px]:absolute min-[900px]:left-[34px] min-[900px]:top-[22px] mb-2 min-[900px]:mb-0 transition-colors duration-280",
                          isActive ? "text-[#071a1b]" : "text-[#9aa3a3] group-hover:text-[#071a1b]"
                        )}
                        aria-hidden="true"
                      >
                        <Icon size={28} strokeWidth={1.5} absoluteStrokeWidth />
                      </div>

                      {/* Title */}
                      <span className="block font-sans text-[22px] sm:text-[28px] font-normal leading-[1.2] tracking-[-0.02em]">
                        {step.title}
                      </span>

                      {/* Description */}
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300",
                          isActive ? "max-h-[100px] opacity-100 mt-2" : "max-h-0 opacity-0"
                        )}
                      >
                        <p className="text-[15px] leading-[1.5] text-[#44595a] max-w-[380px]">
                          {step.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Animated Diagram Panel (7 cols) */}
              <div
                id={`step-panel-${activeStep}`}
                role="tabpanel"
                aria-label={cs.steps[activeStep].title}
                className="min-[900px]:col-span-7 relative w-full h-[360px] sm:h-[424px] rounded-[28px] bg-[#071919] overflow-hidden shadow-2xl flex items-center justify-center"
              >
                {/* Accessible live status */}
                <div className="sr-only" aria-live="polite">
                  Current diagram state: {chipLabels[activeStep]}
                </div>

                {/* Diagram SVG */}
                <svg
                  viewBox="0 0 684 424"
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full h-full select-none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="laneFade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="transparent" />
                      <stop offset="0.5" stopColor="rgba(203,225,227,0.5)" />
                      <stop offset="1" stopColor="transparent" />
                    </linearGradient>
                  </defs>

                  {/* 3 Lane bands */}
                  {[173, 235, 296].map((y, idx) => (
                    <g key={y}>
                      <rect
                        x="0"
                        y={y}
                        width="684"
                        height="38"
                        fill="rgba(255,255,255,0.03)"
                      />
                      {/* Vertical ticks */}
                      {Array.from({ length: 28 }).map((_, ti) => (
                        <line
                          key={ti}
                          x1={40 + ti * 22}
                          y1={y + 5}
                          x2={40 + ti * 22}
                          y2={y + 33}
                          stroke="url(#laneFade)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          opacity={0.6 + ((ti + idx) % 4) * 0.1}
                        />
                      ))}
                    </g>
                  ))}

                  {/* Guide dashed line at x=507 */}
                  <line
                    x1="507"
                    y1="98"
                    x2="507"
                    y2="309"
                    stroke="rgba(203,225,227,0.25)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />

                  {/* Path segments: P1, P2, P3, TAIL */}
                  {/* P1 */}
                  <path
                    d="M117 247 H149 Q158 247 158 238 V195 Q158 186 167 186 H204"
                    fill="none"
                    stroke="#cfe9e8"
                    strokeWidth="1.5"
                    className="transition-all duration-700"
                    opacity={activeStep === 3 ? 0.22 : 1}
                  />

                  {/* P2 */}
                  <path
                    d="M247 186 H281 Q290 186 290 195 V238 Q290 247 299 247 H333"
                    fill="none"
                    stroke="#cfe9e8"
                    strokeWidth="1.5"
                    className="transition-all duration-700"
                    opacity={activeStep >= 1 ? (activeStep === 3 ? 0.22 : 1) : 0.3}
                  />

                  {/* P3 */}
                  <path
                    d="M377 247 H410 Q419 247 419 256 V300 Q419 309 428 309 H464"
                    fill="none"
                    stroke="#cfe9e8"
                    strokeWidth="1.5"
                    className="transition-all duration-700"
                    opacity={activeStep >= 1 ? (activeStep === 3 ? 0.22 : 1) : 0.3}
                  />

                  {/* TAIL */}
                  <path
                    d="M507 309 H525"
                    fill="none"
                    stroke="#cfe9e8"
                    strokeWidth="1.5"
                    className="transition-all duration-700"
                    opacity={activeStep >= 1 ? (activeStep === 3 ? 0.22 : 1) : 0.3}
                  />

                  {/* Bridges: B1, B2, B3 (draw in step >= 1) */}
                  <path
                    d="M204 186 H247"
                    fill="none"
                    stroke="#7fd6cf"
                    strokeWidth="2"
                    opacity={activeStep >= 1 ? (activeStep === 3 ? 0.22 : 1) : 0}
                    className="transition-opacity duration-500"
                  />
                  <path
                    d="M333 247 H377"
                    fill="none"
                    stroke="#7fd6cf"
                    strokeWidth="2"
                    opacity={activeStep >= 1 ? (activeStep === 3 ? 0.22 : 1) : 0}
                    className="transition-opacity duration-500"
                  />
                  <path
                    d="M464 309 H507"
                    fill="none"
                    stroke="#7fd6cf"
                    strokeWidth="2"
                    opacity={activeStep >= 1 ? (activeStep === 3 ? 0.22 : 1) : 0}
                    className="transition-opacity duration-500"
                  />

                  {/* Nodes N1..N7 */}
                  {[
                    [117, 247],
                    [204, 186],
                    [247, 186],
                    [333, 247],
                    [377, 247],
                    [464, 309],
                    [507, 309],
                  ].map(([nx, ny], nIdx) => {
                    const isN1 = nIdx === 0;
                    const isDimmed = activeStep === 3 && !isN1;

                    return (
                      <g key={nIdx}>
                        {/* Step 4 pulse ring around N1 */}
                        {isN1 && activeStep === 3 && (
                          <circle
                            cx={nx}
                            cy={ny}
                            r="12"
                            fill="none"
                            stroke="#7fd6cf"
                            strokeWidth="1.5"
                            className="animate-ping [animation-duration:3s]"
                          />
                        )}
                        <circle
                          cx={nx}
                          cy={ny}
                          r="5.5"
                          fill={isDimmed ? "rgba(203,225,227,0.22)" : "#cfe9e8"}
                          className="transition-colors duration-500"
                        />
                      </g>
                    );
                  })}

                  {/* Travelling glowing dot in step 3 */}
                  {activeStep === 2 && (
                    <circle
                      cx="333"
                      cy="247"
                      r="6"
                      fill="#7fd6cf"
                      className="filter drop-shadow-[0_0_8px_#7fd6cf] animate-pulse"
                    />
                  )}
                </svg>

                {/* Top-Right Label Chip */}
                <div className="absolute top-6 right-6 inline-flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[rgba(255,255,255,0.06)] border border-[rgba(203,225,227,0.18)] font-mono text-[11px] uppercase text-[#cfe3e3]">
                  {activeStep === 3 ? (
                    <Check size={14} strokeWidth={1.5} className="text-[#5aa85a]" />
                  ) : (
                    <Route size={14} strokeWidth={1.5} />
                  )}
                  <span>{chipLabels[activeStep]}</span>
                </div>

                {/* Step 3: Run counter badge bottom-left */}
                {activeStep === 2 && (
                  <div className="absolute bottom-16 left-6 font-mono text-[11px] uppercase tracking-wider text-[#7fd6cf]">
                    RUN {dotPass}/3
                  </div>
                )}

                {/* Bottom Chip Row */}
                <div className="absolute bottom-6 inset-x-6 flex items-center justify-between font-mono text-[11px]">
                  <div className="flex flex-wrap items-center gap-2">
                    {["CONFIG CHANGE", "RETRY BURST", "QUEUE BACKLOG", "TIMEOUT CASCADE"].map(
                      (stage, sIdx) => {
                        const isReached = sIdx <= activeStep;
                        return (
                          <span
                            key={stage}
                            className={cn(
                              "px-2.5 py-1 rounded bg-[rgba(255,255,255,0.04)] border border-[rgba(203,225,227,0.12)] text-[10px] uppercase transition-opacity duration-300",
                              isReached ? "opacity-100 text-[#cfe9e8]" : "opacity-35 text-[#738585]"
                            )}
                          >
                            {stage}
                          </span>
                        );
                      }
                    )}
                  </div>
                  <span className="text-[#7fd6cf] text-[10px] uppercase shrink-0">
                    {activeStep === 0 && "observed"}
                    {activeStep === 1 && "assembled"}
                    {activeStep === 2 && "reproduced"}
                    {activeStep === 3 && "path closed"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Outcome Component */}
        <Outcome />
      </div>
    </section>
  );
}

