"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
        ? `rgba(220, 232, 228, ${a})`
        : `rgba(22, 24, 28, ${a})`;
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
  density = 0.5,
  className = "",
  parallax = false,
}: StreakTextureProps) {
  const [bgUrl, setBgUrl] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBgUrl(generateStreakDataUrl(tone, density));
  }, [tone, density]);

  if (!bgUrl) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundRepeat: "repeat",
        backgroundSize: "600px 450px",
        opacity: tone === "dark" ? 0.2 : 0.12,
      }}
      aria-hidden="true"
    />
  );
}

