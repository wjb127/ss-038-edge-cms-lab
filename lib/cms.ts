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
