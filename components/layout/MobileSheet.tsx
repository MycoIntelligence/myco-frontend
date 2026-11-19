"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, Plus, ChevronDown } from "lucide-react";
import { Wordmark } from "@/components/ui/Wordmark";
import { Button } from "@/components/ui/Button";
import { Grain } from "@/components/ui/Grain";
import { StreakTexture } from "@/components/ui/StreakTexture";
import { siteContent } from "@/lib/content";
import { useLenis } from "./SmoothScroll";
import { cn } from "@/lib/cn";

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function MobileSheet({ open, onClose, triggerRef }: MobileSheetProps) {
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { stop, start } = useLenis();

  useEffect(() => {
    if (open) {
      stop();
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
    } else {
      start();
      document.body.style.overflow = "";
      triggerRef?.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, stop, start, triggerRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="fixed inset-0 z-[80] bg-[#061a1e] flex flex-col justify-between p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto"
    >
      <StreakTexture tone="dark" density={0.8} parallax={false} />
      <Grain opacity={0.12} />

      <div className="relative z-10 flex items-center justify-between h-14">
        <Link href="/" onClick={onClose} aria-label="Myco Home">
          <Wordmark variant="header" tone="dark" />
        </Link>
        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close menu"
          className="p-2 text-[#cbe1df] hover:text-white transition-colors cursor-pointer"
        >
          <X size={24} strokeWidth={1.5} absoluteStrokeWidth />
        </button>
      </div>

      <nav className="relative z-10 flex flex-col gap-6 my-10" aria-label="Mobile navigation">
        <Link
          href={siteContent.nav.why.href}
          onClick={onClose}
          className="font-sans text-[clamp(32px,8vw,44px)] font-normal leading-[1.05] tracking-[-0.03em] text-[#cbe1df] hover:text-white transition-colors"
        >
          {siteContent.nav.why.label}
        </Link>

        <div>
          <button
            type="button"
            onClick={() => setResourcesOpen(!resourcesOpen)}
            className="flex items-center justify-between w-full font-sans text-[clamp(32px,8vw,44px)] font-normal leading-[1.05] tracking-[-0.03em] text-[#cbe1df] hover:text-white transition-colors text-left"
          >
            <span>{siteContent.nav.resources.label}</span>
            <ChevronDown
              size={24}
              strokeWidth={1.5}
              className={cn(
                "transition-transform duration-300",
                resourcesOpen && "rotate-180"
              )}
            />
          </button>
          {resourcesOpen && (
            <div className="flex flex-col gap-3 pl-4 mt-4 border-l border-[rgba(203,225,227,0.2)]">
              {siteContent.nav.resourcesDropdown.map((sub) => (
                <Link
                  key={sub.href}
                  href={sub.href}
                  onClick={onClose}
                  className="font-mono text-[18px] uppercase tracking-[0.05em] text-[rgba(203,225,227,0.7)] hover:text-white transition-colors py-1"
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          href={siteContent.nav.pricing.href}
          onClick={onClose}
          className="font-sans text-[clamp(32px,8vw,44px)] font-normal leading-[1.05] tracking-[-0.03em] text-[#cbe1df] hover:text-white transition-colors"
        >
          {siteContent.nav.pricing.label}
        </Link>

        <a
          href={`${siteContent.brand.appUrl}/login`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="font-sans text-[clamp(32px,8vw,44px)] font-normal leading-[1.05] tracking-[-0.03em] text-[#cbe1df] hover:text-white transition-colors"
        >
          {siteContent.nav.signIn.label}
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      </nav>

      <div className="relative z-10 mt-auto pt-6">
        <Button
          variant="inverse"
          href={siteContent.nav.book.href}
          onClick={onClose}
          className="w-full h-[48px] text-[13px]"
        >
          {siteContent.nav.book.label}
        </Button>
      </div>
    </div>
  );
}

