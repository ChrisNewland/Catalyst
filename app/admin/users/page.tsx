import { prisma } from "@/lib/db";
import { inviteUser, setRole } from "@/lib/actions/user";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Manage volunteers</h1>

      <form
        action={async (formData) => {
          "use server";
          await inviteUser(formData);
        }}
        className="card flex flex-col gap-2"
      >
        <h2 className="font-semibold">Add a volunteer</h2>
        <label className="field">
          Name
          <input name="name" required />
        </label>
        <label className="field">
          Email
          <input name="email" type="email" required />
        </label>
        <label className="field">
          Password (temporary)
          <input name="password" type="text" required minLength={8} />
        </label>
        <label className="field">
          Role
          <select name="role" defaultValue="VOLUNTEER">
            <option value="VOLUNTEER">Volunteer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button type="submit" className="btn-primary mt-2">
          Add volunteer
        </button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink/60">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-ink/10">
              <td className="py-2 font-semibold">{u.name}</td>
              <td className="py-2">{u.email}</td>
              <td className="py-2">{u.role}</td>
              <td className="py-2 text-right">
                <form
                  action={async () => {
                    "use server";
                    await setRole(
                      u.id,
                      u.role === "ADMIN" ? "VOLUNTEER" : "ADMIN",
                    );
                  }}
                >
                  <button className="btn-secondary py-2 px-3 text-sm">
                    {u.role === "ADMIN" ? "Make volunteer" : "Make admin"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
