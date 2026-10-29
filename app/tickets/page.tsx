
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import CityAutocomplete from "@/components/CityAutocomplete";

type Passenger = {
  age: number;
  gender: string;
};

type TicketListing = {
  id: number;
  transport_type: "train" | "bus";
  vehicle_name: string;
  departure_city: string;
  destination_city: string;
  travel_date: string;
  arrival_date: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  passenger_age: number;
  passenger_gender: string;
  ticket_count: number;
  passengers?: Passenger[] | string | null;
  selling_price: string | number;
  ticket_details: string | null;
  seller_phone: string;
  transfer_eligibility: string;
};

type Filters = {
  from: string;
  to: string;
  date: string;
  age: string;
  gender: string;
  type: string;
};

const genderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not provided";
  return String(value).slice(0, 10);
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "Not provided";
  return String(value).slice(0, 5);
}

function getPassengers(listing: TicketListing): Passenger[] {
  let passengers: Passenger[] = [];

  if (Array.isArray(listing.passengers)) {
    passengers = listing.passengers;
  } else if (typeof listing.passengers === "string") {
    try {
      const parsed: unknown = JSON.parse(listing.passengers);
      if (Array.isArray(parsed)) passengers = parsed as Passenger[];
    } catch {
      passengers = [];
    }
  }

  if (passengers.length === 0 && listing.passenger_age != null) {
    passengers = [{
      age: Number(listing.passenger_age),
      gender: listing.passenger_gender ?? "",
    }];
  }

  return passengers;
}

