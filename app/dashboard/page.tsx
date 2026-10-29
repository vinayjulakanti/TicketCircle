
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Ticket = {
  id: number;
  transport_type: "train" | "bus";
  vehicle_name: string;
  departure_city: string;
  destination_city: string;
  travel_date: string;
  arrival_date?: string | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  passenger_age?: number;
  passenger_gender?: string;
  ticket_count: number;
  selling_price: number | string;
  status?: string;
  ticket_details?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not specified";

  const parts = value.slice(0, 10).split("-");

  if (parts.length !== 3) return value;

  const [year, month, day] = parts.map(Number);

  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "Not specified";

  const match = value.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return value;

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatPrice(value: number | string) {
  return Number(value).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ticket-listings?mine=true", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to load your tickets.");
      }

      const rows = Array.isArray(data.listings)
        ? data.listings
        : Array.isArray(data.tickets)
          ? data.tickets
          : Array.isArray(data)
            ? data
            : null;

      if (!rows) {
        throw new Error("The server returned an unexpected ticket list.");
      }

      setTickets(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your tickets."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function updateTicketStatus(
    id: number,
    status: "sold" | "withdrawn"
  ) {
    const message =
      status === "sold"
        ? "Mark this ticket as sold out?"
        : "Withdraw this ticket from sale?";

    if (!window.confirm(message)) return;

    setBusyId(id);
    setError("");

    try {
      const response = await fetch("/api/ticket-listings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update ticket.");
      }

      await loadTickets();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update ticket."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTicket(id: number) {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this ticket listing?"
      )
    ) {
      return;
    }

    setBusyId(id);
    setError("");

    try {
      const response = await fetch(
        `/api/ticket-listings?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete ticket.");
      }

      setTickets((current) => current.filter((ticket) => ticket.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete ticket."
      );
    } finally {
      setBusyId(null);
    }
  }

  const availableCount = tickets.filter(
    (ticket) => !ticket.status || ticket.status === "available"
  ).length;

  const soldCount = tickets.filter(
    (ticket) => ticket.status === "sold"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Purple gradient heading */}
      <section className="bg-gradient-to-r from-indigo-700 via-purple-700 to-purple-600 px-5 py-10 text-white sm:px-8 sm:py-14">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-purple-100">
              TicketCircle Marketplace
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              My Dashboard
            </h1>
            <p className="mt-3 text-base text-purple-100 sm:text-lg">
              Manage your listed tickets and journey details.
            </p>
          </div>

          <Link
            href="/sell-ticket"
            className="inline-flex w-fit items-center justify-center rounded-xl bg-white px-6 py-4 font-bold text-purple-700 transition hover:bg-purple-50"
          >
            + Sell Another Ticket
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">My Listings</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : tickets.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">Total listings</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Available Listings
            </p>
            <p className="mt-2 text-3xl font-extrabold text-purple-700">
              {loading ? "—" : availableCount}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Currently available
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Sold Out</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700">
              {loading ? "—" : soldCount}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Marked as sold
            </p>
          </div>
        </div>

        {/* Listings heading */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">My Tickets</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage your published ticket listings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTickets()}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadTickets()}
              className="mt-2 font-bold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading your tickets...
          </div>
        ) : !error && tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h3 className="text-xl font-bold text-slate-900">
              No tickets listed yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Your published listings will appear here.
            </p>
            <Link
              href="/sell-ticket"
              className="mt-6 inline-flex rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white hover:bg-purple-800"
            >
              Sell Your First Ticket
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {tickets.map((ticket) => {
              const isAvailable =
                !ticket.status || ticket.status === "available";
              const isBusy = busyId === ticket.id;

              return (
                <article
                  key={ticket.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5">
                    <div>
                      <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold capitalize text-purple-700">
                        {ticket.transport_type}
                      </span>
                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {ticket.vehicle_name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Listing #{ticket.id}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-extrabold text-purple-700">
                        {formatPrice(ticket.selling_price)}
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          ticket.status === "sold"
                            ? "bg-emerald-100 text-emerald-800"
                            : ticket.status === "withdrawn"
                              ? "bg-slate-200 text-slate-700"
                              : ticket.status === "reserved"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                        }`}
                      >
                        {ticket.status || "available"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5 p-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-slate-900">
                          {ticket.departure_city}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Departure
                        </p>
                      </div>

                      <span className="text-xl text-purple-600" aria-hidden="true">
                        →
                      </span>

                      <div className="min-w-0 text-right">
                        <p className="break-words font-bold text-slate-900">
                          {ticket.destination_city}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Destination
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-500">Travel date</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(ticket.travel_date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Arrival date</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(ticket.arrival_date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Departure time</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatTime(ticket.departure_time)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Arrival time</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatTime(ticket.arrival_time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                      <p>
                        <strong className="text-slate-800">Tickets:</strong>{" "}
                        {ticket.ticket_count}
                      </p>
                      {ticket.passenger_age != null && (
                        <p>
                          <strong className="text-slate-800">Age:</strong>{" "}
                          {ticket.passenger_age}
                        </p>
                      )}
                      {ticket.passenger_gender && (
                        <p>
                          <strong className="text-slate-800">Gender:</strong>{" "}
                          {ticket.passenger_gender.replaceAll("_", " ")}
                        </p>
                      )}
                    </div>

                    {ticket.ticket_details && (
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-600">
                          Additional details
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
                          {ticket.ticket_details}
                        </p>
                      </div>
                    )}

                    {/* Ticket actions */}
                    <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                      {isAvailable && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void updateTicketStatus(ticket.id, "sold")
                            }
                            className="rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-50"
                          >
                            {isBusy ? "Updating..." : "Mark as Sold Out"}
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void updateTicketStatus(ticket.id, "withdrawn")
                            }
                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                          >
                            Withdraw Listing
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void deleteTicket(ticket.id)}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {isBusy ? "Please wait..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/tickets"
            className="font-semibold text-purple-700 hover:text-purple-900"
          >
            ← Find more tickets
          </Link>
        </div>
      </section>
    </main>
  );
}
