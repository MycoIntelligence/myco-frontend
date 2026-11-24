import { MetadataRoute } from "next";
import { siteContent } from "@/lib/content";
import { articles } from "@/lib/articles";
import { features } from "@/src/marketing/feature-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteContent.brand.siteUrl;

  const routes = [
    "",
    "/why",
    "/workflow",
    "/pricing",
    "/faq",
    "/blog/myco-vs-coderabbit",
    "/security",
    "/contact",
    ...features.map(({ slug }) => `/features/${slug}`),
    "/book-demo",
    "/terms",
    "/privacy",
    ...articles.map((article) => `/blog/${article.slug}`),
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith("/blog") ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : route.startsWith("/blog/") ? 0.7 : 0.8,
  }));
}

