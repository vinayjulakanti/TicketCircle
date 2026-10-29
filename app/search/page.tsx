
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

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

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
      if (Array.isArray(parsed)) {
        passengers = parsed as Passenger[];
      }
    } catch {
      passengers = [];
    }
  }

  // Older listings may only contain the first passenger.
  if (passengers.length === 0 && listing.passenger_age != null) {
    passengers = [
      {
        age: Number(listing.passenger_age),
        gender: listing.passenger_gender ?? "",
      },
    ];
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

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    setToday(`${year}-${month}-${day}`);

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

  async function searchTickets(
    event: React.FormEvent<HTMLFormElement>
  ) {
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
      if (filters.type) {
        params.set("transportType", filters.type);
      }

      const response = await fetch(
        `/api/ticket-listings?${params.toString()}`,
        { cache: "no-store" }
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

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        {/* Search form */}
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
            placeholder="e.g. Tirupati"
            required
          />

          <div>
            <label htmlFor="ticket-date" className="mb-2 block text-sm font-bold">
              Travel date
            </label>
            <input
              id="ticket-date"
              required
              type="date"
              min={today || undefined}
              className={inputClass}
              value={filters.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="ticket-age" className="mb-2 block text-sm font-bold">
              Passenger age (optional)
            </label>
            <input
              id="ticket-age"
              type="number"
              min="1"
              max="120"
              className={inputClass}
              placeholder="Any age"
              value={filters.age}
              onChange={(event) => update("age", event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="ticket-gender" className="mb-2 block text-sm font-bold">
              Passenger gender (optional)
            </label>
            <select
              id="ticket-gender"
              className={inputClass}
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

          <div>
            <label htmlFor="ticket-type" className="mb-2 block text-sm font-bold">
              Transport type (optional)
            </label>
            <select
              id="ticket-type"
              className={inputClass}
              value={filters.type}
              onChange={(event) => update("type", event.target.value)}
            >
              <option value="">Train and bus</option>
              <option value="train">Train</option>
              <option value="bus">Bus</option>
            </select>
          </div>

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

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading && (
          <p className="mt-8 text-center text-slate-600">
            Searching available listings...
          </p>
        )}

        {!loading && searched && !error && listings.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold">No matching tickets found</h2>
            <p className="mt-2 text-slate-500">
              Try a different route, date, age, gender, or transport type.
            </p>
          </div>
        )}

        {/* Search results */}
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
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-6 sm:flex-row">
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

                        <p className="mt-2 text-lg font-semibold">
                          {listing.departure_city} → {listing.destination_city}
                        </p>

                        <div className="mt-3 space-y-2 text-sm text-slate-500">
                          <p>
                            <strong>Departure date:</strong>{" "}
                            {formatDate(listing.travel_date)}
                            {" · "}
                            {formatTime(listing.departure_time)}
                          </p>

                          <p>
                            <strong>Arrival date:</strong>{" "}
                            {formatDate(listing.arrival_date)}
                            {" · "}
                            {formatTime(listing.arrival_time)}
                          </p>
                        </div>

                        {/* Passenger details */}
                        <div className="mt-5 space-y-3">
                          <h4 className="font-bold">Passenger details</h4>

                          {passengers.map((passenger, index) => (
                            <div
                              key={index}
                              className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"
                            >
                              <p>
                                <strong>Passenger {index + 1} age:</strong>{" "}
                                {passenger.age}
                              </p>

                              <p>
                                <strong>Gender:</strong>{" "}
                                {genderLabels[passenger.gender] ||
                                  passenger.gender ||
                                  "Not provided"}
                              </p>
                            </div>
                          ))}

                          {listing.ticket_count > passengers.length && (
                            <p className="text-sm font-medium text-amber-700">
                              Details for {listing.ticket_count - passengers.length}{" "}
                              additional passenger(s) have not been saved for
                              this listing.
                            </p>
                          )}
                        </div>

                        <p className="mt-4 text-sm">
                          <strong>Tickets listed:</strong>{" "}
                          {listing.ticket_count}
                        </p>

                        {listing.ticket_details && (
                          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {listing.ticket_details}
                          </p>
                        )}

                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase text-slate-500">
                            Seller&apos;s phone number
                          </p>

                          <a
                            href={`tel:${listing.seller_phone}`}
                            className="mt-2 inline-block break-all font-bold text-indigo-700 underline"
                          >
                            {listing.seller_phone}
                          </a>
                        </div>
                      </div>

                      <div className="sm:min-w-44 sm:text-right">
                        <p className="text-sm text-slate-500">Selling price</p>

                        <p className="mt-1 text-3xl font-black text-indigo-700">
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

        <p className="mt-8 text-xs leading-6 text-slate-500">
          TicketCircle listings do not guarantee that a ticket is transferable.
          Confirm the operator&apos;s rules and ticket validity before making
          any payment. Never share OTPs, passwords, or payment credentials
          with a seller.
        </p>
      </section>
    </main>
  );
}
