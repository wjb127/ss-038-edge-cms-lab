import { settings } from "@/lib/cms";

// SEO/사이트맵/OG의 절대 URL 기준. settings.site_url가 우선, 없으면 배포 도메인.
export const FALLBACK_SITE_URL = "https://ss-038-edge-cms-lab.seungbeen-dev.workers.dev";

export async function siteUrl(): Promise<string> {
  try {
    const s = await settings();
    return (s.site_url || FALLBACK_SITE_URL).replace(/\/+$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}

// excerpt/본문에서 meta description 길이로 자른다.
export function clip(value: string, max = 160): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
