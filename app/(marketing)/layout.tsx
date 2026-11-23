import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/src/marketing/preview.css";

export const metadata: Metadata = {
  title: { default: "Myco | Software Quality Infrastructure", template: "%s | Myco" },
  description: "Review GitHub pull requests against product requirements and see which changes could break before you ship.",
  icons: { icon: "/marketing/myco-mark.png" },
};

export const viewport: Viewport = { themeColor: "#0b0c0e" };

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
