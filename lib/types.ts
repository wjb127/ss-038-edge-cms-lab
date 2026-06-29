export type Role = "admin" | "editor" | "author" | "subscriber";
export type PostStatus = "draft" | "published";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
};

export type ContentType = {
  slug: string;
  label: string;
  public: number;
  created_at: string;
};

export type Taxonomy = {
  slug: string;
  label: string;
  content_type: string;
  hierarchical: number;
  created_at: string;
};

export type Term = {
  id: string;
  taxonomy_slug: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Post = {
  id: string;
  type: string;
  slug: string;
  title: string;
  excerpt: string;
  content_json: string;
  content_html: string;
  status: PostStatus;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type MediaItem = {
  id: string;
  object_key: string;
  url_path: string;
  filename: string;
  content_type: string;
  alt_text: string;
  size: number;
  uploaded_by: string;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  body: string;
  status: "pending" | "approved";
  created_at: string;
};

export type CloudflareEnv = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
};
