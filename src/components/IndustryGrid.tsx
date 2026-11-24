"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Section } from "./Section";
import { Pill } from "./Pill";
import { siteContent, IndustryCard } from "@/src/lib/content";

export function IndustryGrid() {
  const [activeCategory, setActiveCategory] = useState("All");
  const industries = siteContent.industries;

  const filteredCards =
    activeCategory === "All"
      ? industries.items
      : industries.items.filter((item) => item.category === activeCategory);

  return (
    <Section
      id="industries"
      data-theme="paper"
      className="relative overflow-hidden"
      style={{
        background: `radial-gradient(120% 70% at 50% 0%, #ffffff 0%, var(--bg-paper) 60%, #e8e8e6 100%)`,
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
      <div className="relative z-10 flex flex-col gap-4 mb-8 max-w-[760px]">
        <Pill theme="light">ENGINEERING DOMAINS</Pill>
        <h2 className="editorial-title text-[clamp(32px,4.4vw,68px)] leading-[1.05] text-[#16181c]">
          {industries.title}
        </h2>
      </div>

      {/* Filter Chip Row */}
      <div
        className="relative z-10 flex items-center gap-2 overflow-x-auto pb-3 mb-10 no-scrollbar"
        role="group"
        aria-label="Filter industries"
      >
        {industries.categories.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-[#16181c] text-white shadow-md"
                  : "bg-black/5 hover:bg-black/10 text-[#44595a]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 3-Column Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card, idx) => (
          <div
            key={card.id}
            className="group relative aspect-[4/3] rounded-[28px] overflow-hidden border border-[rgba(22,24,28,0.12)] bg-[#0e1614] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
          >
            {/* Background Concept Image */}
            <Image
              src={card.image}
              alt={card.title}
              fill
              className="object-cover group-hover:scale-105 transition-all duration-700 ease-out brightness-[0.88] group-hover:brightness-100"
            />

            {/* Architectural Grid Watermark Overlay */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity duration-300"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(203,225,227,0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(203,225,227,0.3) 1px, transparent 1px)
                `,
                backgroundSize: "32px 32px",
              }}
              aria-hidden="true"
            />

            {/* Top Coordinate Chip */}
            <div className="absolute top-4 right-4 z-20 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-black/40 backdrop-blur-[6px] text-[var(--accent)] border border-white/10">
              TOPOLOGY // 0{idx + 1}
            </div>

            {/* Bottom Dark Gradient */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#101614] via-[#101614]/60 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Content overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] mb-1.5 font-semibold">
                {card.sub}
              </span>
              <h3 className="editorial-title text-[22px] sm:text-[24px] font-medium leading-[1.2]">
                {card.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
