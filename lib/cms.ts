import { db } from "@/lib/env";
import type { Comment, ContentType, MediaItem, Post, Taxonomy, Term, User } from "@/lib/types";

export async function settings(): Promise<Record<string, string>> {
  const rows = await db().prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>();
  return Object.fromEntries(rows.results.map((row) => [row.key, row.value]));
}

export async function contentTypes(): Promise<ContentType[]> {
  const rows = await db().prepare("SELECT * FROM content_types ORDER BY slug").all<ContentType>();
  return rows.results;
}

export async function taxonomies(): Promise<Taxonomy[]> {
  const rows = await db().prepare("SELECT * FROM taxonomies ORDER BY content_type, slug").all<Taxonomy>();
  return rows.results;
}

export async function terms(taxonomy?: string): Promise<Term[]> {
  const query = taxonomy ? "SELECT * FROM terms WHERE taxonomy_slug = ? ORDER BY name" : "SELECT * FROM terms ORDER BY taxonomy_slug, name";
  const statement = db().prepare(query);
  const rows = taxonomy ? await statement.bind(taxonomy).all<Term>() : await statement.all<Term>();
  return rows.results;
}

export async function posts(type?: string, status?: string): Promise<Post[]> {
  const filters: string[] = [];
  const values: string[] = [];
  if (type) {
    filters.push("type = ?");
    values.push(type);
  }
  if (status) {
    filters.push("status = ?");
    values.push(status);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const rows = await db().prepare(`SELECT * FROM posts ${where} ORDER BY updated_at DESC`).bind(...values).all<Post>();
  return rows.results;
}

export const DEFAULT_PAGE_SIZE = 10;

export type Paged<T> = { items: T[]; total: number; page: number; perPage: number; totalPages: number };

// 페이지네이션 적용 목록(LIMIT/OFFSET). 글 수가 많아도 토하지 않도록.
export async function postsPaged(opts: {
  type?: string;
  status?: string;
  page?: number;
  perPage?: number;
  orderBy?: "updated_at" | "published_at";
}): Promise<Paged<Post>> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Math.floor(opts.perPage ?? DEFAULT_PAGE_SIZE)));
  const filters: string[] = [];
  const values: (string | number)[] = [];
  if (opts.type) {
    filters.push("type = ?");
    values.push(opts.type);
  }
  if (opts.status) {
    filters.push("status = ?");
    values.push(opts.status);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const order = opts.orderBy === "published_at" ? "published_at" : "updated_at";
  const countRow = await db()
    .prepare(`SELECT COUNT(*) AS total FROM posts ${where}`)
    .bind(...values)
    .first<{ total: number }>();
  const total = countRow?.total ?? 0;
  const offset = (page - 1) * perPage;
  const rows = await db()
    .prepare(`SELECT * FROM posts ${where} ORDER BY ${order} DESC LIMIT ? OFFSET ?`)
    .bind(...values, perPage, offset)
    .all<Post>();
  return { items: rows.results, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

// slug 충돌 방지: 같은 slug가 있으면 -2, -3 ... 부여(중복 INSERT 500 방지).
export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  for (let n = 2; n < 1000; n += 1) {
    const row = excludeId
      ? await db().prepare("SELECT id FROM posts WHERE slug = ? AND id <> ?").bind(candidate, excludeId).first<{ id: string }>()
      : await db().prepare("SELECT id FROM posts WHERE slug = ?").bind(candidate).first<{ id: string }>();
    if (!row) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function postBySlug(slug: string): Promise<Post | null> {
  return db().prepare("SELECT * FROM posts WHERE slug = ?").bind(slug).first<Post>();
}

export async function postById(id: string): Promise<Post | null> {
  return db().prepare("SELECT * FROM posts WHERE id = ?").bind(id).first<Post>();
}

export async function postTerms(postId: string): Promise<Term[]> {
  const rows = await db()
    .prepare("SELECT terms.* FROM term_relationships JOIN terms ON terms.id = term_relationships.term_id WHERE term_relationships.post_id = ?")
    .bind(postId)
    .all<Term>();
  return rows.results;
}

export async function media(): Promise<MediaItem[]> {
  const rows = await db().prepare("SELECT * FROM media ORDER BY created_at DESC").all<MediaItem>();
  return rows.results;
}

export async function mediaById(id: string): Promise<MediaItem | null> {
  return db().prepare("SELECT * FROM media WHERE id = ?").bind(id).first<MediaItem>();
}

export async function comments(postId?: string): Promise<Comment[]> {
  const rows = postId
    ? await db().prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC").bind(postId).all<Comment>()
    : await db().prepare("SELECT * FROM comments ORDER BY created_at DESC").all<Comment>();
  return rows.results;
}

export async function users(): Promise<User[]> {
  const rows = await db().prepare("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC").all<User>();
  return rows.results;
}
