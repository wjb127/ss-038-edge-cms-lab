import { AdminShell } from "@/components/AdminShell";
import { users } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const allUsers = await users();
  return (
    <AdminShell access="admin">
      <div className="grid gap-5">
        <h1 className="text-3xl font-semibold">Users</h1>
        <form action="/api/users" method="post" className="panel grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 p-4">
          <input className="input" name="name" aria-label="Name" required />
          <input className="input" name="email" type="email" aria-label="Email" required />
          <input className="input" name="password" type="password" aria-label="Password" minLength={10} required />
          <select className="input" name="role">
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="author">Author</option>
            <option value="subscriber">Subscriber</option>
          </select>
          <button className="btn primary" type="submit">
            Add
          </button>
        </form>
        <div className="grid gap-3">
          {allUsers.map((user) => (
            <form key={user.id} action={`/api/users/${user.id}`} method="post" className="panel grid grid-cols-[1fr_1fr_1fr_auto] gap-3 p-4">
              <input className="input" name="name" defaultValue={user.name} required />
              <span className="self-center">{user.email}</span>
              <select className="input" name="role" defaultValue={user.role}>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="author">Author</option>
                <option value="subscriber">Subscriber</option>
              </select>
              <button className="btn primary" type="submit">
                Save
              </button>
            </form>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
