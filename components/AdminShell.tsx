import { AdminNav } from "@/components/AdminNav";
import { requireUser } from "@/lib/auth";
import { canWrite } from "@/lib/util";

export async function AdminShell({ children, access = "user" }: { children: React.ReactNode; access?: "user" | "write" | "admin" }) {
  const user = await requireUser();
  if (access === "write" && !canWrite(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="panel max-w-md p-6">
          <h1 className="mb-2 text-2xl font-semibold">Access blocked</h1>
          <p className="text-[#66706a]">Your role cannot manage this area.</p>
        </div>
      </div>
    );
  }
  if (access === "admin" && user.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="panel max-w-md p-6">
          <h1 className="mb-2 text-2xl font-semibold">Access blocked</h1>
          <p className="text-[#66706a]">Admin access is required.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside className="border-r border-[#dbe2dc] bg-white p-4">
        <div className="mb-5 grid gap-1">
          <strong>Edge CMS</strong>
          <span className="text-sm text-[#66706a]">{user.email}</span>
        </div>
        <AdminNav />
        <form action="/api/auth/logout" method="post" className="mt-5">
          <button className="btn w-full" type="submit">
            Logout
          </button>
        </form>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
