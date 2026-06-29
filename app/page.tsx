import Link from "next/link";
import { posts, settings } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function Home() {
  const site = await settings();
  const entries = await posts("post", "published");
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
        {entries.map((post) => (
          <article key={post.id} className="panel p-5">
            <Link href={`/posts/${post.slug}`} className="grid gap-2">
              <h2 className="text-2xl font-semibold">{post.title}</h2>
              <p className="text-[#66706a]">{post.excerpt}</p>
            </Link>
          </article>
        ))}
        {entries.length === 0 ? <p className="text-[#66706a]">No published posts yet.</p> : null}
      </section>
    </main>
  );
}
