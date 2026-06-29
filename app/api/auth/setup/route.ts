import { redirect } from "next/navigation";
import { createSession, createUser, userCount } from "@/lib/auth";
import { required } from "@/lib/util";

export async function POST(request: Request) {
  if ((await userCount()) > 0) redirect("/admin/login");
  const form = await request.formData();
  const userId = await createUser({
    name: required(form.get("name"), "name"),
    email: required(form.get("email"), "email"),
    password: required(form.get("password"), "password"),
    role: "admin"
  });
  await createSession(userId);
  redirect("/admin");
}
