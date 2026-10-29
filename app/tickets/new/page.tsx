
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function SellTicketPage() {
  const [form, setForm] = useState({
    transportType: "bus",
    vehicleName: "",
    departureCity: "",
    destinationCity: "",
    travelDate: "",
    departureTime: "",
    passengerAge: "22",
    passengerGender: "male",
    ticketCount: "1",
    sellingPrice: "",
    ticketDetails: "",
    sellerPhone: "",
    transferEligibility: "operator_permits_transfer",
    confirmsResalePermitted: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function update(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/ticket-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          passengerAge: Number(form.passengerAge),
          ticketCount: Number(form.ticketCount),
          sellingPrice: Number(form.sellingPrice),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to create listing.");
      }

      setSuccess(true);
setMessage(`Listing created successfully. Listing #${data.listingId}`);

setForm({
  transportType: "bus",
  vehicleName: "",
  departureCity: "",
  destinationCity: "",
  travelDate: "",
  departureTime: "",
  passengerAge: "22",
  passengerGender: "male",
  ticketCount: "1",
  sellingPrice: "",
  ticketDetails: "",
  sellerPhone: "",
  transferEligibility: "operator_permits_transfer",
  confirmsResalePermitted: false,
});
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold">
            Ticket<span className="text-indigo-600">Circle</span>
          </Link>
          <Link href="/tickets" className="text-sm font-semibold text-indigo-700">
            Find tickets
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-black">List a ticket</h1>
        <p className="mt-2 text-slate-600">
          Enter accurate ticket details. Never publish a PNR, QR code,
          booking reference, or photo of the full ticket.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">
                Transport
              </label>
              <select
                className="w-full rounded-xl border p-3"
                value={form.transportType}
                onChange={(e) => update("transportType", e.target.value)}
              >
                <option value="bus">Bus</option>
                <option value="train">Train</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Train or bus name/number
              </label>
              <input
                required
                maxLength={150}
                className="w-full rounded-xl border p-3"
                placeholder="Service name or number"
                value={form.vehicleName}
                onChange={(e) => update("vehicleName", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Departure city
              </label>
              <input
                required
                maxLength={100}
                className="w-full rounded-xl border p-3"
                value={form.departureCity}
                onChange={(e) => update("departureCity", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Destination city
              </label>
              <input
                required
                maxLength={100}
                className="w-full rounded-xl border p-3"
                value={form.destinationCity}
                onChange={(e) => update("destinationCity", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Travel date
              </label>
              <input
                required
                type="date"
                className="w-full rounded-xl border p-3"
                value={form.travelDate}
                onChange={(e) => update("travelDate", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Departure time (optional)
              </label>
              <input
                type="time"
                className="w-full rounded-xl border p-3"
                value={form.departureTime}
                onChange={(e) => update("departureTime", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Passenger age
              </label>
              <input
                required
                type="number"
                min="1"
                max="120"
                className="w-full rounded-xl border p-3"
                value={form.passengerAge}
                onChange={(e) => update("passengerAge", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Passenger gender
              </label>
              <select
                className="w-full rounded-xl border p-3"
                value={form.passengerGender}
                onChange={(e) => update("passengerGender", e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Number of tickets
              </label>
              <input
                required
                type="number"
                min="1"
                max="10"
                className="w-full rounded-xl border p-3"
                value={form.ticketCount}
                onChange={(e) => update("ticketCount", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Selling price (₹ per listing)
              </label>
              <input
                required
                type="number"
                min="0.01"
                max="10000000"
                step="0.01"
                className="w-full rounded-xl border p-3"
                value={form.sellingPrice}
                onChange={(e) => update("sellingPrice", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold">
                Seller phone number
              </label>
              <input
                required
                type="tel"
                maxLength={20}
                autoComplete="tel"
                className="w-full rounded-xl border p-3"
                placeholder="Phone number buyers can call"
                value={form.sellerPhone}
                onChange={(e) => update("sellerPhone", e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">
                This number will be visible to people viewing your listing.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold">
                Ticket details (optional)
              </label>
              <textarea
                rows={4}
                maxLength={1000}
                className="w-full rounded-xl border p-3"
                placeholder="Seat class, seat category, cancellation details, or other non-sensitive information. Do not include PNRs or booking references."
                value={form.ticketDetails}
                onChange={(e) => update("ticketDetails", e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-bold text-amber-900">
              Transfer and resale eligibility
            </h2>
            <p className="mt-2 text-sm text-amber-900">
              Only list tickets if the relevant operator explicitly permits
              resale or transfer. An ordinary Indian Railways reserved ticket
              generally cannot be resold to another passenger.
            </p>

            <label className="mt-4 flex items-start gap-3 text-sm text-amber-950">
              <input
                type="checkbox"
                required
                checked={form.confirmsResalePermitted}
                onChange={(e) =>
                  update("confirmsResalePermitted", e.target.checked)
                }
                className="mt-1"
              />
              <span>
                I have checked the operator's rules and confirm that resale
                or transfer of this ticket is permitted for this transaction.
              </span>
            </label>

            <label className="mt-4 block text-sm font-semibold text-amber-950">
              Transfer eligibility
            </label>
            <select
              required
              className="mt-1 w-full rounded-xl border border-amber-300 bg-white p-3"
              value={form.transferEligibility}
              onChange={(e) => update("transferEligibility", e.target.value)}
            >
              <option value="operator_permits_transfer">
                Operator explicitly permits transfer/resale
              </option>
              <option value="official_transfer_approved">
                Official transfer approval obtained
              </option>
            </select>
            <p className="mt-2 text-xs text-amber-900">
              Do not select an option unless it is true. This declaration does
              not replace operator verification or legal requirements.
            </p>
          </div>

          {message && (
            <p
              role="status"
              className={`rounded-xl p-3 text-sm ${
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
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Creating listing..." : "Publish ticket listing"}
          </button>
        </form>
      </section>
    </main>
  );
}
