
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          if (active) {
            setLoggedIn(false);
            setNotifications([]);
            setUnreadCount(0);
          }
          return;
        }

        const data = await response.json();

        if (active) setLoggedIn(data.loggedIn === true);
      } catch {
        if (active) setLoggedIn(false);
      } finally {
        if (active) setCheckingAuth(false);
      }
    }

    setCheckingAuth(true);
    checkAuth();

    return () => {
      active = false;
    };
  }, [pathname]);

  async function loadNotifications() {
    setLoadingNotifications(true);
    setNotificationError("");

    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (response.status === 401) {
        setLoggedIn(false);
        setNotifications([]);
        setUnreadCount(0);
        setNotificationError("Please sign in to view notifications.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load notifications.");
      }

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to load notifications."
      );
    } finally {
      setLoadingNotifications(false);
    }
  }

  useEffect(() => {
    if (loggedIn && !checkingAuth) {
      loadNotifications();
    }
    // Refresh the notification list when the user navigates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, checkingAuth, pathname]);

  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      const target = event.target as Node;

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", closeMenus);

    return () => {
      document.removeEventListener("mousedown", closeMenus);
    };
  }, []);

  async function markAsRead(id: number) {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((items) =>
      items.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
    );

    setUnreadCount((count) =>
      Math.max(
        0,
        count - (previousNotifications.find((item) => item.id === id)?.isRead ? 0 : 1)
      )
    );

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Unable to mark notification as read.");
      }
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      setNotificationError("Unable to update notification. Please try again.");
    }
  }

  async function markAllAsRead() {
    setNotificationError("");

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ markAll: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update notifications.");
      }

      setNotifications((items) =>
        items.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to update notifications."
      );
    }
  }

  async function openNotification(item: NotificationItem) {
    if (!item.isRead) {
      await markAsRead(item.id);
    }

    setNotificationOpen(false);

    // Only allow internal application links.
    if (item.link?.startsWith("/") && !item.link.startsWith("//")) {
      router.push(item.link);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) throw new Error("Unable to sign out.");

      setLoggedIn(false);
      setProfileOpen(false);
      setNotificationOpen(false);
      setNotifications([]);
      setUnreadCount(0);

      router.replace("/login");
      router.refresh();
    } catch {
      alert("Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  function navClass(href: string) {
    const active = pathname === href;

    return `whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition sm:px-4 ${
      active
        ? "bg-purple-50 text-purple-700"
        : "text-slate-800 hover:bg-slate-100 hover:text-purple-700"
    }`;
  }

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/tickets"
          className="shrink-0 text-xl font-extrabold tracking-tight sm:text-3xl"
        >
          <span className="text-slate-950">Ticket</span>
          <span className="text-purple-700">Circle</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
         



<Link href="/tickets" className={navClass("/tickets")}>
  Home
</Link>




          <Link
            href="/tickets"
            className={`${navClass("/tickets")} hidden md:inline-flex`}
          >
            Find Tickets
          </Link>

          <Link
            href={loggedIn ? "/sell-ticket" : "/login"}
            className="whitespace-nowrap rounded-xl bg-purple-700 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-purple-800 sm:px-5"
          >
            <span className="hidden sm:inline">
              + Sell {pathname === "/dashboard" ? "Another " : "a "}Ticket
            </span>
            <span className="sm:hidden">+ Sell</span>
          </Link>

          {!checkingAuth &&
            (loggedIn ? (
              <>
                {/* Notifications bell */}
                <div className="relative ml-1" ref={notificationRef}>
                  <button
                    type="button"
                    aria-label={`Notifications, ${unreadCount} unread`}
                    aria-expanded={notificationOpen}
                    onClick={() => {
                      setNotificationOpen((open) => !open);
                      setProfileOpen(false);
                      if (!notificationOpen) loadNotifications();
                    }}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-purple-50 hover:text-purple-700 sm:h-11 sm:w-11"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                      <path d="M10 21h4" />
                    </svg>

                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                        <div>
                          <h2 className="font-bold text-slate-900">
                            Notifications
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            {unreadCount} unread
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={loadNotifications}
                          disabled={loadingNotifications}
                          className="rounded-lg px-2 py-1 text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                        >
                          Refresh
                        </button>
                      </div>

                      {unreadCount > 0 && (
                        <div className="border-b border-slate-100 px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-xs font-semibold text-purple-700 hover:underline"
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}

                      {notificationError && (
                        <p role="alert" className="px-4 py-3 text-sm text-red-600">
                          {notificationError}
                        </p>
                      )}

                      <div className="max-h-96 overflow-y-auto">
                        {loadingNotifications && notifications.length === 0 ? (
                          <p className="px-4 py-8 text-center text-sm text-slate-500">
                            Loading notifications...
                          </p>
                        ) : notifications.length === 0 ? (
                          <div className="px-5 py-10 text-center">
                            <div className="mb-3 text-3xl">🔔</div>
                            <p className="font-semibold text-slate-800">
                              You&apos;re all caught up!
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              New notifications will appear here.
                            </p>
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => openNotification(item)}
                              className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-purple-50 ${
                                item.isRead ? "bg-white" : "bg-purple-50/60"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                    item.isRead ? "bg-slate-300" : "bg-purple-600"
                                  }`}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-slate-900">
                                    {item.title}
                                  </span>
                                  <span className="mt-1 block break-words text-sm leading-5 text-slate-600">
                                    {item.message}
                                  </span>
                                  <span className="mt-2 block text-xs text-slate-400">
                                    {new Date(item.createdAt).toLocaleString()}
                                  </span>
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Existing profile icon and dropdown */}
                <div className="relative ml-1" ref={profileRef}>
                  <button
                    type="button"
                    aria-label="Open profile menu"
                    aria-expanded={profileOpen}
                    onClick={() => {
                      setProfileOpen((open) => !open);
                      setNotificationOpen(false);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-800 hover:bg-purple-50 hover:text-purple-700 sm:h-11 sm:w-11"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                    </svg>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-14 z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm text-slate-700 hover:bg-purple-50"
                      >
                        My Profile
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm text-slate-700 hover:bg-purple-50"
                      >
                        Dashboard
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm text-slate-700 hover:bg-purple-50"
                      >
                        Settings
                      </Link>

                      <Link
                        href="/faq"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm text-slate-700 hover:bg-purple-50"
                      >
                        FAQ
                      </Link>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        disabled={signingOut}
                        onClick={handleSignOut}
                        className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {signingOut ? "Signing out..." : "Sign Out"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className="rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:px-3"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl border border-purple-700 px-2 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 sm:px-3"
                >
                  Sign Up
                </Link>
              </div>
            ))}
        </div>
      </nav>
    </header>
  );
}
