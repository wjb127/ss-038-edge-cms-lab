import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { uniqueSlug } from "@/lib/cms";
import { db } from "@/lib/env";
import { safeRevalidate } from "@/lib/revalidate";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { sameOrigin } from "@/lib/security";
import { backWithError, canWrite, isFrameworkError, required, slugify } from "@/lib/util";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  const { id } = await params;
  if (!sameOrigin(request)) redirect(backWithError(`/admin/content/${id}`, "잘못된 요청 출처입니다."));
  const form = await request.formData();
  let target = `/admin/content/${id}`;
  try {
    const status = required(form.get("status"), "status");
    const title = required(form.get("title"), "title");
    const slug = await uniqueSlug(slugify(required(form.get("slug"), "slug").toLowerCase()), id);
    const now = new Date().toISOString();
    const prev = await db().prepare("SELECT slug FROM posts WHERE id = ?").bind(id).first<{ slug: string }>();
    await db()
      .prepare(
        "UPDATE posts SET title = ?, slug = ?, excerpt = ?, content_json = ?, content_html = ?, status = ?, updated_at = ?, published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN ? ELSE published_at END WHERE id = ?"
      )
      .bind(
        title,
        slug,
        form.get("excerpt")?.toString() ?? "",
        form.get("content_json")?.toString() ?? "{}",
        sanitizeContentHtml(form.get("content_html")?.toString() ?? ""),
        status,
        now,
        status,
        now,
        id
      )
      .run();
    await db().prepare("DELETE FROM term_relationships WHERE post_id = ?").bind(id).run();
    for (const termId of form.getAll("term_ids").map(String)) {
      await db().prepare("INSERT OR IGNORE INTO term_relationships(post_id, term_id) VALUES (?, ?)").bind(id, termId).run();
    }
    const paths = ["/", `/posts/${slug}`, `/${slug}`];
    if (prev?.slug && prev.slug !== slug) paths.push(`/posts/${prev.slug}`, `/${prev.slug}`);
    safeRevalidate(paths);
    target = `/admin/content/${id}`;
  } catch (error) {
    if (isFrameworkError(error)) throw error;
    target = backWithError(`/admin/content/${id}`, (error as Error).message || "저장 실패");
  }
  redirect(target);
}
