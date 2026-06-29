import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { postBySlug, settings } from "@/lib/cms";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { clip, siteUrl } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await postBySlug(slug);
  if (!page || page.status !== "published" || page.type !== "page") return { title: "Not found" };
  const base = await siteUrl();
  const url = `${base}/${page.slug}`;
  const description = clip(page.excerpt || page.title);
  return {
    title: page.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description, url, type: "website" }
  };
}

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
        <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeContentHtml(page.content_html) }} />
      </article>
    </main>
  );
}
