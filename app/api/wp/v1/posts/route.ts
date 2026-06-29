import { NextResponse } from "next/server";
import { uniqueSlug } from "@/lib/cms";
import { db } from "@/lib/env";
import { safeRevalidate } from "@/lib/revalidate";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { id, slugify } from "@/lib/util";

// 헤드리스 쓰기 인증: settings.api_token과 Bearer 토큰 비교(상수시간).
async function authorized(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return false;
  const row = await db().prepare("SELECT value FROM settings WHERE key = 'api_token'").first<{ value: string }>();
  const expected = row?.value ?? "";
  if (!expected) return false; // 토큰 미설정 = 쓰기 API 비활성
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i += 1) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// GET: 발행된 포스트 목록(페이지네이션). ?page=1&per_page=10
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page")) || 10));
  const offset = (page - 1) * perPage;
  const totalRow = await db()
    .prepare("SELECT COUNT(*) AS total FROM posts WHERE type = 'post' AND status = 'published'")
    .first<{ total: number }>();
  const total = totalRow?.total ?? 0;
  const rows = await db()
    .prepare("SELECT * FROM posts WHERE type = 'post' AND status = 'published' ORDER BY published_at DESC LIMIT ? OFFSET ?")
    .bind(perPage, offset)
    .all();
  return NextResponse.json(rows.results, {
    headers: {
      "x-wp-total": String(total),
      "x-wp-totalpages": String(Math.max(1, Math.ceil(total / perPage)))
    }
  });
}

// POST: 헤드리스 글 작성/발행. Authorization: Bearer <api_token>
export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const status = body.status === "published" ? "published" : "draft";
  const author = await db().prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1").first<{ id: string }>();
  if (!author) return NextResponse.json({ error: "No author available" }, { status: 409 });
  const slug = await uniqueSlug(slugify(typeof body.slug === "string" && body.slug ? body.slug : title));
  const postId = id("pst");
  const now = new Date().toISOString();
  const contentHtml = sanitizeContentHtml(typeof body.content_html === "string" ? body.content_html : "");
  await db()
    .prepare(
      "INSERT INTO posts(id, type, slug, title, excerpt, content_json, content_html, status, author_id, updated_at, published_at) VALUES (?, 'post', ?, ?, ?, '{}', ?, ?, ?, ?, ?)"
    )
    .bind(
      postId,
      slug,
      title,
      typeof body.excerpt === "string" ? body.excerpt : "",
      contentHtml,
      status,
      author.id,
      now,
      status === "published" ? now : null
    )
    .run();
  if (status === "published") safeRevalidate(["/", `/posts/${slug}`]);
  return NextResponse.json({ id: postId, slug, status }, { status: 201 });
}
