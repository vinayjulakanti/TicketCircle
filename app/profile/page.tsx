
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";

type Profile = {
  name: string;
  email: string;
  phone: string;
  gender: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    phone: "",
    gender: "prefer_not_to_say",
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
        });

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            "The profile API returned HTML instead of JSON. Check that app/api/profile/route.ts exists and inspect your terminal."
          );
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load your profile."
          );
        }

        if (!data.user) {
          throw new Error("Profile information was not returned.");
        }

        if (!cancelled) {
          setProfile({
            name: data.user.name ?? "",
            email: data.user.email ?? "",
            phone: data.user.phone ?? "",
            gender:
              data.user.gender ?? "prefer_not_to_say",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          gender: profile.gender,
        }),
      });

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The profile API returned HTML instead of JSON. Check app/api/profile/route.ts and inspect your terminal."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save your profile."
        );
      }

      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-600">
          Loading your profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-6 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:p-10">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-4xl">
                👤
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Your profile
                </h1>

                <p className="mt-2 text-gray-500">
                  {profile.email || "No email available"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (editing) {
                  setEditing(false);
                  setError("");
                  setMessage("");
                } else {
                  setEditing(true);
                  setError("");
                  setMessage("");
                }
              }}
              className="rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition hover:bg-indigo-700"
            >
              {editing ? "Cancel" : "✏️ Edit Profile"}
            </button>
          </div>

          <div className="p-6 sm:p-10">
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl bg-red-50 p-4 text-red-700"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="mb-6 rounded-xl bg-green-50 p-4 text-green-700"
              >
                {message}
              </div>
            )}

            <form onSubmit={saveProfile}>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-3 block font-semibold text-gray-700"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    type="text"
                    required
                    maxLength={100}
                    disabled={!editing}
                    value={profile.name}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        name: event.target.value,
                      })
                    }
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 outline-none focus:border-indigo-500 disabled:opacity-80"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-3 block font-semibold text-gray-700"
                  >
                    Gmail / Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    disabled
                    value={profile.email}
                    placeholder="Registered email address"
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-5 py-4 text-gray-700"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    Email cannot be changed here.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-3 block font-semibold text-gray-700"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    maxLength={20}
                    disabled={!editing}
                    value={profile.phone}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        phone: event.target.value,
                      })
                    }
                    placeholder="Enter your phone number"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 outline-none focus:border-indigo-500 disabled:opacity-80"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="mb-3 block font-semibold text-gray-700"
                  >
                    Gender
                  </label>

                  <select
                    id="gender"
                    disabled={!editing}
                    value={profile.gender}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        gender: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 outline-none focus:border-indigo-500 disabled:opacity-80"
                  >
                    <option value="prefer_not_to_say">
                      Prefer not to say
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {editing && (
                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-purple-700 px-8 py-4 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
