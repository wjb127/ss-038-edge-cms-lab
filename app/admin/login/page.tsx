import { redirect } from "next/navigation";
import { getUser, userCount } from "@/lib/auth";
import { FormError } from "@/components/FormError";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, user, count] = await Promise.all([searchParams, getUser(), userCount()]);
  if (user) redirect("/admin");
  if (count === 0) redirect("/admin/setup");
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
      <form action="/api/auth/login" method="post" className="panel grid w-full gap-4 p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <FormError message={error} />
        <label className="field">
          <span>Email</span>
          <input className="input" name="email" type="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input className="input" name="password" type="password" required />
        </label>
        <button className="btn primary" type="submit">
          Login
        </button>
      </form>
    </main>
  );
}
