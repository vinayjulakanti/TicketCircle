
"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewListingPage() {
  const [transportType, setTransportType] = useState<"train" | "bus">("train");
  const [vehicleName, setVehicleName] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const today = "2026-10-26";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (
      !vehicleName.trim() ||
      !departureCity.trim() ||
      !destinationCity.trim() ||
      !travelDate ||
      !departureTime ||
      !arrivalDate ||
      !arrivalTime ||
      !price
    ) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (departureCity.trim().toLowerCase() === destinationCity.trim().toLowerCase()) {
      setMessage("Departure and destination must be different.");
      return;
    }

    const departureDateTime = new Date(`${travelDate}T${departureTime}:00`);
    const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}:00`);

    if (
      Number.isNaN(departureDateTime.getTime()) ||
      Number.isNaN(arrivalDateTime.getTime()) ||
      arrivalDateTime <= departureDateTime
    ) {
      setMessage("Arrival must be after departure. Check both dates and times.");
      return;
    }

    const amount = Number(price);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      setMessage("Enter a valid price greater than ₹0.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transportType,
          vehicleName: vehicleName.trim(),
          departureCity: departureCity.trim(),
          destinationCity: destinationCity.trim(),
          travelDate,
          departureTime,
          arrivalDate,
          arrivalTime,
          price: amount,
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to create listing.");
        return;
      }

      setMessage("Listing created successfully!");
      setVehicleName("");
      setDepartureCity("");
      setDestinationCity("");
      setTravelDate("");
      setDepartureTime("");
      setArrivalDate("");
      setArrivalTime("");
      setPrice("");
      setDescription("");
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-100 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold">
            Ticket<span className="text-indigo-600">Circle</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-indigo-600">
            ← Home
          </Link>
        </nav>
      </header>

      <section className="bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-black sm:text-4xl">Add a journey</h1>
          <p className="mt-3 text-indigo-100">
            Add accurate details for a permitted travel listing.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
          <div>
            <label className="mb-2 block text-sm font-semibold">Transport type *</label>
            <div className="grid grid-cols-2 gap-3">
              {(["train", "bus"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTransportType(type)}
                  className={`rounded-xl border p-4 font-bold ${
                    transportType === type
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200"
                  }`}
                >
                  {type === "train" ? "🚆 Train" : "🚌 Bus"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="vehicleName" className="mb-2 block text-sm font-semibold">
              {transportType === "train" ? "Train name / number" : "Bus operator / service name"} *
            </label>
            <input
              id="vehicleName"
              required
              maxLength={150}
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              placeholder={transportType === "train" ? "Train name and number" : "Bus operator and service"}
              className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="departureCity" className="mb-2 block text-sm font-semibold">Departure city *</label>
              <input
                id="departureCity"
                required
                maxLength={100}
                value={departureCity}
                onChange={(e) => setDepartureCity(e.target.value)}
                placeholder="e.g. Tirupati"
                className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label htmlFor="destinationCity" className="mb-2 block text-sm font-semibold">Destination city *</label>
              <input
                id="destinationCity"
                required
                maxLength={100}
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="travelDate" className="mb-2 block text-sm font-semibold">Departure date *</label>
            <input
              id="travelDate"
              type="date"
              required
              min={today}
              value={travelDate}
              onChange={(e) => {
                setTravelDate(e.target.value);
                if (arrivalDate && arrivalDate < e.target.value) {
                  setArrivalDate(e.target.value);
                }
              }}
              className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="departureTime" className="mb-2 block text-sm font-semibold">Departure time *</label>
              <input
                id="departureTime"
                type="time"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label htmlFor="arrivalDate" className="mb-2 block text-sm font-semibold">Arrival date *</label>
              <input
                id="arrivalDate"
                type="date"
                required
                min={travelDate || today}
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="arrivalTime" className="mb-2 block text-sm font-semibold">Arrival time *</label>
            <input
              id="arrivalTime"
              type="time"
              required
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-semibold">Listing price (₹) *</label>
            <input
              id="price"
              type="number"
              required
              min="0.01"
              max="1000000"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 450"
              className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-semibold">Description (optional)</label>
            <textarea
              id="description"
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional journey information..."
              className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Only list travel services and tickets you are legally authorized to offer.
            Do not list restricted or non-transferable tickets for unauthorized transfer.
          </p>

          {message && (
            <p role="status" className={`rounded-xl p-4 text-sm ${
              message.includes("successfully") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isLoading ? "Creating listing..." : "Create listing →"}
          </button>
        </form>
      </section>
    </main>
  );
}
