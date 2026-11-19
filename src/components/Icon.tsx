import React from "react";
import Image from "next/image";
import {
  Eye,
  Layers,
  ShieldCheck,
  RefreshCw,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Check,
  LucideProps,
} from "lucide-react";

export type IconName =
  | "eye"
  | "layers"
  | "shield-check"
  | "refresh-cw"
  | "plus"
  | "minus"
  | "arrow-up-right"
  | "arrow-right"
  | "menu"
  | "x"
  | "check";

interface IconProps extends LucideProps {
  name: IconName;
}

export function Icon({ name, size = 18, strokeWidth = 1.5, className, ...rest }: IconProps) {
  const props = { size, strokeWidth, className, ...rest };

  switch (name) {
    case "eye":
      return <Eye {...props} />;
    case "layers":
      return <Layers {...props} />;
    case "shield-check":
      return <ShieldCheck {...props} />;
    case "refresh-cw":
      return <RefreshCw {...props} />;
    case "plus":
      return <Plus {...props} />;
    case "minus":
      return <Minus {...props} />;
    case "arrow-up-right":
      return <ArrowUpRight {...props} />;
    case "arrow-right":
      return <ArrowRight {...props} />;
    case "menu":
      return <Menu {...props} />;
    case "x":
      return <X {...props} />;
    case "check":
      return <Check {...props} />;
    default:
      return null;
  }
}

export function BrandMark({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/favicon.svg"
      alt="Myco Logo"
      width={size}
      height={size}
      className={`rounded-[7px] object-contain ${className}`}
    />
  );
}

export function Wordmark({
  theme = "dark",
  className = "",
  oversized = false,
}: {
  theme?: "dark" | "light";
  className?: string;
  oversized?: boolean;
}) {
  const textColor = theme === "dark" ? "text-white" : "text-[#101614]";

  if (oversized) {
    return (
      <div className={`flex items-center gap-4 ${textColor} ${className}`}>
        <Image src="/favicon.svg" alt="" width={84} height={84} className="rounded-[18px] object-contain" />
        <span className="font-sans font-bold text-[clamp(44px,6.5vw,96px)] tracking-[-0.03em] leading-none select-none">
          Myco
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${textColor} ${className}`}>
      <Image src="/favicon.svg" alt="" width={34} height={34} className="rounded-[8px] object-contain" />
      <span className="font-sans font-semibold text-[20px] tracking-[-0.02em] leading-none select-none">
        Myco
      </span>
    </div>
  );
}
