import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { required } from "@/lib/util";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin");
  const { slug } = await params;
  const form = await request.formData();
  await db().prepare("UPDATE content_types SET label = ?, public = ? WHERE slug = ?").bind(required(form.get("label"), "label"), form.has("public") ? 1 : 0, slug).run();
  redirect("/admin/content-types");
}
