import { AdminShell } from "@/components/AdminShell";
import { contentTypes } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function ContentTypesPage() {
  const types = await contentTypes();
  return (
    <AdminShell access="admin">
      <div className="grid gap-5">
        <h1 className="text-3xl font-semibold">Content types</h1>
        <form action="/api/content-types" method="post" className="panel grid grid-cols-[1fr_1fr_auto_auto] gap-3 p-4">
          <input className="input" name="slug" aria-label="Slug" required />
          <input className="input" name="label" aria-label="Label" required />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="public" defaultChecked />
            Public
          </label>
          <button className="btn primary" type="submit">
            Add
          </button>
        </form>
        <div className="grid gap-3">
          {types.map((type) => (
            <form key={type.slug} action={`/api/content-types/${type.slug}`} method="post" className="panel grid grid-cols-[1fr_1fr_auto_auto] gap-3 p-4">
              <input className="input" name="label" defaultValue={type.label} required />
              <span className="self-center text-[#66706a]">{type.slug}</span>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="public" defaultChecked={type.public === 1} />
                Public
              </label>
              <div className="flex gap-2">
                <button className="btn primary" type="submit">
                  Save
                </button>
                {type.slug === "post" || type.slug === "page" ? null : (
                  <button className="btn danger" formAction={`/api/content-types/${type.slug}/delete`} type="submit">
                    Delete
                  </button>
                )}
              </div>
            </form>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
