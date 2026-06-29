import { redirect } from "next/navigation";

export function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function slugify(value: string) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || crypto.randomUUID().slice(0, 8);
}

export function required(value: FormDataEntryValue | null, name: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

export function canWrite(role: string) {
  return role === "admin" || role === "editor" || role === "author";
}

export function canAdmin(role: string) {
  return role === "admin";
}

export function requireWrite(role: string) {
  if (!canWrite(role)) redirect("/admin");
}

export function requireAdmin(role: string) {
  if (!canAdmin(role)) redirect("/admin");
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Next의 redirect()/notFound()는 특수 에러를 throw한다. try/catch 에러 UX에서
// 이걸 일반 에러로 오인해 삼키지 않도록 식별한다.
export function isFrameworkError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("digest" in error)) return false;
  const digest = String((error as { digest?: unknown }).digest ?? "");
  return digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND";
}

// 검증 실패 시 폼으로 되돌리며 ?error= 메시지를 붙인다(맨 500 대신 피드백).
export function backWithError(path: string, message: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}error=${encodeURIComponent(message)}`;
}
