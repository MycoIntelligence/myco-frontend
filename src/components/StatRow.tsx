"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Section } from "./Section";
import { Pill } from "./Pill";
import { StreakTexture } from "./StreakTexture";
import { siteContent, StatItem } from "@/src/lib/content";

function CountUpNumber({ item }: { item: StatItem }) {
  const [displayVal, setDisplayVal] = useState(0);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !numRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayVal(item.value);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const obj = { val: 0 };
    const anim = gsap.to(obj, {
      val: item.value,
      duration: 1.4,
      ease: "power2.out",
      scrollTrigger: {
        trigger: numRef.current,
        start: "top 85%",
        once: true,
      },
      onUpdate: () => {
        setDisplayVal(Math.round(obj.val));
      },
    });

    return () => {
      anim.kill();
    };
  }, [item.value]);

  const formatted = displayVal.toLocaleString();

  return (
    <span
      ref={numRef}
      className="editorial-headline text-[clamp(48px,6.2vw,96px)] leading-[0.95] text-white"
    >
      {item.prefix || ""}
      {formatted}
      {item.suffix || ""}
    </span>
  );
}

export function StatRow() {
  const stats = siteContent.stats;

  return (
    <Section
      id="stats"
      data-theme="dark"
      className="relative overflow-hidden py-[clamp(80px,12vh,140px)]"
      style={{
        background: `radial-gradient(130% 60% at 50% 50%, #162420 0%, #101614 75%)`,
      }}
    >
      <StreakTexture tone="dark" density={0.4} />
      <div
        className="ambient-glow-emerald top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-stretch">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="glass-card-dark rounded-[24px] p-8 flex flex-col justify-between gap-6 transition-all duration-300 hover:border-[var(--accent)]/50"
          >
            <div className="flex items-center justify-between">
              <Pill theme="dark">{stat.label}</Pill>
              <span className="font-mono text-[10px] text-[var(--accent)] tracking-wider">
                0{idx + 1}
              </span>
            </div>

            <CountUpNumber item={stat} />

            <p className="text-[14px] sm:text-[15px] leading-[1.55] text-[var(--ink-muted-on-dark)] [text-wrap:pretty]">
              {stat.caption}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
