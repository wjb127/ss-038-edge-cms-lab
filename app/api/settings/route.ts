import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { required } from "@/lib/util";

export async function POST(request: Request) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin");
  const form = await request.formData();
  await db().batch([
    db().prepare("INSERT OR REPLACE INTO settings(key, value) VALUES ('site_title', ?)").bind(required(form.get("site_title"), "site_title")),
    db().prepare("INSERT OR REPLACE INTO settings(key, value) VALUES ('site_description', ?)").bind(form.get("site_description")?.toString() ?? "")
  ]);
  redirect("/admin/settings");
}
