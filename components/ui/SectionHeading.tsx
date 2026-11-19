import React from "react";
import { Pill, PillTone } from "./Pill";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow: string;
  primary: string;
  muted?: string;
  aside?: string | React.ReactNode;
  tone?: "mint" | "gray" | "dark";
  asideOffset?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  primary,
  muted,
  aside,
  tone = "mint",
  asideOffset = "57%",
  className,
}: SectionHeadingProps) {
  const pillTone: PillTone =
    tone === "dark" ? "dark" : tone === "gray" ? "gray" : "mint";

  const primaryColor =
    tone === "dark" ? "text-[#cbe1df]" : "text-[#071a1b]";
  const mutedColor =
    tone === "dark" ? "text-[rgba(203,225,227,0.62)]" : "text-[rgba(7,26,27,0.55)]";
  const asideColor =
    tone === "dark" ? "text-[#738585]" : "text-[#44595a]";

  return (
    <header className={cn("relative section-heading mb-14", className)}>
      <div className="mb-7">
        <Pill tone={pillTone}>{eyebrow}</Pill>
      </div>
      <div className="relative">
        <h2 className="text-[clamp(34px,3.6vw,56px)] leading-[1.18] tracking-[-0.03em] font-normal [text-wrap:balance] max-w-[16ch] md:max-w-[20ch]">
          <span className={cn("inline", primaryColor)}>{primary}</span>
          {muted && (
            <>
              {" "}
              <span className={cn("inline", mutedColor)}>{muted}</span>
            </>
          )}
        </h2>

        {aside && (
          <div
            style={
              {
                "--aside-offset": asideOffset,
              } as React.CSSProperties
            }
            className={cn(
              "mt-5 max-w-[460px] text-[20px] leading-[1.4] tracking-[-0.005em] [text-wrap:pretty]",
              asideColor,
              "min-[900px]:absolute min-[900px]:top-1 min-[900px]:mt-0 min-[900px]:left-[var(--aside-offset)]"
            )}
          >
            {typeof aside === "string" ? <p>{aside}</p> : aside}
          </div>
        )}
      </div>
    </header>
  );
}

