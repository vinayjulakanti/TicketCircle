
"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";

const categories = [
  "General feedback",
  "Report a bug",
  "Suggest a feature",
  "Ticket buying or selling",
  "Login or account issue",
];

export default function FeedbackButton() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("General feedback");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Keep the feedback widget off authentication pages.
  if (
    ["/login", "/register", "/signup", "/forgot-password", "/reset-password"]
      .includes(pathname)
  ) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (rating < 1 || rating > 5) {
      setNotice("Please select a star rating.");
      return;
    }

    if (message.trim().length < 5) {
      setNotice("Please enter at least 5 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          category,
          message: message.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setNotice(result.message || "Unable to submit feedback.");
        return;
      }

      setSubmitted(true);
      setNotice("Thank you! Your feedback has been submitted.");
      setMessage("");
    } catch {
      setNotice("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function closeForm() {
    setIsOpen(false);
    setSubmitted(false);
    setNotice("");
  }

  return (
    <>
      {/* Floating feedback button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setNotice("");
          setSubmitted(false);
        }}
        aria-label="Give feedback"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-700 to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-900/25 transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-200"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 4a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        </svg>
        Feedback
      </button>

      {/* Feedback popup */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-purple-600 px-6 py-5 text-white">
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close feedback form"
                className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-100">
                TicketCircle community
              </p>
              <h2
                id="feedback-title"
                className="mt-2 text-2xl font-extrabold"
              >
                {submitted ? "Thank you!" : "We value your feedback"}
              </h2>
              <p className="mt-1 pr-6 text-sm leading-5 text-purple-100">
                {submitted
                  ? "Your feedback helps us improve every journey."
                  : "Tell us how we can make your experience better."}
              </p>
            </div>

            <div className="p-6">
              {submitted ? (
                <div className="py-5 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">
                    ✓
                  </div>
                  <p className="mt-4 font-bold text-slate-900">
                    Feedback submitted successfully
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Thank you for helping improve TicketCircle!
                  </p>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="mt-6 w-full rounded-xl bg-indigo-700 px-4 py-3 font-bold text-white hover:bg-indigo-800"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <fieldset>
                    <legend className="text-sm font-bold text-slate-800">
                      How was your experience?
                    </legend>
                    <div
                      className="mt-3 flex gap-2"
                      role="group"
                      aria-label="Rating from 1 to 5 stars"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          aria-label={`${star} out of 5 stars`}
                          aria-pressed={rating === star}
                          className="rounded-lg p-1 text-3xl transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <span
                            className={
                              star <= rating
                                ? "text-amber-400"
                                : "text-slate-300"
                            }
                          >
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {rating === 0
                        ? "Select a rating"
                        : `${rating} out of 5 stars`}
                    </p>
                  </fieldset>

                  <div>
                    <label
                      htmlFor="feedback-category"
                      className="mb-2 block text-sm font-bold text-slate-800"
                    >
                      Feedback category
                    </label>
                    <select
                      id="feedback-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    >
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="feedback-message"
                      className="mb-2 block text-sm font-bold text-slate-800"
                    >
                      Your message
                    </label>
                    <textarea
                      id="feedback-message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Share your thoughts or suggestions..."
                      rows={4}
                      minLength={5}
                      maxLength={2000}
                      required
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <p className="mt-1 text-right text-xs text-slate-500">
                      {message.length}/2000
                    </p>
                  </div>

                  {notice && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                    >
                      {notice}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-700 to-purple-600 px-4 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Submitting..." : "Submit feedback →"}
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    Thank you for helping us improve TicketCircle.
                  </p>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
