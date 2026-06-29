import { notFound } from "next/navigation";
import { comments, postBySlug, postTerms, settings } from "@/lib/cms";

export const dynamic = "force-dynamic";

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
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.content_html }} />
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
        </form>
      </section>
    </main>
  );
}
