import Link from "next/link";
import { postsPaged, settings } from "@/lib/cms";

export const revalidate = 60;

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const site = await settings();
  const { items, page: current, totalPages } = await postsPaged({
    type: "post",
    status: "published",
    page,
    perPage: 10,
    orderBy: "published_at"
  });
  return (
    <main className="mx-auto grid max-w-5xl gap-10 px-5 py-10">
      <header className="grid gap-3 border-b border-[#dbe2dc] pb-8">
        <p className="text-sm uppercase tracking-wide text-[#66706a]">Edge CMS</p>
        <h1 className="text-4xl font-semibold">{site.site_title}</h1>
        <p className="max-w-2xl text-[#66706a]">{site.site_description}</p>
        <div>
          <Link className="btn" href="/admin">
            Admin
          </Link>
        </div>
      </header>
      <section className="grid gap-4">
        {items.map((post) => (
          <article key={post.id} className="panel p-5">
            <Link href={`/posts/${post.slug}`} className="grid gap-2">
              <h2 className="text-2xl font-semibold">{post.title}</h2>
              <p className="text-[#66706a]">{post.excerpt}</p>
            </Link>
          </article>
        ))}
        {items.length === 0 ? <p className="text-[#66706a]">No published posts yet.</p> : null}
      </section>
      {totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-3">
          {current > 1 ? (
            <Link className="btn" href={current - 1 === 1 ? "/" : `/?page=${current - 1}`}>
              ← 이전
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-[#66706a]">
            {current} / {totalPages}
          </span>
          {current < totalPages ? (
            <Link className="btn" href={`/?page=${current + 1}`}>
              다음 →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}
