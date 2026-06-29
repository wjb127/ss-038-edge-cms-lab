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
