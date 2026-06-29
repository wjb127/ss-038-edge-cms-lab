import type { MetadataRoute } from "next";
import { posts } from "@/lib/cms";
import { siteUrl } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  let published: Awaited<ReturnType<typeof posts>> = [];
  try {
    published = await posts(undefined, "published");
  } catch {
    published = [];
  }
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 }
  ];
  for (const item of published) {
    const path = item.type === "page" ? `/${item.slug}` : `/posts/${item.slug}`;
    entries.push({
      url: `${base}${path}`,
      lastModified: new Date(item.updated_at),
      changeFrequency: "weekly",
      priority: item.type === "page" ? 0.6 : 0.8
    });
  }
  return entries;
}
