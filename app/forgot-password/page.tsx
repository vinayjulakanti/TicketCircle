
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const text = await response.text();
      let data: { message?: string; error?: string };

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to process your request.");
      }

      setMessage(
        data.message ||
          "If an account exists for that email, reset instructions will be sent."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-3xl font-extrabold tracking-tight">
            <span className="text-slate-950">Ticket</span>
            <span className="text-purple-700">Circle</span>
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50"
          >
            Login
          </Link>
        </nav>
      </header>

      <section className="flex items-center justify-center px-4 py-14 sm:py-20">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-9">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Forgot Password?
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Enter your registered email address and we will send reset
              instructions if an account matches.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-700 px-4 py-3.5 font-bold text-white hover:bg-purple-800 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold text-purple-700 hover:underline"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
