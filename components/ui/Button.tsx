"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "glass" | "inverse" | "black";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#2f3f3f] text-[#e8f1f1] hover:bg-[#071a1b] border border-transparent",
  glass:
    "bg-[rgba(30,46,45,0.86)] backdrop-blur-[8px] text-[#e8f1f1] hover:bg-[rgba(7,26,27,0.95)] border border-[rgba(203,225,227,0.18)]",
  inverse:
    "bg-[#cbe1df] text-[#071a1b] hover:bg-[#ffffff] border border-transparent",
  black:
    "bg-[#000000] text-[#ffffff] hover:bg-[#16201f] border border-transparent",
};

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(
  {
    variant = "primary",
    href,
    loading = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref
) {
  const isExternal = href?.startsWith("http");
  const baseClasses = cn(
    "group relative inline-flex items-center justify-center h-[34px] px-4 rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] whitespace-nowrap select-none transition-colors duration-[180ms] active:scale-[0.98] cursor-pointer",
    variantStyles[variant],
    (disabled || loading) && "opacity-50 pointer-events-none cursor-not-allowed",
    className
  );

  const content = loading ? (
    <div
      className="inline-flex items-center gap-1.5"
      role="status"
      aria-label="Loading"
    >
      <span className="w-[10px] h-[2px] bg-current rounded-full animate-pulse [animation-delay:0ms]" />
      <span className="w-[10px] h-[2px] bg-current rounded-full animate-pulse [animation-delay:120ms]" />
      <span className="w-[10px] h-[2px] bg-current rounded-full animate-pulse [animation-delay:240ms]" />
    </div>
  ) : (
    <span className="relative block h-[18px] overflow-hidden leading-[18px]">
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
  );

  if (href) {
    return (
      <Link
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={baseClasses}
        aria-disabled={disabled || loading}
      >
        {content}
        {isExternal && <span className="sr-only"> (opens in new tab)</span>}
      </Link>
    );
  }

  return (
    <button
      type="button"
      ref={ref as React.Ref<HTMLButtonElement>}
      disabled={disabled || loading}
      className={baseClasses}
      {...props}
    >
      {content}
    </button>
  );
});

