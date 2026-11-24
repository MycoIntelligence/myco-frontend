"use client";

import React, { useRef, useState, useEffect } from "react";
import { useInView } from "motion/react";
import { Pill } from "@/components/ui/Pill";
import { siteContent } from "@/lib/content";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export function Outcome() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const reducedMotion = useReducedMotionSafe();
  const [stat1Val, setStat1Val] = useState("0.0");

  useEffect(() => {
    if (!isInView || reducedMotion) {
      if (reducedMotion) setStat1Val("4.2");
      return;
    }

    const start = performance.now();
    const duration = 1400;

    let rafId: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = (ease * 4.2).toFixed(1);
      setStat1Val(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setStat1Val("4.2");
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, reducedMotion]);

  const ot = siteContent.outcome;

  return (
    <div
      ref={ref}
      className="mt-[112px] pt-14 pb-[140px] border-t border-[#d1d6d6]"
    >
      <div className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-8 min-[900px]:gap-14">
        {/* Left col: 5 cols */}
        <div className="min-[900px]:col-span-5 flex flex-col items-start gap-4">
          <Pill tone="gray">{ot.eyebrow}</Pill>
          <p className="text-[16px] text-[#44595a] leading-[1.5]">
            {ot.title}
          </p>
        </div>

        {/* Right col: 7 cols (2 stats side by side) */}
        <div className="min-[900px]:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-6">
          {/* Stat 1 */}
          <div className="flex flex-col">
            <span className="font-sans text-[clamp(56px,6vw,92px)] font-normal tracking-[-0.04em] text-[#071a1b] leading-none">
              {reducedMotion ? "4.2M" : `${stat1Val}M`}
            </span>
            <p className="mt-3 text-[16px] leading-[1.5] text-[#44595a] max-w-[300px]">
              {ot.stat1.label}
            </p>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col">
            <span
              style={{
                transform: isInView ? "scale(1)" : "scale(0.8)",
                filter: isInView ? "blur(0)" : "blur(6px)",
                opacity: isInView ? 1 : 0,
              }}
              className="font-sans text-[clamp(56px,6vw,92px)] font-normal tracking-[-0.04em] text-[#071a1b] leading-none transition-all duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
            >
              {ot.stat2.value}
            </span>
            <p className="mt-3 text-[16px] leading-[1.5] text-[#44595a] max-w-[300px]">
              {ot.stat2.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

