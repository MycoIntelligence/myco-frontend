import React from "react";
import { SectionTheme } from "@/src/lib/theme";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id: string;
  "data-theme": SectionTheme;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  noPadding?: boolean;
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(function Section(
  {
    id,
    "data-theme": dataTheme,
    children,
    className = "",
    containerClassName = "",
    noPadding = false,
    ...rest
  },
  ref
) {
  const bgMap = {
    dark: "bg-[var(--bg-deep)] text-[var(--ink-on-dark)]",
    pale: "bg-[var(--bg-pale)] text-[var(--ink-on-light)]",
    paper: "bg-[var(--bg-paper)] text-[var(--ink-on-light)]",
  };

  const padClass = noPadding ? "" : "py-[clamp(96px,14vh,180px)]";

  return (
    <section
      ref={ref}
      id={id}
      data-theme={dataTheme}
      className={`relative w-full overflow-hidden ${bgMap[dataTheme]} ${padClass} ${className}`}
      {...rest}
    >
      <div
        className={`w-full max-w-[1440px] mx-auto px-[clamp(20px,2.5vw,40px)] ${containerClassName}`}
      >
        {children}
      </div>
    </section>
  );
});
