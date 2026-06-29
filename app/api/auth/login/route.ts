import { redirect } from "next/navigation";
import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/env";
import { required } from "@/lib/util";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = required(form.get("email"), "email").toLowerCase();
  const password = required(form.get("password"), "password");
  const user = await db().prepare("SELECT id, password_hash FROM users WHERE email = ?").bind(email).first<{ id: string; password_hash: string }>();
  if (!user || !(await verifyPassword(password, user.password_hash))) redirect("/admin/login");
  await createSession(user.id);
  redirect("/admin");
}
