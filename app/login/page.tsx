
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const text = await response.text();

      let data: {
  message?: string;
  error?: string;
  redirectTo?: string;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    role?: "admin" | "user";
  };
};

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "The server returned an invalid response. Please try again."
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      
const destination =
  data.redirectTo ||
  (data.user?.role === "admin" ? "/admin" : "/tickets");

window.location.href = destination;
return;

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = "/api/auth/google";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-4 sm:px-6 lg:flex lg:items-center lg:justify-center lg:py-5">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        {/* TicketCircle welcome panel */}
        <section className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-purple-600 px-7 py-9 text-white sm:px-10 lg:px-12 lg:py-8">
          {/* Decorative background circles */}
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-fuchsia-400/20"
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-purple-50 sm:text-sm">
              <span aria-hidden="true">✦</span>
              YOUR NEXT JOURNEY STARTS HERE
            </div>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight sm:text-5xl">
              Good Trips.
              <br />
              Great Connections.
            </h1>

            <p className="mt-5 max-w-md text-base leading-7 text-purple-100 sm:text-lg">
              Your next journey is closer than you think. Discover train and
              bus ticket listings, explore travel options, and make your plans
              with TicketCircle.
            </p>

            <div className="mt-7 space-y-3">
              <div className="flex items-start gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl">
                  🎟️
                </div>

                <div>
                  <h2 className="font-bold">Discover your next ride</h2>
                  <p className="mt-1 text-sm leading-6 text-purple-100">
                    Explore available train and bus ticket listings for your
                    route.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl">
                  🚆
                </div>

                <div>
                  <h2 className="font-bold">Your travel, your way</h2>
                  <p className="mt-1 text-sm leading-6 text-purple-100">
                    Search by journey details and compare listings that suit
                    you.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl">
                  ✨
                </div>

                <div>
                  <h2 className="font-bold">List with confidence</h2>
                  <p className="mt-1 text-sm leading-6 text-purple-100">
                    Manage your listings and offer tickets only when transfer
                    rules permit.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm font-medium leading-6 text-purple-100">
              Every journey has a story. Let yours begin here.
            </p>
          </div>
        </section>

        {/* Login form */}
        <section className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-12 lg:py-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-widest text-purple-700">
              Welcome to TicketCircle
            </p>

            <h2 className="mt-2 text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Sign In
            </h2>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Your next journey starts with a simple sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-purple-700 hover:text-purple-900 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-16 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-4 text-sm font-semibold text-purple-700 hover:text-purple-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-700 px-4 py-3.5 font-bold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Alternative sign-in */}
          <div className="my-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 48 48"
              className="h-5 w-5"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.1 13.22l7.98 6.19C12.97 13.72 18.04 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.84 46.98 24.55z"
              />
              <path
                fill="#FBBC05"
                d="M11.08 28.59A14.4 14.4 0 0 1 10.3 24c0-1.59.27-3.13.76-4.59L3.1 13.22A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 3.1 10.78l7.98-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-5.96 0-11.03-4.22-12.92-9.91L3.1 34.78C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            Continue with Google
          </button>

          <div className="my-5 border-t border-slate-200" />

          <p className="text-center text-sm text-slate-600">
            New to TicketCircle?{" "}
            <Link
              href="/register"
              className="font-bold text-purple-700 hover:text-purple-900 hover:underline"
            >
              Create Your Account
            </Link>
          </p>

          <p className="mt-4 text-center text-xs leading-5 text-slate-400">
            By signing in, you agree to use TicketCircle in accordance with
            applicable ticket transfer and resale rules.
          </p>
        </section>
      </div>
    </main>
  );
}
