
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

interface FeedbackRow extends RowDataPacket {
  id: number | string;
  rating: number;
  category: string;
  message: string;
  status: "new" | "reviewed" | "resolved";
  created_at: Date | string;
}

async function MyFeedbackContent({ userId }: { userId: number }) {
  const [feedback] = await pool.execute<FeedbackRow[]>(
    `SELECT id, rating, category, message, status, created_at
     FROM feedback
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );

  const statusStyles = {
    new: "bg-amber-100 text-amber-800",
    reviewed: "bg-purple-100 text-purple-800",
    resolved: "bg-emerald-100 text-emerald-800",
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="font-bold text-purple-700">
          ← Back to TicketCircle
        </a>

        <h1 className="mt-6 text-3xl font-extrabold text-slate-900">
          My Feedback
        </h1>
        <p className="mt-2 text-slate-600">
          View the feedback you have sent and its current status.
        </p>

        <div className="mt-8 space-y-5">
          {feedback.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="text-lg font-bold text-slate-900">
                No feedback yet
              </h2>
              <p className="mt-2 text-slate-600">
                Any feedback you submit will appear here.
              </p>
            </div>
          ) : (
            feedback.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                    {item.category}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[item.status]}`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-slate-800">
                  {item.message}
                </p>

                <p className="mt-4 text-sm text-amber-600">
                  Rating: {"★".repeat(
                    Math.max(0, Math.min(5, Number(item.rating)))
                  )}
                  <span className="ml-2 text-slate-500">
                    {item.rating}/5
                  </span>
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Submitted:{" "}
                  {new Date(item.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

export default async function MyFeedbackPage() {
  await connection();

  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/login");
  }

  return <MyFeedbackContent userId={userId} />;
}
