import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { canWrite } from "@/lib/util";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  const { id } = await params;
  await db().prepare("DELETE FROM comments WHERE id = ?").bind(id).run();
  redirect("/admin/comments");
}
