import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { canWrite } from "@/lib/util";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  const { id } = await params;
  const form = await request.formData();
  await db().prepare("UPDATE media SET alt_text = ? WHERE id = ?").bind(form.get("alt_text")?.toString() ?? "", id).run();
  redirect("/admin/media");
}
