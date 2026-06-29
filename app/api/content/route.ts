import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { uniqueSlug } from "@/lib/cms";
import { db } from "@/lib/env";
import { safeRevalidate } from "@/lib/revalidate";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { sameOrigin } from "@/lib/security";
import { backWithError, canWrite, id, isFrameworkError, required, slugify } from "@/lib/util";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  if (!sameOrigin(request)) redirect(backWithError("/admin/content/new", "잘못된 요청 출처입니다."));
  const form = await request.formData();
  const type = form.get("type")?.toString() || "post";
  let target = `/admin/content/new?type=${encodeURIComponent(type)}`;
  try {
    const title = required(form.get("title"), "title");
    const status = required(form.get("status"), "status");
    const baseSlug = (form.get("slug")?.toString().trim() || slugify(title)).toLowerCase();
    const slug = await uniqueSlug(slugify(baseSlug));
    const postId = id("pst");
    const now = new Date().toISOString();
    await db()
      .prepare(
        "INSERT INTO posts(id, type, slug, title, excerpt, content_json, content_html, status, author_id, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        postId,
        type,
        slug,
        title,
        form.get("excerpt")?.toString() ?? "",
        form.get("content_json")?.toString() ?? "{}",
        sanitizeContentHtml(form.get("content_html")?.toString() ?? ""),
        status,
        user.id,
        now,
        status === "published" ? now : null
      )
      .run();
    const termIds = form.getAll("term_ids").map(String);
    for (const termId of termIds) {
      await db().prepare("INSERT OR IGNORE INTO term_relationships(post_id, term_id) VALUES (?, ?)").bind(postId, termId).run();
    }
    if (status === "published") safeRevalidate(["/", `/posts/${slug}`, `/${slug}`]);
    target = `/admin/content/${postId}`;
  } catch (error) {
    if (isFrameworkError(error)) throw error;
    target = backWithError(`/admin/content/new?type=${encodeURIComponent(type)}`, (error as Error).message || "저장 실패");
  }
  redirect(target);
}
