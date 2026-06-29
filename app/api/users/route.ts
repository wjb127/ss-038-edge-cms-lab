import { redirect } from "next/navigation";
import { createUser, requireUser } from "@/lib/auth";
import { required } from "@/lib/util";
import type { Role } from "@/lib/types";

export async function POST(request: Request) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin");
  const form = await request.formData();
  await createUser({
    name: required(form.get("name"), "name"),
    email: required(form.get("email"), "email"),
    password: required(form.get("password"), "password"),
    role: required(form.get("role"), "role") as Role
  });
  redirect("/admin/users");
}
