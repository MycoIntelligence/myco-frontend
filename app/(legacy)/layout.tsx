import type { Metadata, Viewport } from "next";
import { SmoothScrollProvider } from "@/src/components/SmoothScrollProvider";
import { MycoAssistant } from "@/src/components/MycoAssistant";
import { siteContent } from "@/src/lib/content";
import "./globals.css";
import "@/src/styles/tokens.css";
import "@/src/styles/base.css";
import "@/src/styles/motion.css";
import "./myco-redesign.css";
import "@/src/styles/journey.css";
import "@/src/styles/playground.css";
import "@/src/styles/connected-workflow.css";
import "@/src/styles/cinematic-polish.css";

export const metadata: Metadata = {
  title: siteContent.meta.title,
  description: siteContent.meta.description,
  metadataBase: new URL(siteContent.brand.url),
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: siteContent.meta.title,
    description: siteContent.meta.description,
    url: siteContent.brand.url,
    siteName: siteContent.brand.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteContent.meta.title,
    description: siteContent.meta.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#051414",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteContent.brand.url}/#organization`,
        name: siteContent.brand.name,
        url: siteContent.brand.url,
        logo: `${siteContent.brand.url}/favicon.svg`,
        description: siteContent.meta.description,
      },
      {
        "@type": "WebSite",
        "@id": `${siteContent.brand.url}/#website`,
        url: siteContent.brand.url,
        name: siteContent.brand.name,
        publisher: {
          "@id": `${siteContent.brand.url}/#organization`,
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined") {
                window.addEventListener("unhandledrejection", function(event) {
                  if (!event.reason || event.reason instanceof Event || (typeof event.reason === "object" && ("isTrusted" in event.reason || "target" in event.reason))) {
                    event.preventDefault();
                  }
                });
              }
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[var(--bg-pale)] text-[var(--ink-on-light)]">
        <SmoothScrollProvider>
          {children}
          <MycoAssistant />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
