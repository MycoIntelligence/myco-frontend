"use client";

import React, { useRef } from "react";
import { useInView } from "motion/react";
import { Pill } from "@/components/ui/Pill";
import { LogoCard } from "@/components/ui/LogoCard";
import { siteContent } from "@/lib/content";

export function LogoStrip() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      id="trust"
      ref={ref}
      data-nav-theme="light"
      className="relative bg-[#efeeea] pt-[112px] pb-[120px] px-4 sm:px-9 lg:px-[clamp(20px,7vw,120px)]"
    >
      <div className="max-w-[1600px] mx-auto flex flex-col min-[1200px]:flex-row items-start gap-10 min-[1200px]:gap-[52px]">
        {/* Group 1: Integrations */}
        <div className="flex flex-col items-start gap-[18px]">
          <Pill tone="mint">{siteContent.logoStrip.group1.eyebrow}</Pill>
          <div className="flex flex-wrap items-center gap-[10px]">
            {siteContent.logoStrip.group1.logos.map((name, i) => (
              <div
                key={name}
                style={{
                  transitionDelay: `${i * 60}ms`,
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(24px)",
                  filter: isInView ? "blur(0)" : "blur(8px)",
                }}
                className="transition-all duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
              >
                <LogoCard name={name} />
              </div>
            ))}
          </div>
        </div>

        {/* Group 2: Team From */}
        <div className="flex flex-col items-start gap-[18px]">
          <Pill tone="mint">{siteContent.logoStrip.group2.eyebrow}</Pill>
          <div className="flex flex-wrap items-center gap-[10px]">
            {siteContent.logoStrip.group2.logos.map((name, i) => (
              <div
                key={name}
                style={{
                  transitionDelay: `${(i + 3) * 60}ms`,
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(24px)",
                  filter: isInView ? "blur(0)" : "blur(8px)",
                }}
                className="transition-all duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
              >
                <LogoCard name={name} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

