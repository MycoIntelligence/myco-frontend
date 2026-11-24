import React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function PartnerLogo({ name }: { name: string }) {
  switch (name) {
    case "Stratus":
      return (
        <span className="font-sans font-bold text-[17px] tracking-[-0.04em] select-none">
          Stratus
        </span>
      );
    case "PYLON":
      return (
        <span className="font-brand font-semibold text-[15px] tracking-[0.2em] select-none">
          PYLON
        </span>
      );
    case "kiln/":
      return (
        <span className="font-mono font-semibold text-[15px] tracking-tight select-none">
          kiln/
        </span>
      );
    case "Halyard":
      return (
        <span className="inline-flex items-center gap-2 font-sans font-medium text-[15px] tracking-normal select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-current inline-block shrink-0" />
          Halyard
        </span>
      );
    case "GRIDWORKS":
      return (
        <span className="inline-flex items-center gap-2 font-brand font-semibold text-[13px] tracking-[0.14em] select-none">
          <svg
            viewBox="0 0 12 12"
            className="w-3 h-3 fill-current shrink-0"
            aria-hidden="true"
          >
            <circle cx="2" cy="2" r="1.2" />
            <circle cx="6" cy="2" r="1.2" />
            <circle cx="10" cy="2" r="1.2" />
            <circle cx="2" cy="6" r="1.2" />
            <circle cx="6" cy="6" r="1.2" />
            <circle cx="10" cy="6" r="1.2" />
            <circle cx="2" cy="10" r="1.2" />
            <circle cx="6" cy="10" r="1.2" />
            <circle cx="10" cy="10" r="1.2" />
          </svg>
          GRIDWORKS
        </span>
      );
    case "northfield":
      return (
        <span className="font-sans font-semibold text-[15px] tracking-normal lowercase select-none">
          northfield
        </span>
      );
    case "Pinecrest":
      return (
        <span className="inline-flex items-center gap-1.5 font-sans font-medium text-[15px] tracking-normal select-none">
          <svg
            viewBox="0 0 10 10"
            className="w-2.5 h-2.5 fill-current shrink-0"
            aria-hidden="true"
          >
            <polygon points="5,1 9,9 1,9" />
          </svg>
          Pinecrest
        </span>
      );
    case "VANTAGE":
      return (
        <span className="font-mono font-semibold text-[13px] tracking-[0.12em] select-none">
          VANTAGE
        </span>
      );
    case "GitHub":
      return (
        <span className="inline-flex items-center gap-1.5 font-sans font-semibold text-[15px] select-none text-[#16181c]">
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current shrink-0" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </span>
      );
    case "Slack":
      return (
        <span className="inline-flex items-center gap-1.5 font-sans font-bold text-[15px] select-none text-[#16181c]">
          <span className="w-2 h-2 rounded-full bg-[#0e946e]" />
          Slack
        </span>
      );
    case "Jira":
      return (
        <span className="inline-flex items-center gap-1.5 font-sans font-semibold text-[15px] select-none text-[#16181c]">
          Jira
        </span>
      );
    case "SOC 2 Type II":
      return (
        <span className="font-mono text-[12px] font-semibold text-[#16181c] select-none tracking-wide">
          SOC 2 Type II
        </span>
      );
    case "Zero Training":
      return (
        <span className="font-mono text-[11px] font-medium text-[#0a7c5c] select-none">
          Zero Training
        </span>
      );
    case "Tenant Isolation":
      return (
        <span className="font-mono text-[11px] font-medium text-[#16181c] select-none">
          Tenant Isolation
        </span>
      );
    case "Read-Only AST":
      return (
        <span className="font-mono text-[11px] font-medium text-[#16181c] select-none">
          Read-Only AST
        </span>
      );
    default:
      return <span className="font-mono text-[13px]">{name}</span>;
  }
}

interface LogoCardProps {
  name: string;
  href?: string;
  className?: string;
}

export function LogoCard({ name, href, className }: LogoCardProps) {
  const cardClasses = cn(
    "relative flex items-center justify-center w-[140px] h-[60px] rounded-[14px] bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.38)] backdrop-blur-[6px] text-[#071a1b] transition-all duration-[180ms] hover:bg-[rgba(255,255,255,0.30)] hover:-translate-y-[2px]",
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cardClasses}
        aria-label={name}
        target="_blank"
        rel="noopener noreferrer"
      >
        <PartnerLogo name={name} />
      </Link>
    );
  }

  return (
    <div className={cardClasses} aria-label={name} role="img">
      <PartnerLogo name={name} />
    </div>
  );
}

