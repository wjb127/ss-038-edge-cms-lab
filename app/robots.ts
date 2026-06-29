import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"]
    },
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
