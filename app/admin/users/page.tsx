
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

interface UserRow extends RowDataPacket {
  id: number | string;
  name: string;
  email: string;
  role: "user" | "admin";
  created_at: Date | string;
}

async function UserManagementContent() {
  await connection();

  const [users] = await pool.execute<UserRow[]>(
    `SELECT id, name, email, role, created_at
     FROM users
     ORDER BY created_at DESC`
  );

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-purple-700">
          TicketCircle Administration
        </p>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
          User management
        </h2>
        <p className="mt-2 text-slate-600">
          View registered accounts and their access levels.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total users</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900">
            {users.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Administrators</p>
          <p className="mt-2 text-4xl font-extrabold text-purple-700">
            {users.filter((user) => user.role === "admin").length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">
            Registered accounts
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            All accounts currently stored in your database.
          </p>
        </div>

        {users.length === 0 ? (
          <p className="p-6 text-slate-500">No registered users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          user.role === "admin"
                            ? "rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700"
                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                        }
                      >
                        {user.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(user.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function UserManagementPage() {
  await connection();

  const { getCurrentAdmin } = await import("@/lib/admin-auth");
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return <UserManagementContent />;
}
