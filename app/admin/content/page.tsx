import { AdminShell } from "@/components/AdminShell";
import Link from "next/link";
import { contentTypes, posts } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "post" } = await searchParams;
  const [types, entries] = await Promise.all([contentTypes(), posts(type)]);
  const current = types.find((item) => item.slug === type);
  return (
    <AdminShell access="write">
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{current?.label ?? type}</h1>
          <div className="mt-2 flex gap-2">
            {types.map((item) => (
              <Link className="btn" key={item.slug} href={`/admin/content?type=${item.slug}`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <Link className="btn primary" href={`/admin/content/new?type=${type}`}>
          New
        </Link>
      </div>
      <div className="panel overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#dbe2dc] text-left text-sm text-[#66706a]">
              <th className="p-3">Title</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Updated</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((post) => (
              <tr key={post.id} className="border-b border-[#eef1ee]">
                <td className="p-3">{post.title}</td>
                <td className="p-3">{post.slug}</td>
                <td className="p-3">{post.status}</td>
                <td className="p-3">{post.updated_at}</td>
                <td className="p-3 text-right">
                  <Link className="btn" href={`/admin/content/${post.id}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </AdminShell>
  );
}
