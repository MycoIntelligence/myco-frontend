"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { Plus } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { ScrollWords } from "@/components/ui/ScrollWords";
import { siteContent } from "@/lib/content";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/cn";

const EVENT_BAR_INDEXES = [5, 10, 18, 23, 27, 33, 40, 45, 49, 54, 60];

export function ProblemTimeline() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const [activeState, setActiveState] = useState<1 | 2 | 3>(1);
  const [caughtCount, setCaughtCount] = useState(3);
  const [showSuffix, setShowSuffix] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (p < 0.3) {
      setActiveState(1);
    } else if (p < 0.64) {
      setActiveState(2);
      setCaughtCount(3);
      setShowSuffix(false);
    } else {
      setActiveState(3);
      // count from 3 to 11 between 0.64 and 0.82
      const progressInState3 = Math.min(1, Math.max(0, (p - 0.64) / 0.18));
      const count = Math.min(11, Math.floor(3 + progressInState3 * 8));
      setCaughtCount(count);
      setShowSuffix(p > 0.84);
    }
  });

  // Track horizontal drift
  const trackX = useTransform(scrollYProgress, [0, 1], [-40, 0]);

  // Small pills vs merged pill opacity/scale
  const smallPillsOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.38, 0.64, 0.72],
    [0, 1, 1, 0]
  );
  const smallPillsScale = useTransform(
    scrollYProgress,
    [0.3, 0.38, 0.64, 0.72],
    [0.9, 1, 1, 1.04]
  );

  const mergedPillOpacity = useTransform(
    scrollYProgress,
    [0.66, 0.76],
    [0, 1]
  );
  const mergedPillScaleX = useTransform(
    scrollYProgress,
    [0.66, 0.76],
    [0.55, 1]
  );
  const mergedPillScaleY = useTransform(
    scrollYProgress,
    [0.66, 0.76],
    [0.7, 1]
  );

  const st = siteContent.problemTimeline;

  return (
    <section
      id="problem"
      ref={wrapperRef}
      data-nav-theme="light"
      className="relative bg-[#efeeea] h-[400vh] min-[900px]:h-[400vh] max-[899px]:h-[260vh] motion-reduce:h-auto"
    >
      {/* Sticky Stage */}
      <div className="sticky top-0 h-[100svh] overflow-clip flex flex-col justify-between px-4 sm:px-9 lg:px-[clamp(20px,7vw,120px)] pt-[100px] sm:pt-[120px] pb-12 select-none motion-reduce:relative motion-reduce:h-auto motion-reduce:py-24">
        <div className="max-w-[1600px] w-full mx-auto relative z-10">
          <div className="mb-4">
            <Pill tone="mint">{st.eyebrow}</Pill>
          </div>

          {/* Statement Headings and Subs */}
          <div className="relative min-h-[140px] sm:min-h-[170px]">
            {st.statements.map((stmt, idx) => {
              const statementNumber = idx + 1;
              const isCurrent = activeState === statementNumber;

              return (
                <div
                  key={idx}
                  style={{
                    opacity: reducedMotion ? 1 : isCurrent ? 1 : 0,
                    transform: reducedMotion
                      ? "none"
                      : isCurrent
                      ? "translateY(0)"
                      : activeState > statementNumber
                      ? "translateY(-30px)"
                      : "translateY(30px)",
                    filter: reducedMotion
                      ? "none"
                      : isCurrent
                      ? "blur(0)"
                      : "blur(8px)",
                  }}
                  className={cn(
                    "transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
                    reducedMotion
                      ? "relative mb-8"
                      : "absolute inset-x-0 top-0 pointer-events-none"
                  )}
                >
                  <h2 className="text-[clamp(28px,3.6vw,52px)] font-normal leading-[1.18] tracking-[-0.03em] max-w-[20ch]">
                    <span className="text-[#071a1b] font-normal">
                      {stmt.primary}
                    </span>{" "}
                    <span className="text-[rgba(7,26,27,0.55)]">
                      {stmt.muted}
                    </span>
                  </h2>

                  <p className="mt-3 max-w-[480px] text-[18px] sm:text-[20px] leading-[1.4] text-[#071a1b] font-normal [text-wrap:pretty]">
                    <ScrollWords
                      text={stmt.sub}
                      progress={scrollYProgress}
                      range={[idx * 0.33, idx * 0.33 + 0.28]}
                    />
                  </p>
                </div>
              );
            })}
          </div>

          {/* Counter Badge */}
          <div className="mt-4 sm:mt-6 h-8 flex items-center">
            {activeState >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
                className="inline-flex items-center h-[29px] px-3 rounded-[10px] bg-[#071a1b] text-[#cbe1df] font-mono text-[13px] uppercase tracking-[0.06em]"
              >
                <span>
                  {caughtCount} OF 11 REGRESSIONS CAUGHT
                  {showSuffix && <span>{st.counterSuffix}</span>}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Timeline Graphic Area */}
        <div className="relative w-full mt-auto overflow-hidden">
          {/* TODAY Label */}
          <div className="absolute right-[24%] top-0 -translate-x-1/2 -translate-y-full mb-1 flex flex-col items-center pointer-events-none z-20">
            <span className="font-mono text-[12px] uppercase text-[#071a1b] font-semibold tracking-[0.06em]">
              TODAY
            </span>
          </div>

          {/* Timeline Full Bleed Track */}
          <div className="relative w-full h-[150px] overflow-hidden">
            {/* Future band */}
            <div
              className="absolute top-[14px] bottom-[14px] left-[76%] right-0 bg-[#b2d0d0] rounded-r-md pointer-events-none z-0"
              aria-hidden="true"
            />

            {/* TODAY vertical line */}
            <div
              className="absolute left-[76%] top-0 bottom-0 w-[1px] bg-[#071a1b] z-20 pointer-events-none"
              aria-hidden="true"
            />

            {/* Bars container with drift */}
            <motion.div
              style={{ x: reducedMotion ? 0 : trackX }}
              className="relative flex items-center h-full gap-[12px] sm:gap-[17px] pl-4 sm:pl-10 will-change-transform"
            >
              {Array.from({ length: 64 }).map((_, i) => {
                const isEvent = EVENT_BAR_INDEXES.includes(i);
                const eventRank = EVENT_BAR_INDEXES.indexOf(i);
                const isUnderPill = [0, 3, 6].includes(eventRank);

                // Bar fill logic based on scroll state
                const isCaught =
                  activeState === 2
                    ? isUnderPill
                    : activeState === 3
                    ? eventRank < caughtCount
                    : false;

                return (
                  <div
                    key={i}
                    className="relative flex flex-col items-center justify-center shrink-0"
                  >
                    {/* Top Marker (for event bars) */}
                    {isEvent && (
                      <div
                        className={cn(
                          "absolute -top-4 w-[10px] h-[10px] rounded-full transition-all duration-300",
                          isCaught
                            ? "bg-[#071a1b] border-none"
                            : "bg-transparent border-[1.5px] border-[#071a1b]"
                        )}
                        aria-hidden="true"
                      />
                    )}

                    {/* Bar */}
                    <div
                      style={{
                        height: isEvent ? "123px" : "110px",
                        width: isEvent ? "9px" : "5px",
                      }}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        isEvent
                          ? "bg-[#071a1b] [clip-path:ellipse(50%_50%_at_50%_50%)]"
                          : "bg-[rgba(7,26,27,0.28)] blur-[1px]"
                      )}
                    />

                    {/* Bottom mirrored marker on state 3 */}
                    {isEvent && activeState === 3 && (
                      <div
                        className="absolute -bottom-4 w-[10px] h-[10px] rounded-full bg-[#071a1b] transition-all duration-500 animate-in fade-in"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}

              {/* Three glass pills in state 2 */}
              <motion.div
                style={{
                  opacity: smallPillsOpacity,
                  scale: smallPillsScale,
                }}
                className="absolute inset-y-0 left-0 right-0 pointer-events-none flex items-center z-10"
              >
                <div className="relative w-full h-full">
                  {/* Pill 1 */}
                  <div className="absolute left-[60px] sm:left-[90px] top-1/2 -translate-y-1/2 h-[64px] rounded-full bg-[rgba(255,255,255,0.35)] border border-[rgba(255,255,255,0.6)] backdrop-blur-[10px] flex items-center gap-2 px-6 font-mono text-[14px] uppercase text-[#071a1b] font-medium shadow-sm">
                    <Plus size={18} strokeWidth={1.5} absoluteStrokeWidth />
                    <span>{st.pills[0]}</span>
                  </div>
                  {/* Pill 2 */}
                  <div className="absolute left-[260px] sm:left-[360px] top-1/2 -translate-y-1/2 h-[64px] rounded-full bg-[rgba(255,255,255,0.35)] border border-[rgba(255,255,255,0.6)] backdrop-blur-[10px] flex items-center gap-2 px-6 font-mono text-[14px] uppercase text-[#071a1b] font-medium shadow-sm">
                    <Plus size={18} strokeWidth={1.5} absoluteStrokeWidth />
                    <span>{st.pills[1]}</span>
                  </div>
                  {/* Pill 3 */}
                  <div className="absolute left-[480px] sm:left-[660px] top-1/2 -translate-y-1/2 h-[64px] rounded-full bg-[rgba(255,255,255,0.35)] border border-[rgba(255,255,255,0.6)] backdrop-blur-[10px] flex items-center gap-2 px-6 font-mono text-[14px] uppercase text-[#071a1b] font-medium shadow-sm">
                    <Plus size={18} strokeWidth={1.5} absoluteStrokeWidth />
                    <span>{st.pills[2]}</span>
                  </div>
                </div>
              </motion.div>

              {/* One wide merged pill in state 3 */}
              <motion.div
                style={{
                  opacity: mergedPillOpacity,
                  scaleX: mergedPillScaleX,
                  scaleY: mergedPillScaleY,
                }}
                className="absolute left-[40px] right-[24%] top-1/2 -translate-y-1/2 h-[84px] sm:h-[94px] rounded-full bg-[rgba(255,255,255,0.40)] border border-[rgba(255,255,255,0.7)] backdrop-blur-[12px] flex items-center justify-center px-8 z-15 pointer-events-none origin-center"
              >
                <div className="absolute left-8 text-[#071a1b]">
                  <Plus size={22} strokeWidth={1.5} absoluteStrokeWidth />
                </div>
                <span className="font-mono text-[13px] sm:text-[14px] uppercase tracking-[0.06em] text-[#071a1b] font-medium">
                  {st.mergedPill}
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Month Labels */}
          <div className="flex items-center gap-[110px] sm:gap-[150px] pl-[50px] sm:pl-[117px] pt-4 font-mono text-[12px] uppercase text-[rgba(7,26,27,0.8)]">
            {st.months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>

          {/* Caption */}
          <div className="mt-3 pl-4 sm:pl-10 font-mono text-[11px] text-[rgba(7,26,27,0.55)] uppercase">
            {activeState <= 2 && <span>{st.caption}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

