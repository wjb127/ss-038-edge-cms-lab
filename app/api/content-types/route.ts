import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { required, slugify } from "@/lib/util";

export async function POST(request: Request) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin");
  const form = await request.formData();
  await db()
    .prepare("INSERT INTO content_types(slug, label, public) VALUES (?, ?, ?)")
    .bind(slugify(required(form.get("slug"), "slug")), required(form.get("label"), "label"), form.has("public") ? 1 : 0)
    .run();
  redirect("/admin/content-types");
}
