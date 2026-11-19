"use client";

import React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Wordmark } from "@/components/ui/Wordmark";
import { NavPill } from "@/components/ui/NavPill";
import { Button } from "@/components/ui/Button";
import { ResourcesMenu } from "./ResourcesMenu";
import { siteContent } from "@/lib/content";
import { NavTheme } from "@/hooks/useNavTheme";
import { useLenis } from "./SmoothScroll";
import { cn } from "@/lib/cn";

interface NavLayerProps {
  theme: NavTheme;
  interactive: boolean;
  onOpenMobileMenu: () => void;
  onResourcesOpenChange?: (open: boolean) => void;
  style?: React.CSSProperties;
  className?: string;
  isHeaderHidden?: boolean;
}

export function NavLayer({
  theme,
  interactive,
  onOpenMobileMenu,
  onResourcesOpenChange,
  style,
  className,
  isHeaderHidden = false,
}: NavLayerProps) {
  const { scrollTo } = useLenis();

  const handleWordmarkClick = (e: React.MouseEvent) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      scrollTo(0);
    }
  };

  return (
    <div
      aria-hidden={!interactive}
      inert={!interactive ? true : undefined}
      style={style}
      className={cn(
        "absolute inset-0 h-[64px] flex items-center justify-between px-4 sm:px-9 pointer-events-none transition-all duration-[250ms]",
        className
      )}
    >
      {/* Left wordmark */}
      <div
        className={cn(
          "transition-all duration-[250ms]",
          isHeaderHidden && "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <Link
          href="/"
          onClick={handleWordmarkClick}
          aria-label="Myco Home"
          tabIndex={interactive ? 0 : -1}
          className="pointer-events-auto inline-flex items-center"
        >
          <Wordmark variant="header" tone={theme} />
        </Link>
      </div>

      {/* Right pill group */}
      <div className="flex items-center gap-[2px]">
        {/* Desktop links */}
        <div
          className={cn(
            "hidden min-[900px]:flex items-center gap-[2px] transition-all duration-[250ms]",
            isHeaderHidden && "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <NavPill
            href={siteContent.nav.why.href}
            theme={theme}
            tabIndex={interactive ? 0 : -1}
          >
            {siteContent.nav.why.label}
          </NavPill>

          <ResourcesMenu
            theme={theme}
            interactive={interactive}
            onOpenChange={onResourcesOpenChange}
          />

          <NavPill
            href={siteContent.nav.pricing.href}
            theme={theme}
            tabIndex={interactive ? 0 : -1}
          >
            {siteContent.nav.pricing.label}
          </NavPill>

          <NavPill
            href={`${siteContent.brand.appUrl}/login`}
            theme={theme}
            tabIndex={interactive ? 0 : -1}
          >
            {siteContent.nav.signIn.label}
          </NavPill>
        </div>

        {/* Mobile MENU button */}
        <div
          className={cn(
            "flex min-[900px]:hidden items-center mr-1 transition-all duration-[250ms]",
            isHeaderHidden && "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <NavPill
            theme={theme}
            onClick={onOpenMobileMenu}
            tabIndex={interactive ? 0 : -1}
            prefixIcon={<Menu size={14} strokeWidth={1.5} absoluteStrokeWidth />}
          >
            {siteContent.nav.menu}
          </NavPill>
        </div>

        {/* Book button: stays visible on scroll-down hide! */}
        <div className="pointer-events-auto ml-1">
          <Button
            variant="black"
            href={siteContent.nav.book.href}
            tabIndex={interactive ? 0 : -1}
            className="h-[32px] px-3.5 text-[11.5px]"
          >
            {siteContent.nav.book.label}
          </Button>
        </div>
      </div>
    </div>
  );
}
