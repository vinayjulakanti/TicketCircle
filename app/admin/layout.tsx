
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/admin-auth";

async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 text-white md:flex">
        <div className="border-b border-white/10 px-6 py-7">
          <Link href="/admin" className="text-2xl font-extrabold">
            Ticket<span className="text-purple-400">Circle</span>
          </Link>

          <p className="mt-2 text-xs tracking-widest text-slate-400">
            ADMIN PANEL
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          <Link
            href="/admin"
            className="block rounded-xl bg-white/10 px-4 py-3 font-semibold"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/users"
            className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            User management
          </Link>

          <Link
            href="/admin/feedback"
            className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            Feedback
          </Link>

          <Link
            href="/change-password"
            className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            Change Password
          </Link>

          <Link
            href="/"
            className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            View website
          </Link>
        </nav>

        <div className="border-t border-white/10 p-5">
          <p className="text-xs text-slate-400">Signed in as</p>
          <p className="mt-1 truncate font-semibold">{admin.name}</p>
          <p className="mt-1 truncate text-xs text-slate-400">
            {admin.email}
          </p>

          <span className="mt-3 inline-block rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
            Administrator
          </span>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-700">
                TicketCircle / Admin
              </p>

              <h1 className="mt-1 text-lg font-bold text-slate-900">
                Administration
              </h1>
            </div>

            <Link
              href="/change-password"
              className="whitespace-nowrap rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
            >
              Change Password
            </Link>
          </div>

          {/* Mobile navigation */}
          <nav className="mt-4 flex gap-2 overflow-x-auto md:hidden">
            <Link
              href="/admin"
              className="whitespace-nowrap rounded-lg bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/users"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-purple-50"
            >
              Users
            </Link>

            <Link
              href="/admin/feedback"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-purple-50"
            >
              Feedback
            </Link>

            <Link
              href="/change-password"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
            >
              Change Password
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-purple-50"
            >
              Website
            </Link>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl p-5 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
          Loading admin panel...
        </div>
      }
    >
      <ProtectedAdminLayout>{children}</ProtectedAdminLayout>
    </Suspense>
  );
}
