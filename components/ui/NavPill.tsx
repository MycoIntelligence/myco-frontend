"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface NavPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  theme?: "dark" | "light";
  active?: boolean;
  prefixIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const NavPill = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  NavPillProps
>(function NavPill(
  {
    href,
    theme = "dark",
    active = false,
    prefixIcon,
    className,
    children,
    ...props
  },
  ref
) {
  const isExternal = href?.startsWith("http");

  const themeClasses =
    theme === "dark"
      ? cn(
          "bg-[rgba(255,255,255,0.10)] text-[#e6f0f0] hover:bg-[rgba(255,255,255,0.16)]",
          active && "bg-[rgba(255,255,255,0.16)]"
        )
      : cn(
          "bg-[rgba(7,26,27,0.08)] text-[#071a1b] hover:bg-[rgba(7,26,27,0.14)]",
          active && "bg-[rgba(7,26,27,0.14)]"
        );

  const baseClasses = cn(
    "group pointer-events-auto relative inline-flex items-center justify-center h-[32px] px-3 rounded-[6px] backdrop-blur-[10px] font-mono text-[11.5px] uppercase tracking-[0.05em] whitespace-nowrap transition-colors duration-[180ms] select-none cursor-pointer",
    themeClasses,
    className
  );

  const innerContent = (
    <>
      {prefixIcon && (
        <span className="mr-2 inline-flex items-center" aria-hidden="true">
          {prefixIcon}
        </span>
      )}
      <span className="relative block h-[16px] overflow-hidden leading-[16px]">
        <span className="block transition-transform duration-[420ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transform-none">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="block absolute top-full left-0 transition-transform duration-[420ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transform-none"
        >
          {children}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={baseClasses}
        aria-current={active ? "page" : undefined}
      >
        {innerContent}
        {isExternal && <span className="sr-only"> (opens in new tab)</span>}
      </Link>
    );
  }

  return (
    <button
      type="button"
      ref={ref as React.Ref<HTMLButtonElement>}
      className={baseClasses}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      {innerContent}
    </button>
  );
});

