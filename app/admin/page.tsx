import { AdminShell } from "@/components/AdminShell";
import Link from "next/link";
import { comments, contentTypes, media, posts, taxonomies, users } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [allPosts, allTypes, allTaxonomies, allMedia, allComments, allUsers] = await Promise.all([
    posts(),
    contentTypes(),
    taxonomies(),
    media(),
    comments(),
    users()
  ]);
  const cards = [
    ["Content", allPosts.length, "/admin/content?type=post"],
    ["Types", allTypes.length, "/admin/content-types"],
    ["Taxonomies", allTaxonomies.length, "/admin/taxonomies"],
    ["Media", allMedia.length, "/admin/media"],
    ["Comments", allComments.length, "/admin/comments"],
    ["Users", allUsers.length, "/admin/users"]
  ] as const;
  return (
    <AdminShell>
      <div className="grid gap-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <div className="grid grid-cols-3 gap-4">
          {cards.map(([label, count, href]) => (
            <Link key={label} href={href} className="panel p-5">
              <span className="text-sm text-[#66706a]">{label}</span>
              <strong className="mt-2 block text-3xl">{count}</strong>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
