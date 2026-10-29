
"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    setMessage("");

    if (name.trim().length < 2) {
      setMessage("Please enter your full name.");
      return;
    }

    const passwordPattern =
      /^[A-Z](?=.*[0-9])(?=.*[^A-Za-z0-9]).{7,}$/;

    if (password.length > 72 || !passwordPattern.test(password)) {
      setMessage(
        "Password must be at least 8 characters, start with a capital letter, and contain at least one number and one symbol."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords don't match. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const responseText = await response.text();

let result: { message?: string };

try {
  result = JSON.parse(responseText);
} catch {
  console.error("Registration response:", responseText.slice(0, 500));
  setMessage("Registration API error. Please check the VS Code terminal.");
  return;
}

      if (!response.ok) {
        setMessage(result.message || "Account creation failed.");
        return;
      }

      setSuccess(true);
      setMessage("Account created successfully! Welcome to TicketCircle.");
      setPassword("");
      setConfirmPassword("");

      window.location.href = "/";
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Could not connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }


  function EyeIcon({ visible }: { visible: boolean }) {
    return visible ? (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
        <path d="M9.9 5.2A10.8 10.8 0 0121.5 12c-.4 1-1.3 2.2-2.5 3.3" />
        <path d="M6.2 6.2C3.8 7.7 2.5 10 2.5 12c1 2.5 4.5 7 9.5 7 1 0 2-.2 2.9-.5" />
      </svg>
    ) : (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7ff] px-4 py-3 sm:px-6 lg:py-3">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-xl font-black text-white shadow-lg shadow-blue-200">
              T
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
              Ticket<span className="text-blue-700">Circle</span>
            </span>
          </Link>

          <p className="text-sm font-medium text-slate-600">
            Already a member?{" "}
            <Link
              href="/login"
              className="font-bold text-blue-700 hover:text-blue-900"
            >
              Log in
            </Link>
          </p>
        </header>

        <div className="mt-3 grid overflow-hidden rounded-3xl bg-white shadow-xl shadow-blue-950/5 lg:mt-3 lg:grid-cols-2">
          <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-purple-600 px-7 py-7 text-white sm:px-9 sm:py-8 lg:flex lg:flex-col lg:justify-between lg:p-8">
            <div className="pointer-events-none absolute -right-20 top-16 h-56 w-56 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-10 top-28 h-40 w-40 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/5" />

            <div className="relative">
              <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                Join our community
              </span>

              <h1 className="mt-5 max-w-lg text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Your next journey begins with a connection.
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-blue-100 sm:text-base">
                Create your account to explore train and bus journeys, discover
                permitted travel options, and connect with travellers across
                India.
              </p>
            </div>

            <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                  🚆
                </div>
                <div>
                  <p className="text-sm font-bold">
                    Welcome to TicketCircle
                  </p>
                  <p className="mt-1 text-sm text-blue-100">
                    Travel plans change. People connect.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white/10 px-3 py-2">
                  🇮🇳 Across India
                </span>
                <span className="rounded-full bg-white/10 px-3 py-2">
                  🔒 Privacy matters
                </span>
                <span className="rounded-full bg-white/10 px-3 py-2">
                  No platform payments
                </span>
              </div>
            </div>
          </section>

          <section className="flex items-center px-6 py-7 sm:px-9 sm:py-8 lg:px-10 lg:py-6">
            <div className="mx-auto w-full max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Create your account
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                Get started
              </h2>

              <p className="mt-2 text-sm leading-5 text-slate-600">
                Join the community in a few simple steps.
              </p>

              <form onSubmit={handleRegister} className="mt-5 space-y-3">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-bold text-slate-800"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-bold text-slate-800"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-bold text-slate-800"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-sm font-bold text-slate-800"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter your password again"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      aria-pressed={showConfirmPassword}
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    >
                      <EyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                </div>

                {message && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`rounded-xl p-3 text-sm leading-5 ${
                      success
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {message}
                  </p>
                )}

                <button
  type="submit"
  disabled={isLoading}
  className="w-full rounded-xl bg-blue-700 px-4 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isLoading ? "Creating account..." : "Create account →"}
</button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-blue-700 hover:underline"
                >
                  Log in
                </Link>
              </p>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Your contact details stay private unless you consent to sharing
                them. TicketCircle does not process ticket payments.
              </p>
            </div>
          </section>
        </div>

        <footer className="py-3 text-center text-xs text-slate-500">
          © TicketCircle · Travel plans change. People connect.
        </footer>
      </div>
    </main>
  );
}
