"use client";

import React, { useRef } from "react";
import { useInView } from "motion/react";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { siteContent } from "@/lib/content";

export function FeaturedCase() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  // Split headline into lines
  const lines = [
    "WE CAUGHT A CASCADING OUTAGE",
    "11 MINUTES BEFORE LAUNCH.",
    "4.2M REQUESTS PROTECTED.",
  ];

  return (
    <section
      id="case"
      ref={ref}
      data-nav-theme="light"
      className="relative bg-[#efeeea] pt-[72px] pb-[140px] px-4 sm:px-9 lg:px-[clamp(20px,7vw,120px)]"
    >
      <div className="max-w-[1600px] mx-auto flex flex-col items-start">
        <div className="mb-7">
          <Pill tone="mint">{siteContent.featuredCase.eyebrow}</Pill>
        </div>

        {/* Masked reveal headline */}
        <h2 className="font-sans text-[clamp(36px,4.8vw,76px)] font-normal leading-[0.97] tracking-[-0.03em] uppercase text-[#071a1b] max-w-[14.5em] select-none [text-wrap:balance]">
          {lines.map((line, i) => (
            <span key={i} className="block overflow-hidden pb-1">
              <span
                style={{
                  transitionDelay: `${i * 90}ms`,
                  transform: isInView ? "translateY(0)" : "translateY(105%)",
                }}
                className="block transition-transform duration-900 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
              >
                {line}
              </span>
            </span>
          ))}
        </h2>

        {/* Body paragraph */}
        <p
          style={{
            transitionDelay: "360ms",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(24px)",
            filter: isInView ? "blur(0)" : "blur(8px)",
          }}
          className="mt-7 max-w-[600px] text-[18px] leading-[1.55] text-[#44595a] transition-all duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] [text-wrap:pretty]"
        >
          {siteContent.featuredCase.body}
        </p>

        {/* CTA Button */}
        <div
          style={{
            transitionDelay: "450ms",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(24px)",
          }}
          className="mt-7 transition-all duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
        >
          <Button
            variant="primary"
            href={siteContent.featuredCase.ctaHref}
            className="h-[38px] px-6 text-[12px]"
          >
            {siteContent.featuredCase.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}

