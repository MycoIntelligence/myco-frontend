"use client";

import React, { useState } from "react";
import { Section } from "./Section";
import { Pill } from "./Pill";
import { Icon } from "./Icon";
import { siteContent } from "@/src/lib/content";

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faq = siteContent.faq;

  if (!faq.items || !faq.items.length) return null;

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <Section
      id="faq"
      data-theme="paper"
      className="relative overflow-hidden"
      style={{
        background: `radial-gradient(120% 70% at 50% 0%, #ffffff 0%, var(--bg-paper) 60%, #eaeaea 100%)`,
      }}
    >
      <div
        className="noise-overlay opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Title */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Pill theme="light">KNOWLEDGE BASE</Pill>
          <h2 className="editorial-title text-[clamp(32px,4.4vw,68px)] leading-[1.05] text-[#16181c]">
            {faq.title}
          </h2>
          <p className="text-[16px] leading-[1.6] text-[var(--ink-muted-on-light)] max-w-[38ch] [text-wrap:pretty]">
            Answers to common questions regarding codebase onboarding, security boundaries, and validation workflows.
          </p>
        </div>

        {/* Right Column: Accordion */}
        <div className="lg:col-span-7 flex flex-col divide-y divide-[var(--line-light)] border-y border-[var(--line-light)]">
          {faq.items.map((item, idx) => {
            const isOpen = openIndex === idx;
            const contentId = `faq-content-${idx}`;
            const headerId = `faq-header-${idx}`;

            return (
              <div key={idx} className="py-5 select-none">
                <button
                  id={headerId}
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="w-full flex items-center justify-between text-left py-2 font-display text-[18px] sm:text-[22px] font-medium text-[#16181c] cursor-pointer group"
                >
                  <span className="pr-4 group-hover:text-[var(--accent)] transition-colors">
                    {item.q}
                  </span>
                  <span
                    className={`w-9 h-9 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-45 bg-[var(--accent)] text-white" : ""
                    }`}
                  >
                    <Icon name="plus" size={16} />
                  </span>
                </button>

                {/* Smooth CSS Grid Height Transition */}
                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={headerId}
                  className="grid transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="pt-3 pb-2 text-[15px] sm:text-[16px] leading-[1.6] text-[var(--ink-muted-on-light)] max-w-[54ch] [text-wrap:pretty]">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
