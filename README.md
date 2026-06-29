# Edge CMS Lab

Cloudflare Workers + D1 + R2 위에서 동작하는 Next.js App Router 기반 CMS 실험체다. WordPress 코어에 대응되는 콘텐츠/분류/미디어/사용자/댓글/설정/API/공개 렌더링 흐름을 가볍게 재구현했다.

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS
- Cloudflare Workers via `@opennextjs/cloudflare`
- Cloudflare D1 for relational data
- Cloudflare R2 for media objects
- TipTap editor for rich text and image insertion
- PBKDF2 session authentication with role checks

## Implemented

- Posts, Pages, and custom post type definitions
- Categories, Tags, and custom taxonomy definitions
- Terms and post-term relationships
- R2 media upload, listing, alt text editing, serving, and deletion
- TipTap editor with formatting and R2 image insertion
- Admin, editor, author, subscriber roles
- Cookie-backed login/logout sessions
- Pending/approved comments with admin approval and deletion
- Site title and description settings
- Public blog index, single post pages, and CMS pages
- REST read endpoints:
  - `/api/wp/v1/posts`
  - `/api/wp/v1/pages`
  - `/api/wp/v1/taxonomies`
  - `/api/wp/v1/terms`
- D1 migration in `migrations/0001_init.sql`

## Cloudflare Resources

- Live URL: `https://ss-038-edge-cms-lab.seungbeen-dev.workers.dev`
- D1 database: `ss-038-edge-cms-lab-db`
- D1 database ID: `4cf75acb-4b68-4b29-851c-85ff5996fe8c`
- R2 bucket: `ss-038-edge-cms-lab-media`
- Worker binding names: `DB`, `MEDIA_BUCKET`, `ASSETS`, `WORKER_SELF_REFERENCE`

## Local Commands

```sh
pnpm install
pnpm build
pnpm cf:build
pnpm preview
```

Apply D1 migrations:

```sh
npx wrangler d1 migrations apply ss-038-edge-cms-lab-db --local
npx wrangler d1 migrations apply ss-038-edge-cms-lab-db --remote
```

Deploy:

```sh
npx wrangler deploy
```

Run live E2E:

```sh
node e2e/live-e2e.mjs
```

## Verified Build Size

Latest deploy output:

- Total upload: `6104.64 KiB`
- Gzip: `1141.15 KiB`
- 3MB free-tier target: passed

## Honest Limits

- This is not a WordPress plugin ecosystem replacement.
- No theme marketplace, plugin hooks, revisions, scheduled publishing, multisite, import/export, or Gutenberg block parity.
- The admin UI is functional and evidence-tested, but intentionally minimal.
- Failed E2E attempts revealed and fixed two runtime issues:
  - Next 16 + OpenNext route handler compatibility issue, fixed by using Next 15.5.19.
  - Cloudflare PBKDF2 iteration limit, fixed by using 100,000 iterations.
