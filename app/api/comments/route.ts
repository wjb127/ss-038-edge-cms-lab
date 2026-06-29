import { redirect } from "next/navigation";
import { db } from "@/lib/env";
import { id, required } from "@/lib/util";

export async function POST(request: Request) {
  const form = await request.formData();
  const postId = required(form.get("post_id"), "post_id");
  await db()
    .prepare("INSERT INTO comments(id, post_id, author_name, author_email, body, status) VALUES (?, ?, ?, ?, ?, 'pending')")
    .bind(id("cmt"), postId, required(form.get("author_name"), "author_name"), required(form.get("author_email"), "author_email"), required(form.get("body"), "body"))
    .run();
  const post = await db().prepare("SELECT slug FROM posts WHERE id = ?").bind(postId).first<{ slug: string }>();
  redirect(post ? `/posts/${post.slug}` : "/");
}
