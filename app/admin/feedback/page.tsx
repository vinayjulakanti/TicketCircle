
import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getCurrentAdmin } from "@/lib/admin-auth";
import FeedbackReply from "./FeedbackReply";
import FeedbackStatus from "./FeedbackStatus";

interface FeedbackRow extends RowDataPacket {
  id: number | string;
  user_name: string | null;
  user_email: string | null;
  rating: number;
  category: string;
  message: string;
  status: "new" | "reviewed" | "resolved";
  created_at: Date | string;
  admin_reply: string | null;
  admin_replied_at: Date | string | null;
}

async function FeedbackList() {
  const [feedback] = await pool.execute<FeedbackRow[]>(
    `SELECT
       f.id,
       f.rating,
       f.category,
       f.message,
       f.status,
       f.created_at,
       f.admin_reply,
       f.admin_replied_at,
       u.name AS user_name,
       u.email AS user_email
     FROM feedback f
     LEFT JOIN users u ON f.user_id = u.id
     ORDER BY f.created_at DESC`
  );

  const newCount = feedback.filter(
    (item) => item.status === "new"
  ).length;

  const reviewedCount = feedback.filter(
    (item) => item.status === "reviewed"
  ).length;

  const resolvedCount = feedback.filter(
    (item) => item.status === "resolved"
  ).length;

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-purple-700">
          TicketCircle Administration
        </p>

        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
          Feedback Management
        </h2>

        <p className="mt-2 text-slate-600">
          View feedback from all users, update its status, and reply to submissions.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">New Feedback</p>
          <p className="mt-2 text-4xl font-extrabold text-amber-600">
            {newCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Reviewed</p>
          <p className="mt-2 text-4xl font-extrabold text-purple-700">
            {reviewedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Resolved</p>
          <p className="mt-2 text-4xl font-extrabold text-emerald-600">
            {resolvedCount}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">
            All User Feedback ({feedback.length})
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Every submission appears below, newest first.
          </p>
        </div>

        {feedback.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-bold text-slate-900">
              No feedback submitted yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              User submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {feedback.map((item) => (
              <article key={item.id} className="p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                        {item.category}
                      </span>

                      <span className="text-sm font-semibold text-amber-600">
                        {"★".repeat(
                          Math.max(0, Math.min(5, Number(item.rating)))
                        )}
                        <span className="ml-1 text-slate-500">
                          {item.rating}/5
                        </span>
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap break-words text-slate-800">
                      {item.message}
                    </p>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Submitted by
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {item.user_name || "Unknown user"}
                      </p>
                      <p className="break-words text-sm text-slate-600">
                        {item.user_email || "Email unavailable"}
                      </p>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Submitted:{" "}
                      {new Date(item.created_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>

                  <div className="sm:w-48 sm:shrink-0">
                    <FeedbackStatus
                      id={Number(item.id)}
                      initialStatus={item.status}
                    />
                  </div>
                </div>

                {item.admin_reply && (
                  <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4">
                    <p className="font-bold text-purple-900">
                      Current admin reply
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">
                      {item.admin_reply}
                    </p>

                    {item.admin_replied_at && (
                      <p className="mt-2 text-xs text-slate-500">
                        Last replied:{" "}
                        {new Date(item.admin_replied_at).toLocaleString(
                          "en-IN",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }
                        )}
                      </p>
                    )}
                  </div>
                )}

                <FeedbackReply
                  id={Number(item.id)}
                  initialReply={item.admin_reply}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default async function AdminFeedbackPage() {
  await connection();

  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return <FeedbackList />;
}
