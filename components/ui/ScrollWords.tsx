"use client";

import React from "react";
import {
  motion,
  MotionValue,
  useTransform,
  useMotionTemplate,
} from "motion/react";

interface ScrollWordsProps {
  text: string;
  progress: MotionValue<number>;
  range?: [number, number];
  className?: string;
}

interface WordProps {
  progress: MotionValue<number>;
  range: [number, number];
  children: React.ReactNode;
}

function Word({ progress, range, children }: WordProps) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  const blur = useTransform(progress, range, [6, 0]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  return (
    <motion.span
      style={{
        opacity,
        filter,
        display: "inline-block",
        whiteSpace: "pre",
      }}
    >
      {children}{" "}
    </motion.span>
  );
}

export function ScrollWords({
  text,
  progress,
  range = [0, 1],
  className,
}: ScrollWordsProps) {
  const words = text.split(" ");
  const [start, end] = range;
  const total = words.length;

  return (
    <span className={className}>
      {words.map((word, i) => {
        const step = (end - start) / total;
        const wStart = start + i * step;
        const wEnd = Math.min(start + (i + 1) * step, end);
        return (
          <Word key={i} progress={progress} range={[wStart, wEnd]}>
            {word}
          </Word>
        );
      })}
    </span>
  );
}

