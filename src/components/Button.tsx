import React from "react";
import Link from "next/link";
import { Icon } from "./Icon";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "nav-ink" | "nav-pill" | "text-link" | "outline";
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  theme?: "dark" | "light";
}

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  className = "",
  type = "button",
  disabled,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
  theme = "dark",
}: ButtonProps) {
  let baseClasses =
    "relative inline-flex items-center justify-center font-sans tracking-tight select-none transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-[3px] active:scale-[0.98]";

  if (variant === "primary") {
    baseClasses +=
      " h-[46px] px-7 rounded-full bg-black text-white text-[13px] font-medium hover:bg-neutral-900 border border-white/10 shadow-md group";
  } else if (variant === "nav-ink") {
    baseClasses +=
      " h-[38px] px-5 rounded-full bg-black text-white text-[12px] font-medium hover:bg-neutral-900 border border-white/10";
  } else if (variant === "nav-pill") {
    const pillBg =
      theme === "dark"
        ? "bg-white/[0.08] hover:bg-white/[0.14] text-[#dce8e4] border border-white/10"
        : "bg-black/[0.06] hover:bg-black/[0.10] text-[#16181c] border border-black/10";
    baseClasses += ` h-[38px] px-4 rounded-full backdrop-blur-[10px] text-[12px] font-medium ${pillBg}`;
  } else if (variant === "text-link") {
    baseClasses =
      "inline-flex items-center gap-1.5 font-sans font-medium text-[13px] tracking-normal text-link-underline pb-1 cursor-pointer";
  } else if (variant === "outline") {
    baseClasses +=
      " h-[44px] px-6 rounded-full border border-current text-[13px] font-medium hover:bg-black/5";
  }

  const content = (
    <>
      <span>{children}</span>
      {variant === "primary" && (
        <span className="inline-flex overflow-hidden w-0 group-hover:w-4 transition-all duration-180 opacity-0 group-hover:opacity-100 ml-0 group-hover:ml-1.5">
          <Icon name="arrow-right" size={14} />
        </span>
      )}
    </>
  );

  if (href) {
    if (href.startsWith("#") || href.startsWith("http")) {
      return (
        <a
          href={href}
          onClick={onClick}
          className={`${baseClasses} ${className}`}
          aria-label={ariaLabel}
          aria-expanded={ariaExpanded}
          aria-controls={ariaControls}
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`${baseClasses} ${className}`}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
    >
      {content}
    </button>
  );
}

