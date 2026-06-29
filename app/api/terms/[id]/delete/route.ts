import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "editor") redirect("/admin");
  const { id } = await params;
  await db().prepare("DELETE FROM terms WHERE id = ?").bind(id).run();
  redirect("/admin/taxonomies");
}