export default function TicketSearchPage() {
  const [today, setToday] = useState("");

  const [filters, setFilters] = useState<Filters>({
    from: "",
    to: "",
    date: "",
    age: "",
    gender: "",
    type: "",
  });

  const [listings, setListings] = useState<TicketListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Calculate today's date after the component mounts.
  // This avoids evaluating the current date during prerendering.
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    setToday(`${year}-${month}-${day}`);
  }, []);

  // Read the search filters from the URL when the page opens.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setFilters({
      from: params.get("from") || "",
      to: params.get("to") || "",
      date: params.get("date") || "",
      age: params.get("age") || "",
      gender: params.get("gender") || "",
      type: params.get("type") || "",
    });
  }, []);

  function update(field: keyof Filters, value: string) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function searchTickets(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      filters.from.trim().toLowerCase() ===
      filters.to.trim().toLowerCase()
    ) {
      setError("Departure city and destination city cannot be the same.");
      return;
    }

    setLoading(true);
    setError("");
    setListings([]);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        from: filters.from.trim(),
        to: filters.to.trim(),
        date: filters.date,
      });

      if (filters.age) params.set("age", filters.age);
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.type) params.set("transportType", filters.type);

      const response = await fetch(
        `/api/ticket-listings?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to search tickets."
        );
      }

      setListings(data.listings || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to search tickets."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation */}
      <Navbar />

      {/* Purple banner */}
      <section className="bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-10 text-white sm:py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold text-indigo-200">
            TICKETCIRCLE MARKETPLACE
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Find a ticket
          </h1>

          <p className="mt-4 text-base text-indigo-100 sm:text-lg">
            Search listings by journey and passenger details.
          </p>
        </div>
      </section>

      {/* Search form */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <form
          onSubmit={searchTickets}
          className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-7 lg:grid-cols-3"
        >
          <CityAutocomplete
            id="ticket-from"
            label="Departure city"
            value={filters.from}
            onChange={(value) => update("from", value)}
            placeholder="e.g. Guntur"
            required
          />

          <CityAutocomplete
            id="ticket-to"
            label="Destination city"
            value={filters.to}
            onChange={(value) => update("to", value)}
            placeholder="e.g. Vijayawada"
            required
          />

          {/* Travel date */}
          <div>
            <label
              htmlFor="ticket-date"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Travel date
            </label>

            <input
              id="ticket-date"
              required
              type="date"
              min={today || undefined}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              value={filters.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </div>

          {/* Passenger age */}
          <div>
            <label
              htmlFor="ticket-age"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Passenger age (optional)
            </label>

            <input
              id="ticket-age"
              type="number"
              min="1"
              max="120"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="Any age"
              value={filters.age}
              onChange={(event) => update("age", event.target.value)}
            />
          </div>

          {/* Passenger gender */}
          <div>
            <label
              htmlFor="ticket-gender"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Passenger gender (optional)
            </label>

            <select
              id="ticket-gender"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              value={filters.gender}
              onChange={(event) => update("gender", event.target.value)}
            >
              <option value="">Any gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          {/* Transport type */}
          <div>
            <label
              htmlFor="ticket-type"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Transport type (optional)
            </label>

            <select
              id="ticket-type"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              value={filters.type}
              onChange={(event) => update("type", event.target.value)}
            >
              <option value="">Train and bus</option>
              <option value="train">Train</option>
              <option value="bus">Bus</option>
            </select>
          </div>

          {/* Search button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search tickets"}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Loading message */}
        {loading && (
          <p className="mt-8 text-center text-slate-600">
            Searching available listings...
          </p>
        )}

        {/* No matching listings */}
        {!loading && searched && !error && listings.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold">
              No matching tickets found
            </h2>
            <p className="mt-2 text-slate-500">
              Try a different route, date, age, gender, or transport type.
            </p>
          </div>
        )}

        {/* Ticket search results */}
        {!loading && listings.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-5 text-2xl font-extrabold">
              {listings.length} matching listing
              {listings.length === 1 ? "" : "s"}
            </h2>

            <div className="grid gap-5">
              {listings.map((listing) => {
                const passengers = getPassengers(listing);

                return (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-indigo-100/60 transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 px-5 py-4 text-white sm:px-7">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                        <span className="text-2xl">🎟️</span>
                      </div>
                      <div>
                        <p className="font-extrabold tracking-wide">TicketCircle</p>
                        <p className="text-xs text-indigo-100">YOUR JOURNEY, YOUR WAY</p>
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-200/40 bg-emerald-300/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-100">
                      Available
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-6 p-5 sm:flex-row sm:p-7">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase text-indigo-700">
                          {listing.transport_type}
                        </span>

                        <span className="text-xs text-slate-500">
                          Listing #{listing.id}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-extrabold">
                        {listing.vehicle_name}
                      </h3>

                      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-indigo-50/80 p-4">
                        <div className="min-w-0">
                          <p className="truncate text-xl font-black text-slate-900">{listing.departure_city}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">From</p>
                        </div>
                        <div className="flex flex-col items-center text-indigo-600">
                          <span className="text-lg">
  {listing.transport_type?.toLowerCase() === "bus"
    ? "🚌"
    : listing.transport_type?.toLowerCase() === "train"
    ? "🚆"
    : "✈️"}
</span>
                          <span className="text-xs">······→</span>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="truncate text-xl font-black text-slate-900">{listing.destination_city}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">To</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Departure</p>
                          <p className="mt-1 font-bold text-slate-900">{formatDate(listing.travel_date)}</p>
                          <p className="text-sm text-indigo-700">{formatTime(listing.departure_time)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Arrival</p>
                          <p className="mt-1 font-bold text-slate-900">{formatDate(listing.arrival_date)}</p>
                          <p className="text-sm text-indigo-700">{formatTime(listing.arrival_time)}</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        <h4 className="font-bold">Passenger details</h4>
                        {passengers.map((passenger, index) => (
                          <div key={index} className="grid gap-3 rounded-xl border border-dashed border-indigo-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                            <p><strong>Passenger {index + 1} age:</strong> {passenger.age}</p>
                            <p><strong>Gender:</strong> {genderLabels[passenger.gender] || passenger.gender || "Not provided"}</p>
                          </div>
                        ))}
                        {listing.ticket_count > passengers.length && (
                          <p className="text-sm font-medium text-amber-700">
                            Details for {listing.ticket_count - passengers.length} additional passenger(s) have not been saved for this listing.
                          </p>
                        )}
                      </div>

                      <p className="mt-4 text-sm">
                        <strong>Tickets listed:</strong> {listing.ticket_count}
                      </p>

                      {listing.ticket_details && (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {listing.ticket_details}
                        </p>
                      )}

                      <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
  <p className="text-xs font-bold uppercase text-slate-500">
    Seller&apos;s phone number
  </p>

  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
    <a
      href={`tel:${listing.seller_phone}`}
      className="inline-flex items-center gap-2 break-all font-bold text-indigo-700 underline"
    >
      <span>📞</span>
      <span>{listing.seller_phone}</span>
    </a>

    <a
      href={`tel:${listing.seller_phone}`}
      className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
    >
      📞 Call
    </a>

    <a
      href={`https://wa.me/${String(listing.seller_phone).replace(/\D/g, "").replace(/^0+/, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
    >
      💬 Chat
    </a>
  </div>
</div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-5 sm:min-w-44 sm:self-start sm:text-right">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total selling price</p>

                      <p className="mt-2 text-3xl font-black text-indigo-700">
                        ₹
                        {Number(listing.selling_price).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Verify availability and permitted transfer with the
                        transport operator before making payment.
                      </p>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Safety notice */}
        <p className="mt-8 text-xs leading-6 text-slate-500">
          TicketCircle listings do not guarantee that a ticket is
          transferable. Confirm the operator&apos;s rules and ticket validity
          before making any payment. Never share OTPs, passwords, or payment
          credentials with a seller.
        </p>
      </section>
    </main>
  );
}
