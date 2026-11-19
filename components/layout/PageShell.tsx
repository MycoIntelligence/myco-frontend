import React from "react";
import { Pill } from "@/components/ui/Pill";
import { Nav } from "@/src/components/Nav";
import { CtaFooter } from "@/src/components/CtaFooter";
import { cn } from "@/lib/cn";

interface PageShellProps {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageShell({
  eyebrow,
  title,
  lead,
  children,
  className,
}: PageShellProps) {
  return (
    <>
      <Nav />
      <main
        id="main"
        data-theme="pale"
        className={cn(
          "relative min-h-[100svh] bg-[#f4f4f2] text-[#16181c] pt-[140px] pb-24 px-5 sm:px-9 lg:px-[clamp(20px,7vw,120px)]",
          className
        )}
      >
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <div className="mb-6">
            <Pill tone="mint">{eyebrow}</Pill>
          </div>
          <h1 className="font-sans text-[clamp(36px,4.8vw,76px)] font-medium leading-[1.05] tracking-[-0.03em] text-[#16181c] max-w-[18ch] [text-wrap:balance]">
            {title}
          </h1>
          {lead && (
            <p className="mt-6 text-[20px] leading-[1.4] text-[#46534d] max-w-[620px] [text-wrap:pretty]">
              {lead}
            </p>
          )}
          {children && <div className="mt-14">{children}</div>}
        </div>
      </main>
      <CtaFooter />
    </>
  );
}
