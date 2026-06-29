import { AdminShell } from "@/components/AdminShell";
import { contentTypes, taxonomies, terms } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function TaxonomiesPage() {
  const [types, allTaxonomies, allTerms] = await Promise.all([contentTypes(), taxonomies(), terms()]);
  return (
    <AdminShell access="admin">
      <div className="grid gap-5">
        <h1 className="text-3xl font-semibold">Taxonomies</h1>
        <form action="/api/taxonomies" method="post" className="panel grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 p-4">
          <input className="input" name="slug" aria-label="Slug" required />
          <input className="input" name="label" aria-label="Label" required />
          <select className="input" name="content_type">
            {types.map((type) => (
              <option key={type.slug} value={type.slug}>
                {type.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="hierarchical" />
            Hierarchical
          </label>
          <button className="btn primary" type="submit">
            Add
          </button>
        </form>
        <div className="grid gap-4">
          {allTaxonomies.map((taxonomy) => (
            <section className="panel grid gap-3 p-4" key={taxonomy.slug}>
              <form action={`/api/taxonomies/${taxonomy.slug}`} method="post" className="grid grid-cols-[1fr_1fr_auto_auto] gap-3">
                <input className="input" name="label" defaultValue={taxonomy.label} required />
                <span className="self-center text-[#66706a]">{taxonomy.content_type}</span>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="hierarchical" defaultChecked={taxonomy.hierarchical === 1} />
                  Hierarchical
                </label>
                <div className="flex gap-2">
                  <button className="btn primary" type="submit">
                    Save
                  </button>
                  {taxonomy.slug === "category" || taxonomy.slug === "tag" ? null : (
                    <button className="btn danger" formAction={`/api/taxonomies/${taxonomy.slug}/delete`} type="submit">
                      Delete
                    </button>
                  )}
                </div>
              </form>
              <form action="/api/terms" method="post" className="grid grid-cols-[1fr_1fr_auto] gap-3">
                <input type="hidden" name="taxonomy_slug" value={taxonomy.slug} />
                <input className="input" name="name" aria-label="Term name" required />
                <input className="input" name="slug" aria-label="Term slug" />
                <button className="btn" type="submit">
                  Add term
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                {allTerms
                  .filter((term) => term.taxonomy_slug === taxonomy.slug)
                  .map((term) => (
                    <form key={term.id} action={`/api/terms/${term.id}/delete`} method="post">
                      <button className="btn" type="submit">
                        {term.name} x
                      </button>
                    </form>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
