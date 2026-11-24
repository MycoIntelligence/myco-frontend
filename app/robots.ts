import { MetadataRoute } from "next";
import { siteContent } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteContent.brand.siteUrl}/sitemap.xml`,
  };
}

