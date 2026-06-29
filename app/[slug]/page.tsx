import { notFound } from "next/navigation";
import { postBySlug, settings } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function PageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await postBySlug(slug);
  if (!page || page.status !== "published" || page.type !== "page") notFound();
  const site = await settings();
  return (
    <main className="mx-auto grid max-w-3xl gap-7 px-5 py-10">
      <a href="/" className="text-sm text-[#126d57]">
        {site.site_title}
      </a>
      <article className="grid gap-5">
        <h1 className="text-4xl font-semibold">{page.title}</h1>
        <div className="prose" dangerouslySetInnerHTML={{ __html: page.content_html }} />
      </article>
    </main>
  );
}
