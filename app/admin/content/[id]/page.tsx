import { AdminShell } from "@/components/AdminShell";
import { notFound } from "next/navigation";
import { Editor } from "@/components/Editor";
import { FormError } from "@/components/FormError";
import { media, postById, postTerms, taxonomies, terms } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function EditContentPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const [post, allMedia, allTaxonomies, allTerms, attached] = await Promise.all([postById(id), media(), taxonomies(), terms(), postTerms(id)]);
  if (!post) notFound();
  const attachedIds = new Set(attached.map((term) => term.id));
  return (
    <AdminShell access="write">
    <div className="grid gap-5">
      <h1 className="text-3xl font-semibold">Edit {post.title}</h1>
      <FormError message={error} />
      <form action={`/api/content/${post.id}`} method="post" className="grid gap-4">
        <label className="field">
          <span>Title</span>
          <input className="input" name="title" defaultValue={post.title} required />
        </label>
        <label className="field">
          <span>Slug</span>
          <input className="input" name="slug" defaultValue={post.slug} required />
        </label>
        <label className="field">
          <span>Excerpt</span>
          <textarea className="input" name="excerpt" rows={3} defaultValue={post.excerpt} />
        </label>
        <label className="field">
          <span>Status</span>
          <select className="input" name="status" defaultValue={post.status}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {allTaxonomies
            .filter((taxonomy) => taxonomy.content_type === post.type)
            .map((taxonomy) => (
              <label className="field" key={taxonomy.slug}>
                <span>{taxonomy.label}</span>
                <select className="input" name="term_ids" multiple defaultValue={allTerms.filter((term) => attachedIds.has(term.id)).map((term) => term.id)}>
                  {allTerms
                    .filter((term) => term.taxonomy_slug === taxonomy.slug)
                    .map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                </select>
              </label>
            ))}
        </div>
        <Editor initialHtml={post.content_html} initialJson={post.content_json} media={allMedia} />
        <div className="flex gap-2">
          <button className="btn primary" type="submit">
            Save
          </button>
          <button className="btn danger" formAction={`/api/content/${post.id}/delete`} type="submit">
            Delete
          </button>
        </div>
      </form>
    </div>
    </AdminShell>
  );
}
