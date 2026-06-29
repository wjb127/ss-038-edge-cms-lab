import { redirect } from "next/navigation";
import { db } from "@/lib/env";
import { clientIp, rateLimit, sameOrigin } from "@/lib/security";
import { backWithError, id, isFrameworkError, required } from "@/lib/util";

export async function POST(request: Request) {
  const form = await request.formData();
  const postId = form.get("post_id")?.toString() ?? "";
  const post = postId ? await db().prepare("SELECT slug FROM posts WHERE id = ?").bind(postId).first<{ slug: string }>() : null;
  const back = post ? `/posts/${post.slug}` : "/";

  // CSRF: cross-site 위조 제출 차단
  if (!sameOrigin(request)) redirect(backWithError(back, "잘못된 요청 출처입니다."));

  // 허니팟: 봇이 채우는 숨김 필드. 채워졌으면 성공한 척하고 조용히 버림.
  if ((form.get("website")?.toString() ?? "").trim() !== "") redirect(back);

  // Rate limit: IP당 10분에 5건
  const ip = clientIp(request);
  if (!(await rateLimit(`comment:${ip}`, 5, 600))) {
    redirect(backWithError(back, "잠시 후 다시 시도해 주세요."));
  }

  let target = back;
  try {
    const validPostId = required(form.get("post_id"), "post_id");
    const body = required(form.get("body"), "body");
    if (body.length > 5000) throw new Error("댓글이 너무 깁니다.");
    await db()
      .prepare("INSERT INTO comments(id, post_id, author_name, author_email, body, status) VALUES (?, ?, ?, ?, ?, 'pending')")
      .bind(
        id("cmt"),
        validPostId,
        required(form.get("author_name"), "author_name").slice(0, 120),
        required(form.get("author_email"), "author_email").slice(0, 200),
        body
      )
      .run();
    target = `${back}?submitted=1`;
  } catch (error) {
    if (isFrameworkError(error)) throw error;
    target = backWithError(back, (error as Error).message || "댓글 등록 실패");
  }
  redirect(target);
}
