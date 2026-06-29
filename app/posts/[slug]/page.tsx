import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { comments, postBySlug, postTerms, settings } from "@/lib/cms";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { clip, siteUrl } from "@/lib/site";

// 시간기반 ISR: 방문마다 D1를 때리지 않고 최대 60초마다 한 번만 재생성
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await postBySlug(slug);
  if (!post || post.status !== "published" || post.type !== "post") return { title: "Not found" };
  const base = await siteUrl();
  const url = `${base}/posts/${post.slug}`;
  const description = clip(post.excerpt || post.title);
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: post.title, description, url, type: "article", publishedTime: post.published_at ?? undefined },
    twitter: { card: "summary_large_image", title: post.title, description }
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await postBySlug(slug);
  if (!post || post.status !== "published" || post.type !== "post") notFound();
  const [site, attachedTerms, approvedComments] = await Promise.all([settings(), postTerms(post.id), comments(post.id)]);
  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-5 py-10">
      <a href="/" className="text-sm text-[#126d57]">
        {site.site_title}
      </a>
      <article className="grid gap-5">
        <h1 className="text-4xl font-semibold">{post.title}</h1>
        <p className="text-[#66706a]">{post.excerpt}</p>
        {attachedTerms.length ? <p className="text-sm text-[#66706a]">{attachedTerms.map((term) => term.name).join(", ")}</p> : null}
        {/* content_html은 작성 시 sanitize되지만 레거시 행 방어를 위해 렌더 시에도 한 번 더 정화 */}
        <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeContentHtml(post.content_html) }} />
      </article>
      <section className="grid gap-4 border-t border-[#dbe2dc] pt-6">
        <h2 className="text-xl font-semibold">Comments</h2>
        {approvedComments
          .filter((comment) => comment.status === "approved")
          .map((comment) => (
            <div className="panel p-4" key={comment.id}>
              <strong>{comment.author_name}</strong>
              <p>{comment.body}</p>
            </div>
          ))}
        <form className="grid gap-3" action="/api/comments" method="post">
          <input type="hidden" name="post_id" value={post.id} />
          {/* 허니팟: 사람에겐 안 보이고 봇만 채움 */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
          />
          <label className="field">
            <span>Name</span>
            <input className="input" name="author_name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" name="author_email" type="email" required />
          </label>
          <label className="field">
            <span>Comment</span>
            <textarea className="input" name="body" rows={4} required />
          </label>
          <button className="btn primary" type="submit">
            Submit comment
          </button>
          <p className="text-sm text-[#66706a]">댓글은 관리자 승인 후 표시됩니다.</p>
        </form>
      </section>
    </main>
  );
}
