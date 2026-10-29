
import { Suspense } from "react";
import type { RowDataPacket } from "mysql2";
import Link from "next/link";
import pool from "@/lib/db";

interface CountRow extends RowDataPacket {
  total: number | string;
}

interface FeedbackRow extends RowDataPacket {
  id: number | string;
  rating: number;
  category: string;
  message: string;
  status: "new" | "reviewed" | "resolved";
  created_at: Date | string;
}

async function getCount(sql: string): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(sql);
  return Number(rows[0]?.total ?? 0);
}

async function DashboardData() {
  const [totalUsers, totalFeedback, newFeedback, feedbackResult] =
    await Promise.all([
      getCount("SELECT COUNT(*) AS total FROM users"),
      getCount("SELECT COUNT(*) AS total FROM feedback"),
      getCount(
        "SELECT COUNT(*) AS total FROM feedback WHERE status = 'new'"
      ),
      pool.execute<FeedbackRow[]>(
        `SELECT id, rating, category, message, status, created_at
         FROM feedback
         ORDER BY created_at DESC
         LIMIT 5`
      ),
    ]);

  const recentFeedback = feedbackResult[0];

  const cards = [
    {
      title: "Registered users",
      value: totalUsers,
      description: "Total accounts on TicketCircle",
      icon: "U",
      iconStyle: "bg-indigo-100 text-indigo-700",
      accent: "border-t-indigo-500",
    },
    {
      title: "Total feedback",
      value: totalFeedback,
      description: "Feedback received from users",
      icon: "F",
      iconStyle: "bg-purple-100 text-purple-700",
      accent: "border-t-purple-500",
    },
    {
      title: "New feedback",
      value: newFeedback,
      description: "Submissions waiting for review",
      icon: "N",
      iconStyle: "bg-amber-100 text-amber-700",
      accent: "border-t-amber-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-700">
            TicketCircle administration
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Dashboard overview
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Monitor your platform and review recent activity.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-200 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          Visit website <span aria-hidden="true">↗</span>
        </Link>
      </section>

      {/* Statistics */}
      <section
        aria-label="Platform statistics"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        {cards.map((card) => (
          <article
            key={card.title}
            className={`rounded-2xl border border-slate-200 border-t-4 ${card.accent} bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  {card.title}
                </p>
                <p className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
                  {card.value.toLocaleString()}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold ${card.iconStyle}`}
                aria-hidden="true"
              >
                {card.icon}
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              {card.description}
            </p>
          </article>
        ))}
      </section>

      {/* Recent feedback */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Recent feedback
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              The five most recent submissions from your users
            </p>
          </div>

          <Link
            href="/admin/feedback"
            className="text-sm font-bold text-purple-700 transition hover:text-indigo-800"
          >
            View all feedback →
          </Link>
        </div>

        {recentFeedback.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-2xl text-purple-700">
              ✉
            </div>
            <h4 className="mt-4 font-bold text-slate-900">
              No feedback yet
            </h4>
            <p className="mt-1 text-sm text-slate-600">
              New feedback submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentFeedback.map((item) => (
              <article
                key={item.id}
                className="px-6 py-5 transition hover:bg-slate-50"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900">
                      {item.category}
                    </h4>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {item.message}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                      ★ {item.rating}/5
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        item.status === "new"
                          ? "bg-blue-100 text-blue-800"
                          : item.status === "reviewed"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.status.charAt(0).toUpperCase() +
                        item.status.slice(1)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Management shortcuts */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Quick actions
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <Link
            href="/admin/users"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-lg font-extrabold text-indigo-700">
                U
              </div>
              <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-700">
                →
              </span>
            </div>
            <h4 className="mt-4 font-bold text-slate-900">
              Manage users
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Browse registered accounts and review account roles.
            </p>
          </Link>

          <Link
            href="/admin/feedback"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-purple-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-lg font-extrabold text-purple-700">
                F
              </div>
              <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-purple-700">
                →
              </span>
            </div>
            <h4 className="mt-4 font-bold text-slate-900">
              Manage feedback
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Review user suggestions and track their status.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 rounded-2xl bg-slate-200" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-40 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200" />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardData />
    </Suspense>
  );
}
