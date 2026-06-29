import Link from "next/link";
import { FileText, FolderTree, Image, LayoutDashboard, MessageSquare, Settings, Tags, Users } from "lucide-react";

const items = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/content?type=post", "Posts", FileText],
  ["/admin/content?type=page", "Pages", FileText],
  ["/admin/content-types", "Types", FolderTree],
  ["/admin/taxonomies", "Taxonomies", Tags],
  ["/admin/media", "Media", Image],
  ["/admin/comments", "Comments", MessageSquare],
  ["/admin/users", "Users", Users],
  ["/admin/settings", "Settings", Settings]
] as const;

export function AdminNav() {
  return (
    <nav className="grid gap-1">
      {items.map(([href, label, Icon]) => (
        <Link key={href} href={href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[#eef3ed]">
          <Icon size={16} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
