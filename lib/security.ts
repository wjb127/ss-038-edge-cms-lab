import { db } from "@/lib/env";

// 업로드 허용 한도 (R2 비용/abuse 방지)
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

// 업로드 허용 MIME 화이트리스트 (magic byte로 실제 검증)
export const ALLOWED_UPLOAD_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"] as const;

// ── CSRF: Origin/Referer가 요청 호스트와 일치하는지 확인 ──────────────
// sameSite=lax 쿠키와 조합해 cross-site 위조 쓰기를 막는다.
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) return false;
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  // origin 헤더가 없는 일부 폼 제출은 referer로 폴백
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  // origin/referer 둘 다 없으면 거부 (정상 브라우저 폼 제출은 최소 referer를 보냄)
  return false;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// ── Rate limit: D1 고정창(fixed window) 카운터 ───────────────────────
// bucket = `${scope}:${ip}` 같은 키. limit 회 초과 시 false 반환.
export async function rateLimit(bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);
  const resetAt = new Date(windowStart + windowSeconds * 1000).toISOString();
  const key = `${bucket}:${windowStart}`;
  // 같은 창 키에 대해 카운트 증가 (UPSERT)
  await db()
    .prepare(
      "INSERT INTO rate_limits(bucket, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET count = count + 1"
    )
    .bind(key, resetAt)
    .run();
  const row = await db().prepare("SELECT count FROM rate_limits WHERE bucket = ?").bind(key).first<{ count: number }>();
  // 기회주의적 청소: 만료된 옛 창 정리 (확률적 — 매 호출마다 하면 낭비)
  if ((row?.count ?? 0) % 25 === 0) {
    await db().prepare("DELETE FROM rate_limits WHERE reset_at < ?").bind(new Date(now).toISOString()).run().catch(() => {});
  }
  return (row?.count ?? 0) <= limit;
}

// ── 업로드 magic byte 검증 ──────────────────────────────────────────
// 클라가 조작 가능한 file.type을 믿지 않고 실제 바이트 시그니처로 타입 판별.
// SVG는 stored XSS 벡터라 명시적으로 차단(이미지 화이트리스트에 미포함).
export function detectMimeByMagic(bytes: Uint8Array): string | null {
  const b = bytes;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  // JPEG: FF D8 FF
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  // GIF: 47 49 46 38
  if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  // WEBP: RIFF....WEBP
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return "image/webp";
  // PDF: 25 50 44 46 ("%PDF")
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  return null;
}
