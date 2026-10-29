
"use client";

import { useState } from "react";

export default function FeedbackReply({
  id,
  initialReply,
}: {
  id: number;
  initialReply: string | null;
}) {
  const [reply, setReply] = useState(initialReply ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function sendReply() {
    const trimmed = reply.trim();

    if (!trimmed) {
      setMessage("Please enter a reply.");
      return;
    }

    if (trimmed.length > 5000) {
      setMessage("Your reply must be 5000 characters or fewer.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "reply",
          id,
          reply: trimmed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send reply.");
      }

      setReply(trimmed);
      setMessage("Reply saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to send reply."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4">
      <label
        htmlFor={`admin-reply-${id}`}
        className="block font-bold text-slate-900"
      >
        Reply to user
      </label>

      <textarea
        id={`admin-reply-${id}`}
        value={reply}
        onChange={(event) => setReply(event.target.value)}
        maxLength={5000}
        rows={3}
        placeholder="Write a helpful response..."
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-purple-500"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          {reply.length}/5000 characters
        </span>

        <button
          type="button"
          onClick={sendReply}
          disabled={saving || !reply.trim()}
          className="rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : initialReply ? "Update reply" : "Send reply"}
        </button>
      </div>

      {message && (
        <p role="status" className="mt-3 text-sm text-slate-700">
          {message}
        </p>
      )}
    </div>
  );
}
