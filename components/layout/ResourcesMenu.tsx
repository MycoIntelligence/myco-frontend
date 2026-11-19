"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { siteContent } from "@/lib/content";
import { cn } from "@/lib/cn";
import { NavTheme } from "@/hooks/useNavTheme";

interface ResourcesMenuProps {
  theme: NavTheme;
  interactive: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResourcesMenu({
  theme,
  interactive,
  onOpenChange,
}: ResourcesMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setMenuOpen = React.useCallback(
    (val: boolean) => {
      setOpen(val);
      onOpenChange?.(val);
    },
    [onOpenChange]
  );

  const handleMouseEnter = () => {
    if (!interactive) return;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setMenuOpen(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setMenuOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [open, setMenuOpen]);

  const pillThemeClasses =
    theme === "dark"
      ? "bg-[rgba(255,255,255,0.10)] text-[#e6f0f0] hover:bg-[rgba(255,255,255,0.16)]"
      : "bg-[rgba(7,26,27,0.08)] text-[#071a1b] hover:bg-[rgba(7,26,27,0.14)]";

  const panelThemeClasses =
    theme === "dark"
      ? "bg-[rgba(7,26,27,0.92)] border-[rgba(203,225,227,0.22)] text-[#e6f0f0]"
      : "bg-[rgba(243,248,248,0.92)] border-[rgba(7,26,27,0.12)] text-[#071a1b]";

  const itemHoverClasses =
    theme === "dark"
      ? "hover:bg-[rgba(255,255,255,0.10)]"
      : "hover:bg-[rgba(7,26,27,0.08)]";

  return (
    <div
      className="relative pointer-events-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="resources-dropdown-panel"
        onClick={() => interactive && setMenuOpen(!open)}
        tabIndex={interactive ? 0 : -1}
        className={cn(
          "group relative inline-flex items-center justify-center h-[32px] px-3 rounded-[6px] backdrop-blur-[10px] font-mono text-[11.5px] uppercase tracking-[0.05em] whitespace-nowrap transition-colors duration-[180ms] select-none cursor-pointer",
          pillThemeClasses,
          open && (theme === "dark" ? "bg-[rgba(255,255,255,0.16)]" : "bg-[rgba(7,26,27,0.14)]")
        )}
      >
        <span
          className={cn(
            "mr-2 inline-flex items-center transition-transform duration-[180ms]",
            open ? "rotate-45" : "rotate-0"
          )}
          aria-hidden="true"
        >
          <Plus size={14} strokeWidth={1.5} absoluteStrokeWidth />
        </span>
        <span className="relative block h-[16px] overflow-hidden leading-[16px]">
          <span className="block transition-transform duration-[420ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transform-none">
            {siteContent.nav.resources.label}
          </span>
          <span
            aria-hidden="true"
            className="block absolute top-full left-0 transition-transform duration-[420ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transform-none"
          >
            {siteContent.nav.resources.label}
          </span>
        </span>
      </button>

      {open && interactive && (
        <div
          id="resources-dropdown-panel"
          ref={menuRef}
          role="menu"
          aria-label="Resources"
          className={cn(
            "absolute top-[40px] right-0 min-w-[184px] p-1.5 rounded-[12px] border backdrop-blur-[16px] shadow-lg z-[60] transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] animate-in fade-in-0 slide-in-from-top-1.5",
            panelThemeClasses
          )}
        >
          {siteContent.nav.resourcesDropdown.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center h-[34px] px-3 rounded-[8px] font-mono text-[12px] uppercase tracking-[0.05em] transition-colors duration-[180ms]",
                itemHoverClasses
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
