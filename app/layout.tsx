import type { Metadata } from "next";
import { settings } from "@/lib/cms";
import { FALLBACK_SITE_URL, siteUrl } from "@/lib/site";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Edge CMS Lab";
  let description = "Cloudflare-native CMS";
  let base = FALLBACK_SITE_URL;
  try {
    const [site, url] = await Promise.all([settings(), siteUrl()]);
    title = site.site_title || title;
    description = site.site_description || description;
    base = url;
  } catch {
    // 빌드/정적 분석 단계에서 바인딩이 없으면 폴백 사용
  }
  return {
    metadataBase: new URL(base),
    title: { default: title, template: `%s — ${title}` },
    description,
    openGraph: { siteName: title, type: "website" }
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
