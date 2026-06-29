import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { canWrite, id, required, slugify } from "@/lib/util";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  const form = await request.formData();
  const title = required(form.get("title"), "title");
  const type = required(form.get("type"), "type");
  const status = required(form.get("status"), "status");
  const slug = (form.get("slug")?.toString().trim() || slugify(title)).toLowerCase();
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
      form.get("content_html")?.toString() ?? "",
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
  redirect(`/admin/content/${postId}`);
}
