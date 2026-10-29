
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

type Profile = {
  id: number;
  name: string;
  email: string;
};

type Preferences = {
  emailTicketUpdates: boolean;
  emailAccountUpdates: boolean;
};

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [preferences, setPreferences] = useState<Preferences>({
    emailTicketUpdates: true,
    emailAccountUpdates: true,
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const [profileResponse, notificationResponse] =
          await Promise.all([
            fetch("/api/user/profile"),
            fetch("/api/user/notifications"),
          ]);

        if (
          profileResponse.status === 401 ||
          notificationResponse.status === 401
        ) {
          router.replace("/login");
          return;
        }

        const profileData = await profileResponse.json();
        const notificationData = await notificationResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData.error || "Unable to load your profile."
          );
        }

        if (!notificationResponse.ok) {
          throw new Error(
            notificationData.error ||
              "Unable to load notification preferences."
          );
        }

        if (!cancelled) {
          setProfile(profileData.user);
          setName(profileData.user.name);
          setPreferences(notificationData.preferences);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load settings."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Your name must be between 2 and 100 characters.");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to save your profile.");
      }

      setName(data.name);
      setProfile((previous) =>
        previous ? { ...previous, name: data.name } : previous
      );
      setMessage("Your profile has been updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveNotifications() {
    setMessage("");
    setError("");
    setSavingPreferences(true);

    try {
      const response = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save notification preferences."
        );
      }

      setPreferences(data.preferences);
      setMessage("Your notification preferences have been saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save notification preferences."
      );
    } finally {
      setSavingPreferences(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPassword.length < 8 || newPassword.length > 72) {
      setError("Your new password must contain 8–72 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must differ from your current password.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to change your password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Your password has been changed successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to change your password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100";

  const buttonClass =
    "rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-purple-700">
            Account
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your profile, password, and communication preferences.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-gray-600 shadow-sm">
            Loading your settings...
          </div>
        ) : (
          <>
            {/* Profile information */}
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Profile Information
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your personal account details.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label
                    htmlFor="profileName"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Full name
                  </label>
                  <input
                    id="profileName"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="profileEmail"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Email address
                  </label>
                  <input
                    id="profileEmail"
                    type="email"
                    readOnly
                    value={profile?.email ?? ""}
                    className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-500`}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Your registered email cannot be changed here.
                  </p>
                </div>

                <button type="submit" disabled={savingProfile} className={buttonClass}>
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </section>

            {/* Password and security */}
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                  🔒
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Password &amp; Security
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Change your password to help protect your account.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Enter your current password"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    New password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter your new password"
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Use 8–72 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Enter your new password again"
                    className={inputClass}
                  />
                </div>

                <button type="submit" disabled={savingPassword} className={buttonClass}>
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>

              <div className="mt-6 rounded-xl bg-purple-50 p-4">
                <p className="text-sm font-semibold text-purple-900">
                  Security tip
                </p>
                <p className="mt-1 text-sm leading-6 text-purple-800">
                  Use a unique password for TicketCircle and never share it
                  with anyone.
                </p>
              </div>
            </section>

            {/* Notification preferences */}
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                  🔔
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Notification Preferences
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose the types of emails you want to receive.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <label className="flex cursor-pointer items-start justify-between gap-4">
                  <span>
                    <span className="block font-semibold text-gray-800">
                      Ticket updates
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-gray-500">
                      Emails about important updates related to your tickets.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.emailTicketUpdates}
                    onChange={(event) =>
                      setPreferences((previous) => ({
                        ...previous,
                        emailTicketUpdates: event.target.checked,
                      }))
                    }
                    className="mt-1 h-5 w-5 shrink-0 accent-purple-700"
                  />
                </label>

                <div className="border-t border-gray-100" />

                <label className="flex cursor-pointer items-start justify-between gap-4">
                  <span>
                    <span className="block font-semibold text-gray-800">
                      Account emails
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-gray-500">
                      General account notices and important service information.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.emailAccountUpdates}
                    onChange={(event) =>
                      setPreferences((previous) => ({
                        ...previous,
                        emailAccountUpdates: event.target.checked,
                      }))
                    }
                    className="mt-1 h-5 w-5 shrink-0 accent-purple-700"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={savingPreferences}
                  className={buttonClass}
                >
                  {savingPreferences ? "Saving..." : "Save Preferences"}
                </button>
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                These preferences are saved to your account. They take effect
                when TicketCircle's email notification system checks them.
              </p>
            </section>

            {/* Help and support */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                  💬
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Help &amp; Support
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Need help using TicketCircle? Start here.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <a
                  href="/faq"
                  className="rounded-xl border border-gray-200 p-4 transition hover:border-purple-300 hover:bg-purple-50"
                >
                  <span className="font-semibold text-gray-900">
                    Frequently Asked Questions
                  </span>
                  <span className="mt-2 block text-sm text-gray-500">
                    Find answers to common questions.
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-purple-700">
                    Visit FAQ →
                  </span>
                </a>

                <a
                  href="/my-feedback"
                  className="rounded-xl border border-gray-200 p-4 transition hover:border-purple-300 hover:bg-purple-50"
                >
                  <span className="font-semibold text-gray-900">
                    My Feedback
                  </span>
                  <span className="mt-2 block text-sm text-gray-500">
                    View your submitted feedback and any admin replies.
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-purple-700">
                    View feedback →
                  </span>
                </a>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
