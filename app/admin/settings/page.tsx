import { AdminShell } from "@/components/AdminShell";
import { settings } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const site = await settings();
  return (
    <AdminShell access="admin">
      <div className="grid max-w-2xl gap-5">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <form action="/api/settings" method="post" className="panel grid gap-4 p-5">
          <label className="field">
            <span>Site title</span>
            <input className="input" name="site_title" defaultValue={site.site_title} required />
          </label>
          <label className="field">
            <span>Site description</span>
            <textarea className="input" name="site_description" rows={3} defaultValue={site.site_description} />
          </label>
          <button className="btn primary" type="submit">
            Save
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
