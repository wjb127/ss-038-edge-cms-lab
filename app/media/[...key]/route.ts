import { notFound } from "next/navigation";
import { bucket } from "@/lib/env";

// 같은 도메인에서 서빙되므로 HTML/SVG/스크립트성 content-type을 절대 그대로 내보내지 않는다.
const SAFE_SERVE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"]);

export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const object = await bucket().get(key.join("/"));
  if (!object) notFound();
  const stored = object.httpMetadata?.contentType ?? "";
  const contentType = SAFE_SERVE_TYPES.has(stored) ? stored : "application/octet-stream";
  return new Response(object.body, {
    headers: {
      "content-type": contentType,
      // 브라우저 MIME 스니핑 차단(stored XSS 방어의 마지막 보루)
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}
