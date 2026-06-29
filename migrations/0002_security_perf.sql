-- P0/P1: 인덱스, rate limit 테이블, SEO/API 설정 시드
-- 안전 마이그레이션(IF NOT EXISTS). wrangler d1 migrations apply 로 적용.

-- ── 인덱스: 필터/정렬 풀스캔 제거 ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_type_status ON posts(type, status);
CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts(status, published_at);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_updated ON posts(updated_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_status ON comments(post_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_terms_taxonomy ON terms(taxonomy_slug);
CREATE INDEX IF NOT EXISTS idx_term_rel_term ON term_relationships(term_id);

-- ── Rate limit: D1 고정창 카운터 ──────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- ── 설정 시드: SEO 기준 URL + 헤드리스 쓰기 API 토큰(기본 비활성) ──
INSERT OR IGNORE INTO settings(key, value) VALUES
  ('site_url', 'https://ss-038-edge-cms-lab.seungbeen-dev.workers.dev'),
  ('api_token', '');
