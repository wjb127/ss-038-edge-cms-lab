import { AdminShell } from "@/components/AdminShell";
import { media } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const items = await media();
  return (
    <AdminShell access="write">
      <div className="grid gap-5">
        <h1 className="text-3xl font-semibold">Media</h1>
        <form action="/api/media" method="post" encType="multipart/form-data" className="panel grid grid-cols-[1fr_1fr_auto] gap-3 p-4">
          <input className="input" name="file" type="file" required />
          <input className="input" name="alt_text" aria-label="Alt text" />
          <button className="btn primary" type="submit">
            Upload
          </button>
        </form>
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => (
            <form key={item.id} action={`/api/media/${item.id}`} method="post" className="panel grid gap-3 p-4">
              <img src={item.url_path} alt={item.alt_text} className="aspect-video w-full rounded-md object-cover" />
              <strong>{item.filename}</strong>
              <input className="input" name="alt_text" defaultValue={item.alt_text} />
              <div className="flex gap-2">
                <button className="btn primary" type="submit">
                  Save
                </button>
                <button className="btn danger" formAction={`/api/media/${item.id}/delete`} type="submit">
                  Delete
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
