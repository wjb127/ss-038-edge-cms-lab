import { redirect } from "next/navigation";
import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/env";
import { clientIp, rateLimit, sameOrigin } from "@/lib/security";
import { backWithError, isFrameworkError, required } from "@/lib/util";

export async function POST(request: Request) {
  if (!sameOrigin(request)) redirect(backWithError("/admin/login", "잘못된 요청 출처입니다."));
  // brute force 차단: IP당 15분에 10회
  const ip = clientIp(request);
  if (!(await rateLimit(`login:${ip}`, 10, 900))) {
    redirect(backWithError("/admin/login", "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."));
  }
  const form = await request.formData();
  let ok = false;
  let userId = "";
  try {
    const email = required(form.get("email"), "email").toLowerCase();
    const password = required(form.get("password"), "password");
    const user = await db()
      .prepare("SELECT id, password_hash FROM users WHERE email = ?")
      .bind(email)
      .first<{ id: string; password_hash: string }>();
    if (user && (await verifyPassword(password, user.password_hash))) {
      ok = true;
      userId = user.id;
    }
  } catch (error) {
    if (isFrameworkError(error)) throw error;
  }
  if (!ok) redirect(backWithError("/admin/login", "이메일 또는 비밀번호가 올바르지 않습니다."));
  await createSession(userId);
  redirect("/admin");
}
