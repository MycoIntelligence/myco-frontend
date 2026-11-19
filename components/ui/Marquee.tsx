"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface MarqueeProps {
  speed?: number; // pixels per second
  className?: string;
  children: React.ReactNode;
}

export function Marquee({
  speed = 24,
  className,
  children,
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.offsetHeight);
    }
  }, [children]);

  const duration = contentHeight > 0 ? contentHeight / speed : 20;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden [mask-image:linear-gradient(black_70%,transparent)]",
        className
      )}
    >
      <div
        className="flex flex-col gap-2.5 animate-marquee-up motion-reduce:animate-none"
        style={
          {
            "--duration": `${duration}s`,
            animation: `marqueeUp var(--duration) linear infinite`,
          } as React.CSSProperties
        }
      >
        <div ref={contentRef} className="flex flex-col gap-2.5">
          {children}
        </div>
        <div aria-hidden="true" className="flex flex-col gap-2.5">
          {children}
        </div>
      </div>
      <style jsx>{`
        @keyframes marqueeUp {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
}

