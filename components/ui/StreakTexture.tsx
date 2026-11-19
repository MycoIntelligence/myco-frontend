"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/cn";

interface StreakTextureProps {
  tone?: "dark" | "light";
  density?: number;
  className?: string;
  parallax?: boolean;
}

let cachedDarkUrl = "";
let cachedLightUrl = "";

function generateStreakDataUrl(tone: "dark" | "light", density = 1): string {
  if (typeof window === "undefined") return "";
  if (tone === "dark" && cachedDarkUrl && density === 1) return cachedDarkUrl;
  if (tone === "light" && cachedLightUrl && density === 1) return cachedLightUrl;

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const count = Math.round(2400 * density);
  for (let i = 0; i < count; i++) {
    const is3px = Math.random() < 0.7;
    const w = is3px ? 3 : 2;
    const h = 6 + Math.random() * 20;
    const x = Math.random() * 1200;
    const row = Math.floor(Math.random() * (900 / 14));
    const jitter = Math.random() * 4;
    const y = row * 14 + jitter;
    const a = 0.03 + Math.random() * 0.1;

    ctx.fillStyle =
      tone === "dark"
        ? `rgba(203, 225, 227, ${a})`
        : `rgba(7, 26, 27, ${a})`;
    ctx.fillRect(x, y, w, h);
  }

  const url = canvas.toDataURL("image/webp", 0.7);
  if (density === 1) {
    if (tone === "dark") cachedDarkUrl = url;
    else cachedLightUrl = url;
  }
  return url;
}

export function StreakTexture({
  tone = "dark",
  density = 1,
  className,
  parallax = true,
}: StreakTextureProps) {
  const [bgUrl, setBgUrl] = useState<string>("");
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (val) => val * -0.04);

  useEffect(() => {
    const url = generateStreakDataUrl(tone, density);
    setBgUrl(url);
  }, [tone, density]);

  if (!bgUrl) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden z-[1]",
        className
      )}
    >
      <motion.div
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: "1200px 900px",
          backgroundRepeat: "repeat",
          y: parallax ? y : 0,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full h-[120%] -top-[10%] will-change-transform absolute inset-x-0"
      />
    </div>
  );
}

