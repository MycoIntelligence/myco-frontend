"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Section } from "./Section";
import { Pill } from "./Pill";
import { StreakTexture } from "./StreakTexture";
import { siteContent, ProofCard as ProofCardType } from "@/src/lib/content";

function ProofCardItem({ card }: { card: ProofCardType }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mx", `${x}px`);
    cardRef.current.style.setProperty("--my", `${y}px`);
  };

  const isInverted = card.inverted;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`proof-grid-card relative rounded-[28px] p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[280px] border transition-all duration-300 select-none ${
        card.span2 ? "md:col-span-2" : ""
      } ${
        isInverted
          ? "bg-[#efeeea] text-[#16181c] border-transparent shadow-xl"
          : "glass-card-dark text-[#dce8e4]"
      }`}
      style={{
        backgroundImage: !isInverted
          ? "radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), rgba(14,148,110,0.12), transparent 80%)"
          : undefined,
      }}
    >
      {/* Top Corners: Index and Tag */}
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
        <span className={isInverted ? "text-[#16181c] font-bold" : "text-[var(--accent)] font-semibold"}>
          {card.index}
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] ${
            isInverted
              ? "bg-[rgba(22,24,28,0.08)] text-[#16181c]"
              : "bg-[rgba(14,148,110,0.15)] text-[var(--accent)]"
          }`}
        >
          {card.tag}
        </span>
      </div>

      {/* Bottom: Name & Caption */}
      <div className="flex flex-col gap-2 mt-8">
        <h3
          className={`font-display text-[22px] sm:text-[26px] font-semibold leading-[1.2] tracking-[-0.015em] ${
            isInverted ? "text-[#16181c]" : "text-[#ffffff]"
          }`}
        >
          {card.name}
        </h3>
        <p
          className={`text-[14px] sm:text-[15px] leading-[1.55] [text-wrap:pretty] ${
            isInverted ? "text-[#44595a]" : "text-[var(--ink-muted-on-dark)]"
          }`}
        >
          {card.caption}
        </p>
      </div>
    </div>
  );
}

export function ProofGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const proof = siteContent.proof;

  useEffect(() => {
    if (typeof window === "undefined" || !gridRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const cards = gridRef.current.querySelectorAll(".proof-grid-card");
    gsap.fromTo(
      cards,
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 80%",
          once: true,
        },
      }
    );
  }, []);

  return (
    <Section
      id="proof"
      data-theme="dark"
      className="relative overflow-hidden"
      style={{
        background: `radial-gradient(140% 60% at 50% -10%, #172622 0%, #101614 75%)`,
      }}
    >
      <StreakTexture tone="dark" density={0.5} />
      <div
        className="ambient-glow-emerald -top-20 -right-20"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-12">
        <div className="flex flex-col gap-4 max-w-[640px]">
          <Pill theme="dark">{proof.eyebrow}</Pill>
          <h2 className="editorial-title text-[clamp(32px,4.4vw,68px)] leading-[1.05] text-[#ffffff]">
            {proof.title}
          </h2>
        </div>
        <p className="max-w-[42ch] text-[16px] sm:text-[18px] leading-[1.6] text-[var(--ink-muted-on-dark)] lg:pt-8 [text-wrap:pretty]">
          {proof.body}
        </p>
      </div>

      {/* Bento Grid */}
      <div
        ref={gridRef}
        className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {proof.cards.map((card) => (
          <ProofCardItem key={card.index} card={card} />
        ))}
      </div>
    </Section>
  );
}
