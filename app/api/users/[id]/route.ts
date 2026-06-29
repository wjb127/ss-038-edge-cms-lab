import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/env";
import { required } from "@/lib/util";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin");
  const { id } = await params;
  const form = await request.formData();
  await db().prepare("UPDATE users SET name = ?, role = ? WHERE id = ?").bind(required(form.get("name"), "name"), required(form.get("role"), "role"), id).run();
  redirect("/admin/users");
}
