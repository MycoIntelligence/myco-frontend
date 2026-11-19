import React from "react";
import { cn } from "@/lib/cn";

export type PillTone = "mint" | "dark" | "gray";

interface PillProps {
  tone?: PillTone;
  className?: string;
  children: React.ReactNode;
}

const toneStyles: Record<
  PillTone,
  { pill: string; dot: string; text: string }
> = {
  mint: {
    pill: "bg-[rgba(255,255,255,0.45)] border border-[rgba(255,255,255,0.5)]",
    dot: "bg-[#8a9aa5]",
    text: "text-[#071a1b]",
  },
  dark: {
    pill: "bg-[rgba(160,174,177,0.30)] border border-[rgba(203,225,227,0.18)]",
    dot: "bg-[#a0aeb1]",
    text: "text-[#cbe1df]",
  },
  gray: {
    pill: "bg-[rgba(7,26,27,0.05)] border border-[rgba(7,26,27,0.08)]",
    dot: "bg-[#8a9aa5]",
    text: "text-[#071a1b]",
  },
};

export function Pill({ tone = "mint", className, children }: PillProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 h-[27px] px-3 rounded-full font-mono text-[12px] uppercase tracking-[0.06em] whitespace-nowrap select-none",
        styles.pill,
        styles.text,
        className
      )}
    >
      <span
        className={cn("w-2 h-2 rounded-full shrink-0", styles.dot)}
        aria-hidden="true"
      />
      <span>{children}</span>
    </div>
  );
}

