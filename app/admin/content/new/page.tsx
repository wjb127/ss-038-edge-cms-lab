import { AdminShell } from "@/components/AdminShell";
import { Editor } from "@/components/Editor";
import { media, taxonomies, terms } from "@/lib/cms";
import type { Taxonomy, Term } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewContentPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "post" } = await searchParams;
  const [allMedia, allTaxonomies, allTerms] = await Promise.all([media(), taxonomies(), terms()]);
  return (
    <AdminShell access="write">
    <div className="grid gap-5">
      <h1 className="text-3xl font-semibold">New {type}</h1>
      <form action="/api/content" method="post" className="grid gap-4">
        <input type="hidden" name="type" value={type} />
        <ContentFields taxonomies={allTaxonomies} terms={allTerms} type={type} />
        <Editor initialHtml="" initialJson="{}" media={allMedia} />
        <button className="btn primary" type="submit">
          Save
        </button>
      </form>
    </div>
    </AdminShell>
  );
}

function ContentFields({ taxonomies, terms, type }: { taxonomies: Taxonomy[]; terms: Term[]; type: string }) {
  return (
    <div className="grid gap-4">
      <label className="field">
        <span>Title</span>
        <input className="input" name="title" required />
      </label>
      <label className="field">
        <span>Slug</span>
        <input className="input" name="slug" />
      </label>
      <label className="field">
        <span>Excerpt</span>
        <textarea className="input" name="excerpt" rows={3} />
      </label>
      <label className="field">
        <span>Status</span>
        <select className="input" name="status">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {taxonomies
          .filter((taxonomy) => taxonomy.content_type === type)
          .map((taxonomy) => (
            <label className="field" key={taxonomy.slug}>
              <span>{taxonomy.label}</span>
              <select className="input" name="term_ids" multiple>
                {terms
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
    </div>
  );
}
