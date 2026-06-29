import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { canWrite, required } from "@/lib/util";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  const { id } = await params;
  const form = await request.formData();
  await db().prepare("UPDATE comments SET status = ? WHERE id = ?").bind(required(form.get("status"), "status"), id).run();
  redirect("/admin/comments");
}
