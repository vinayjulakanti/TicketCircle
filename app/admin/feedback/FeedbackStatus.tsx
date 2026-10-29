
"use client";

import { useState } from "react";

type Status = "new" | "reviewed" | "resolved";

export default function FeedbackStatus({
  id,
  initialStatus,
}: {
  id: number;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: Status) {
    if (saving || nextStatus === status) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          id,
          status: nextStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update status.");
      }

      setStatus(nextStatus);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update status."
      );
    } finally {
      setSaving(false);
    }
  }

  const badgeStyle = {
    new: "bg-amber-100 text-amber-800",
    reviewed: "bg-purple-100 text-purple-800",
    resolved: "bg-emerald-100 text-emerald-800",
  };

  return (
    <div>
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeStyle[status]}`}
      >
        {status}
      </span>

      <label
        htmlFor={`feedback-status-${id}`}
        className="mt-4 block text-xs font-semibold text-slate-600"
      >
        Update status
      </label>

      <select
        id={`feedback-status-${id}`}
        value={status}
        disabled={saving}
        onChange={(event) => updateStatus(event.target.value as Status)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:opacity-50"
      >
        <option value="new">New</option>
        <option value="reviewed">Reviewed</option>
        <option value="resolved">Resolved</option>
      </select>

      {saving && (
        <p className="mt-2 text-xs text-slate-500">Saving...</p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
