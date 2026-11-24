"use client";

import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "motion/react";
import { Button } from "@/components/ui/Button";
import { Grain } from "@/components/ui/Grain";
import { StreakTexture } from "@/components/ui/StreakTexture";
import { siteContent } from "@/lib/content";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export function ClosingCta() {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ["start 90%", "start 20%"],
  });

  // Animate inset and border-radius as it expands to full bleed
  const insetX = useTransform(scrollYProgress, [0, 1], [166, 0]);
  const radiusTop = useTransform(scrollYProgress, [0, 1], [80, 0]);

  const clipPath = useMotionTemplate`inset(0px ${insetX}px 0px ${insetX}px round ${radiusTop}px ${radiusTop}px 0px 0px)`;

  const cta = siteContent.closingCta;

  return (
    <section id="contact" className="relative bg-[#efeeea] select-none">
      {/* Light streak strip above panel */}
      <div
        data-nav-theme="light"
        className="relative h-[96px] overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(transparent, black 25%, black 75%, transparent)",
        }}
      >
        <StreakTexture tone="light" density={0.6} parallax={false} />
      </div>

      {/* Dark expanding panel */}
      <div
        ref={panelRef}
        data-nav-theme="dark"
        className="relative overflow-hidden"
      >
        <motion.div
          style={{
            clipPath: reducedMotion ? "none" : clipPath,
            background:
              "linear-gradient(180deg, #3a4d4d 0%, #1b2f2f 40%, #071b1a 100%)",
          }}
          className="relative min-h-[70svh] py-[120px] px-6 sm:px-10 flex flex-col items-center justify-center text-center overflow-hidden"
        >
          <StreakTexture tone="dark" density={0.5} parallax={false} />
          <Grain opacity={0.08} />

          <div className="relative z-10 max-w-[14em] mx-auto flex flex-col items-center">
            <h2 className="font-sans text-[clamp(34px,4vw,60px)] font-normal leading-[1.1] tracking-[-0.03em] text-[#cbe1df] [text-wrap:balance]">
              {cta.heading}
            </h2>

            <div className="mt-9">
              <Button
                variant="inverse"
                href={cta.ctaHref}
                className="h-[44px] px-8 text-[13px]"
              >
                {cta.cta}
              </Button>
            </div>

            <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.06em] text-[rgba(203,225,227,0.55)]">
              {cta.caption}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

