"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "motion/react";
import { LogoMark } from "@/components/ui/Wordmark";
import { Grain } from "@/components/ui/Grain";
import { siteContent } from "@/lib/content";

export function SiteFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, amount: 0.1 });

  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });

  const markY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  return (
    <footer
      ref={footerRef}
      className="relative min-h-[100svh] lg:min-h-[760px] overflow-hidden flex flex-col justify-between px-4 sm:px-9 pt-10 pb-12 select-none"
      style={{
        background: `radial-gradient(120% 62% at 50% 0%, #091d1c 0%, #091d1c 58%, rgba(9,29,28,0) 100%), linear-gradient(180deg, #9fb7b9 0%, #c4e1df 100%)`,
      }}
    >
      <Grain opacity={0.14} />

      {/* Nav theme markers: top 56% dark, bottom 44% light */}
      <div
        aria-hidden="true"
        data-nav-theme="dark"
        className="absolute inset-x-0 top-0 h-[56%] pointer-events-none"
      />
      <div
        aria-hidden="true"
        data-nav-theme="light"
        className="absolute inset-x-0 bottom-0 h-[44%] pointer-events-none"
      />

      {/* Top row */}
      <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-8 pt-4">
        {/* Top-left: LogoMark */}
        <motion.div
          style={{ y: markY }}
          className="text-white will-change-transform"
        >
          <LogoMark className="w-[80px] sm:w-[133px] h-auto" />
        </motion.div>

        {/* Top-right: Giant Wordmark */}
        <div className="flex flex-col items-start md:items-end">
          <div
            className="flex text-white font-serif italic font-semibold text-[clamp(44px,7vw,110px)] tracking-[-0.02em] leading-none overflow-hidden"
            aria-label="Myco"
          >
            {Array.from("Myco").map((char, i) => (
              <span
                key={i}
                style={{
                  transitionDelay: `${i * 40}ms`,
                  transform: isInView ? "translateY(0)" : "translateY(20px)",
                  filter: isInView ? "blur(0)" : "blur(10px)",
                  opacity: isInView ? 1 : 0,
                }}
                className={`inline-block transition-all duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${char === "y" ? "text-[#0e946e]" : ""}`}
              >
                {char}
              </span>
            ))}
          </div>

          {/* Link Columns */}
          <div className="grid grid-cols-2 min-[900px]:grid-cols-3 gap-8 sm:gap-14 mt-10 md:mt-12 text-left">
            {siteContent.footer.columns.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <h4 className="font-sans text-[12px] font-normal uppercase tracking-[0.04em] text-[#cde2e2]">
                  {col.title}
                </h4>
                <div className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="font-mono text-[12px] uppercase text-[#7e8f8f] hover:text-white transition-colors duration-[180ms]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-16">
        {/* Bottom-left: Tagline + Copyright */}
        <div className="flex flex-col gap-3 max-w-[340px]">
          <p className="font-sans text-[26px] leading-[1.1] tracking-[-0.02em] font-normal text-[#071a1b]">
            {siteContent.footer.tagline}
          </p>
          <p className="text-[13px] text-[#071a1b] font-normal">
            {siteContent.footer.copyright}
          </p>
        </div>

        {/* Bottom-right: Legal */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[12px] text-[rgba(7,26,27,0.55)] uppercase">
            LEGAL
          </span>
          <div className="flex items-center gap-6">
            {siteContent.footer.legal.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-mono text-[12px] uppercase text-[#071a1b] hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

