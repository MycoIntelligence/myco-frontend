"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useInView } from "motion/react";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Grain } from "@/components/ui/Grain";
import { PhotoFallback } from "@/components/ui/PhotoFallback";
import { siteContent } from "@/lib/content";

export function Latest() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  const lt = siteContent.latest;

  return (
    <section
      id="latest"
      ref={containerRef}
      data-nav-theme="light"
      className="relative bg-[#efeeea] pt-[clamp(96px,11vw,168px)] pb-[clamp(96px,11vw,168px)] px-4 sm:px-9 lg:px-[clamp(20px,7vw,120px)] [content-visibility:auto] [contain-intrinsic-size:1px_900px]"
    >
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-14">
          <div className="flex flex-col items-start">
            <div className="mb-6">
              <Pill tone="mint">{lt.eyebrow}</Pill>
            </div>
            <h2 className="text-[clamp(34px,3.6vw,56px)] leading-[1.18] tracking-[-0.03em] font-normal [text-wrap:balance]">
              <span className="text-[#071a1b]">{lt.headingPrimary}</span>{" "}
              <span className="text-[rgba(7,26,27,0.55)]">{lt.headingMuted}</span>
            </h2>
          </div>

          <div className="shrink-0">
            <Button variant="primary" href={lt.ctaHref}>
              {lt.cta}
            </Button>
          </div>
        </div>

        {/* 3 Blog Cards */}
        <div className="grid grid-cols-1 min-[900px]:grid-cols-3 gap-4">
          {lt.posts.map((post, idx) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{
                transitionDelay: `${idx * 80}ms`,
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(24px)",
              }}
              className="group relative rounded-[16px] overflow-hidden bg-[#d6e6e5] flex flex-col transition-all duration-[420ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1 select-none"
            >
              {/* Image Block */}
              <div className="relative w-full h-[224px] overflow-hidden bg-[#647a78]">
                <div className="absolute inset-0 transition-transform duration-900 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-105">
                  <PhotoFallback seed={post.seed} />
                </div>
                <Grain opacity={0.1} />

                {/* Sweep Light Beam */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-900 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm" />
              </div>

              {/* Body */}
              <div className="relative p-7 sm:p-8 flex flex-col flex-1 justify-between bg-[#d6e6e5]">
                <Grain opacity={0.1} />

                <div className="relative z-10 flex flex-col">
                  <span className="font-mono text-[12px] uppercase text-[#071a1b] font-medium tracking-[0.06em]">
                    {post.category}
                  </span>
                  <h3 className="font-sans text-[22px] sm:text-[26px] leading-[1.3] tracking-[-0.02em] text-[#071a1b] font-normal mt-4 line-clamp-3">
                    {post.title}
                  </h3>
                  <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.5] text-[#44595a] line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                {/* Footer row */}
                <div className="relative z-10 flex items-center justify-between pt-7 mt-6 border-t border-[rgba(7,26,27,0.08)]">
                  <span className="font-mono text-[12px] uppercase text-[#44595a]">
                    {post.readTime}
                  </span>
                  <span className="text-[#071a1b] transition-transform duration-[180ms] group-hover:translate-x-[3px] group-hover:-translate-y-[3px]">
                    <ArrowUpRight size={16} strokeWidth={1.5} absoluteStrokeWidth />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

