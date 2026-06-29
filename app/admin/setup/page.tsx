import { redirect } from "next/navigation";
import { userCount } from "@/lib/auth";
import { FormError } from "@/components/FormError";

export const dynamic = "force-dynamic";

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if ((await userCount()) > 0) redirect("/admin/login");
  const { error } = await searchParams;
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
      <form action="/api/auth/setup" method="post" className="panel grid w-full gap-4 p-6">
        <h1 className="text-2xl font-semibold">Create admin</h1>
        <FormError message={error} />
        <label className="field">
          <span>Name</span>
          <input className="input" name="name" required />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" name="email" type="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input className="input" name="password" type="password" minLength={10} required />
        </label>
        <button className="btn primary" type="submit">
          Create admin
        </button>
      </form>
    </main>
  );
}
