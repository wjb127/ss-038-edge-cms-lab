import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { id, required, slugify } from "@/lib/util";

export async function POST(request: Request) {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "editor") redirect("/admin");
  const form = await request.formData();
  const name = required(form.get("name"), "name");
  await db()
    .prepare("INSERT INTO terms(id, taxonomy_slug, name, slug) VALUES (?, ?, ?, ?)")
    .bind(id("trm"), required(form.get("taxonomy_slug"), "taxonomy_slug"), name, form.get("slug")?.toString().trim() || slugify(name))
    .run();
  redirect("/admin/taxonomies");
}
