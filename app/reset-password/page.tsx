
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      setError("This reset link is invalid. Request a new password reset.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Your password must be between 8 and 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ token, password }),
      });

      const text = await response.text();

      let data: { message?: string; error?: string };

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to reset your password.");
      }

      setSuccess(data.message || "Your password has been reset.");
      setPassword("");
      setConfirmPassword("");

      // Remove the reset token from the address bar.
      window.history.replaceState(null, "", "/reset-password");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password. Please try again."
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl text-purple-700">
              🔐
            </div>

            <h1 className="mt-5 text-3xl font-extrabold text-slate-900">
              Reset Password
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Choose a new password for your TicketCircle account.
            </p>
          </div>

          {!token && !success && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No reset token was found in this link. Request a new password
              reset to continue.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute inset-y-0 right-3 text-sm font-semibold text-purple-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter the password again"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
              >
                <p>{success}</p>
                <Link
                  href="/login"
                  className="mt-3 inline-block font-bold underline"
                >
                  Go to Login
                </Link>
              </div>
            )}

            {!success && (
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-xl bg-purple-700 px-4 py-3.5 font-bold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Resetting Password..." : "Save New Password"}
              </button>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link
              href="/forgot-password"
              className="font-semibold text-purple-700 hover:underline"
            >
              Request a new reset link
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
