import { redirect } from "next/navigation";
import { createSession, createUser, userCount } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { backWithError, isFrameworkError, required } from "@/lib/util";

export async function POST(request: Request) {
  if ((await userCount()) > 0) redirect("/admin/login");
  if (!sameOrigin(request)) redirect(backWithError("/admin/setup", "잘못된 요청 출처입니다."));
  const form = await request.formData();
  let userId = "";
  try {
    const password = required(form.get("password"), "password");
    if (password.length < 10) throw new Error("비밀번호는 10자 이상이어야 합니다.");
    userId = await createUser({
      name: required(form.get("name"), "name"),
      email: required(form.get("email"), "email"),
      password,
      role: "admin"
    });
  } catch (error) {
    if (isFrameworkError(error)) throw error;
    redirect(backWithError("/admin/setup", (error as Error).message || "관리자 생성 실패"));
  }
  await createSession(userId);
  redirect("/admin");
}
