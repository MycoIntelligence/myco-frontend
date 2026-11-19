import React from "react";

interface PhotoFallbackProps {
  seed?: number;
  sharp?: boolean;
  className?: string;
}

export function PhotoFallback({
  seed = 1,
  sharp = false,
  className = "w-full h-full",
}: PhotoFallbackProps) {
  const id = `pf-${seed}-${sharp ? "s" : "b"}`;
  const poles = Array.from({ length: 9 }, (_, i) => {
    const r = Math.sin(seed * 97.13 + i * 12.9898) * 43758.5453;
    const f = r - Math.floor(r);
    return { x: 80 + i * 170 + f * 60, w: 14 + f * 36, h: 380 + f * 700 };
  });

  return (
    <svg
      viewBox="0 0 1600 1600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4e1df" />
          <stop offset="0.45" stopColor="#52706f" />
          <stop offset="1" stopColor="#061a1e" />
        </linearGradient>
        <filter id={`${id}-f`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.003 0.045"
            numOctaves={3}
            seed={seed}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={sharp ? 20 : 140}
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation={sharp ? "1 1" : "16 2"} />
        </filter>
      </defs>
      <g filter={`url(#${id}-f)`}>
        <rect width="1600" height="1600" fill={`url(#${id}-g)`} />
        <rect y="940" width="1600" height="660" fill="#061a1e" opacity="0.55" />
        {poles.map((p, i) => (
          <rect
            key={i}
            x={p.x}
            y={1000 - p.h}
            width={p.w}
            height={p.h + 600}
            fill="#0a1c1e"
            opacity={0.5 + (i % 3) * 0.15}
          />
        ))}
      </g>
    </svg>
  );
}

