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
          <label className="field">
            <span>Site URL (SEO·사이트맵·OG 절대 URL 기준)</span>
            <input className="input" name="site_url" type="url" defaultValue={site.site_url ?? ""} placeholder="https://example.com" />
          </label>
          <label className="field">
            <span>REST 쓰기 API 토큰 (비우면 쓰기 API 비활성)</span>
            <input className="input" name="api_token" defaultValue={site.api_token ?? ""} placeholder="긴 무작위 문자열 권장" />
            <span className="text-[#66706a]">헤드리스로 글을 쓰려면 이 토큰을 Authorization: Bearer 헤더로 보냅니다.</span>
          </label>
          <button className="btn primary" type="submit">
            Save
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
