import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";

export async function POST(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin");
  const { slug } = await params;
  await db().prepare("DELETE FROM taxonomies WHERE slug = ? AND slug NOT IN ('category','tag')").bind(slug).run();
  redirect("/admin/taxonomies");
}
