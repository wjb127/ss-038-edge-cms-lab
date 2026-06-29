import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { bucket, db } from "@/lib/env";
import { mediaById } from "@/lib/cms";
import { canWrite } from "@/lib/util";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  const { id } = await params;
  const item = await mediaById(id);
  if (item) await bucket().delete(item.object_key);
  await db().prepare("DELETE FROM media WHERE id = ?").bind(id).run();
  redirect("/admin/media");
}
