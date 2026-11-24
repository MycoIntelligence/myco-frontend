"use client";

import React, { useEffect, useState } from "react";

const SECTIONS = [
  "top",
  "case-study",
  "timeline",
  "how",
  "steps",
  "stats",
  "proof",
  "industries",
  "principles",
  "posts",
  "faq",
  "contact",
];

export function ScrollRail() {
  const [progress, setProgress] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const p = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
      setProgress(p);

      const winMid = scrollY + window.innerHeight * 0.4;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i]);
        if (el && el.offsetTop <= winMid) {
          setCurrentIdx(i + 1);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const total = SECTIONS.length;
  const indexStr = `${currentIdx < 10 ? `0${currentIdx}` : currentIdx} / ${
    total < 10 ? `0${total}` : total
  }`;

  return (
    <div
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3 select-none pointer-events-none"
      aria-hidden="true"
    >
      <span className="font-mono text-[10px] text-[#71747b] tracking-wider writing-mode-vertical rotate-180">
        {indexStr}
      </span>
      <div className="w-[2px] h-[120px] bg-[rgba(22,24,28,0.12)] rounded-full overflow-hidden">
        <div
          className="w-full bg-[var(--accent)] transition-all duration-100 ease-linear rounded-full"
          style={{ height: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

