import React from "react";
import { cn } from "@/lib/cn";

interface GrainProps {
  opacity?: number;
  className?: string;
}

export function Grain({ opacity = 0.12, className }: GrainProps) {
  return (
    <div
      aria-hidden="true"
      style={{ "--grain-opacity": opacity } as React.CSSProperties}
      className={cn(
        "pointer-events-none absolute inset-0 z-[2] grain",
        className
      )}
    />
  );
}

