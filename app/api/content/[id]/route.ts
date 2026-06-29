import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { canWrite, required } from "@/lib/util";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  const { id } = await params;
  const form = await request.formData();
  const status = required(form.get("status"), "status");
  const now = new Date().toISOString();
  await db()
    .prepare(
      "UPDATE posts SET title = ?, slug = ?, excerpt = ?, content_json = ?, content_html = ?, status = ?, updated_at = ?, published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN ? ELSE published_at END WHERE id = ?"
    )
    .bind(
      required(form.get("title"), "title"),
      required(form.get("slug"), "slug").toLowerCase(),
      form.get("excerpt")?.toString() ?? "",
      form.get("content_json")?.toString() ?? "{}",
      form.get("content_html")?.toString() ?? "",
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
  redirect(`/admin/content/${id}`);
}
