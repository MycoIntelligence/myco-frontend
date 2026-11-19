import React from "react";

interface PillProps {
  children: React.ReactNode;
  theme?: "dark" | "light";
  className?: string;
  dotColor?: string;
}

export function Pill({
  children,
  theme = "light",
  className = "",
  dotColor = "bg-[var(--accent)]",
}: PillProps) {
  const bgClass =
    theme === "dark"
      ? "bg-[rgba(255,255,255,0.08)] text-[var(--ink-on-dark)] border border-[rgba(255,255,255,0.12)]"
      : "bg-[rgba(10,31,31,0.07)] text-[var(--ink-on-light)] border border-[rgba(10,31,31,0.1)]";

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full select-none font-mono text-[11px] uppercase tracking-[0.04em] ${bgClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

