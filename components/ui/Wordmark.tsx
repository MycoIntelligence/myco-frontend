import React from "react";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="20" cy="20" r="6" fill="#0e946e" />
      <circle cx="20" cy="7" r="3" fill="currentColor" opacity="0.85" />
      <circle cx="32" cy="14" r="2.8" fill="currentColor" opacity="0.7" />
      <circle cx="31" cy="28" r="3" fill="#0e946e" opacity="0.9" />
      <circle cx="20" cy="33" r="2.8" fill="currentColor" opacity="0.85" />
      <circle cx="9" cy="28" r="3.2" fill="currentColor" opacity="0.75" />
      <circle cx="8" cy="14" r="2.8" fill="#0e946e" opacity="0.9" />
      <path
        d="M20 14 V10 M25 17 L29.5 15 M25 23 L28.5 26 M20 26 V30 M15 23 L11.5 26 M15 17 L10.5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

interface WordmarkProps {
  variant?: "header" | "footer";
  tone?: "light" | "dark";
  className?: string;
  markOnly?: boolean;
}

export function Wordmark({
  variant = "header",
  tone = "dark",
  className,
  markOnly = false,
}: WordmarkProps) {
  const textColor = tone === "dark" ? "text-white" : "text-[#16181c]";

  if (markOnly) {
    return (
      <span className={cn("inline-flex items-center", textColor, className)}>
        <LogoMark className="w-[28px] h-[28px]" />
      </span>
    );
  }

  if (variant === "footer") {
    return (
      <div className={cn("flex items-center gap-4 sm:gap-6", textColor, className)}>
        <LogoMark className="w-[60px] h-[60px] sm:w-[90px] sm:h-[90px] shrink-0" />
        <span className="font-serif italic font-semibold text-[clamp(44px,7vw,104px)] tracking-[-0.02em] leading-none select-none">
          M<span className="text-[#0e946e]">y</span>co
        </span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", textColor, className)}>
      <LogoMark className="w-[26px] h-[26px] shrink-0" />
      <span className="font-serif italic font-semibold text-[24px] sm:text-[26px] tracking-[-0.02em] leading-none select-none">
        M<span className="text-[#0e946e]">y</span>co
      </span>
    </div>
  );
}
