
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

type Passenger = {
  age: string;
  gender: string;
};

type TicketForm = {
  vehicle_name: string;
  departure_city: string;
  destination_city: string;
  travel_date: string;
  arrival_date: string;
  departure_time: string;
  arrival_time: string;
  travel_class: string;
  ticket_count: string;
  selling_price: string;
  seller_phone: string;
  ticket_details: string;
  confirmsResalePermitted: boolean;
};

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

const initialForm: TicketForm = {
  vehicle_name: "",
  departure_city: "",
  destination_city: "",
  travel_date: "",
  arrival_date: "",
  departure_time: "",
  arrival_time: "",
  travel_class: "2S",
  ticket_count: "1",
  selling_price: "",
  seller_phone: "",
  ticket_details: "",
  confirmsResalePermitted: false,
};

const trainClasses = [
  { value: "2S", label: "2S - Second Sitting" },
  { value: "Sleeper", label: "Sleeper" },
  { value: "3A", label: "3A - AC 3 Tier" },
  { value: "2A", label: "2A - AC 2 Tier" },
  { value: "3E", label: "3E - AC 3 Tier Economy" },
  { value: "1A", label: "1A - AC First Class" },
  { value: "CC", label: "CC - AC Chair Car" },
  { value: "EC", label: "EC - Executive Chair Car" },
  { value: "Other", label: "Other" },
];

const busClasses = [
  { value: "Seater", label: "Seater" },
  { value: "Sleeper", label: "Sleeper" },
  { value: "Semi-Sleeper", label: "Semi-Sleeper" },
  { value: "AC Seater", label: "AC Seater" },
  { value: "AC Sleeper", label: "AC Sleeper" },
  { value: "Other", label: "Other" },
];

export default function SellTicketPage() {
  const router = useRouter();

  const [transportType, setTransportType] = useState("train");
  const [form, setForm] = useState<TicketForm>(initialForm);
  const [otherClass, setOtherClass] = useState("");
  const [passengers, setPassengers] = useState<Passenger[]>([
    { age: "", gender: "prefer_not_to_say" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = <K extends keyof TicketForm>(
    field: K,
    value: TicketForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateTicketCount = (value: string) => {
    updateField("ticket_count", value);

    const count = Number(value);

    if (!Number.isInteger(count) || count < 1 || count > 99) {
      return;
    }

    setPassengers((previous) =>
      Array.from({ length: count }, (_, index) => (
        previous[index] ?? {
          age: "",
          gender: "prefer_not_to_say",
        }
      ))
    );
  };

  const updatePassenger = (
    index: number,
    field: keyof Passenger,
    value: string
  ) => {
    setPassengers((previous) =>
      previous.map((passenger, passengerIndex) =>
        passengerIndex === index
          ? { ...passenger, [field]: value }
          : passenger
      )
    );
  };

  const changeTransportType = (value: string) => {
    setTransportType(value);
    setOtherClass("");

    updateField(
      "travel_class",
      value === "train" ? "2S" : "Seater"
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const count = Number(form.ticket_count);
    const price = Number(form.selling_price);

    if (!Number.isInteger(count) || count < 1 || count > 99) {
      setError("Enter a ticket quantity between 1 and 99.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid selling price greater than zero.");
      return;
    }

    if (
      passengers.length !== count ||
      passengers.some(
        (passenger) =>
          passenger.age.trim() === "" ||
          !Number.isInteger(Number(passenger.age)) ||
          Number(passenger.age) < 0 ||
          Number(passenger.age) > 120 ||
          !passenger.gender
      )
    ) {
      setError("Please enter a valid age and gender preference for every ticket.");
      return;
    }

    if (form.departure_city.trim().toLowerCase() ===
        form.destination_city.trim().toLowerCase()) {
      setError("Departure and destination cities must be different.");
      return;
    }

    if (
      form.travel_date &&
      form.arrival_date &&
      form.arrival_date < form.travel_date
    ) {
      setError("Arrival date cannot be earlier than the travel date.");
      return;
    }

    if (!form.confirmsResalePermitted) {
      setError(
        "Please confirm that transferring or reselling this ticket is permitted."
      );
      return;
    }

    if (
      form.travel_class === "Other" &&
      !otherClass.trim()
    ) {
      setError("Please specify the train class or bus seat type.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/ticket-listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transport_type: transportType,
          vehicle_name: form.vehicle_name.trim(),
          departure_city: form.departure_city.trim(),
          destination_city: form.destination_city.trim(),
          travel_date: form.travel_date,
          arrival_date: form.arrival_date || null,
          departure_time: form.departure_time,
          arrival_time: form.arrival_time || null,

          // For "Other", send the seller's specified class.
          travel_class:
            form.travel_class === "Other"
              ? otherClass.trim()
              : form.travel_class,

          ticket_count: count,
          selling_price: price,
          seller_phone: form.seller_phone.trim(),
          ticket_details: form.ticket_details.trim(),

          // Keep the first passenger fields for compatibility
          // with an API that still expects these older fields.
          passenger_age: Number(passengers[0].age),
          passenger_gender: passengers[0].gender,

          // All passengers, not just the first one.
          passengers: passengers.map((passenger) => ({
            age: Number(passenger.age),
            gender: passenger.gender,
          })),

          confirmsResalePermitted: form.confirmsResalePermitted,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(
          "The server returned an unexpected response. Please try again."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(data.error || "Unable to publish your ticket.");
      }

      setSuccess("Your ticket has been submitted successfully.");

      router.push("/tickets");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const availableClasses =
    transportType === "train" ? trainClasses : busClasses;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 px-4 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-200">
            TicketCircle Marketplace
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Sell your ticket
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">
            Share your journey details, enter passenger information,
            and list your ticket for interested buyers.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:py-12">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-4xl space-y-7"
        >
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          {/* Journey details */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Journey Details
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter the details exactly as shown on your ticket.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="transport_type" className={labelClass}>
                  Transport type
                </label>
                <select
                  id="transport_type"
                  value={transportType}
                  onChange={(event) =>
                    changeTransportType(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                </select>
              </div>

              <div>
                <label htmlFor="travel_class" className={labelClass}>
                  {transportType === "train"
                    ? "Train class"
                    : "Bus seat type"}
                </label>

                <select
                  id="travel_class"
                  required
                  value={form.travel_class}
                  onChange={(event) => {
                    updateField("travel_class", event.target.value);
                    setOtherClass("");
                  }}
                  className={inputClass}
                >
                  {availableClasses.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.travel_class === "Other" && (
                <div className="sm:col-span-2">
                  <label htmlFor="other_class" className={labelClass}>
                    Specify class or seat type
                  </label>
                  <input
                    id="other_class"
                    required
                    value={otherClass}
                    onChange={(event) => setOtherClass(event.target.value)}
                    placeholder="Enter the class or seat type"
                    className={inputClass}
                    maxLength={60}
                  />
                </div>
              )}

              <div>
                <label htmlFor="vehicle_name" className={labelClass}>
                  {transportType === "train"
                    ? "Train name or number"
                    : "Bus name or operator"}
                </label>
                <input
                  id="vehicle_name"
                  required
                  value={form.vehicle_name}
                  onChange={(event) =>
                    updateField("vehicle_name", event.target.value)
                  }
                  placeholder={
                    transportType === "train"
                      ? "e.g. Train name or number"
                      : "e.g. Bus operator or service name"
                  }
                  className={inputClass}
                  maxLength={150}
                />
              </div>

              <div>
                <label htmlFor="departure_city" className={labelClass}>
                  Departure city or station
                </label>
                <input
                  id="departure_city"
                  required
                  value={form.departure_city}
                  onChange={(event) =>
                    updateField("departure_city", event.target.value)
                  }
                  placeholder="Where does the journey start?"
                  className={inputClass}
                  maxLength={150}
                />
              </div>

              <div>
                <label htmlFor="destination_city" className={labelClass}>
                  Destination city or station
                </label>
                <input
                  id="destination_city"
                  required
                  value={form.destination_city}
                  onChange={(event) =>
                    updateField("destination_city", event.target.value)
                  }
                  placeholder="Where does the journey end?"
                  className={inputClass}
                  maxLength={150}
                />
              </div>

              <div>
                <label htmlFor="travel_date" className={labelClass}>
                  Departure date
                </label>
                <input
                  id="travel_date"
                  type="date"
                  required
                  value={form.travel_date}
                  onChange={(event) =>
                    updateField("travel_date", event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="arrival_date" className={labelClass}>
                  Arrival date
                </label>
                <input
                  id="arrival_date"
                  type="date"
                  value={form.arrival_date}
                  min={form.travel_date || undefined}
                  onChange={(event) =>
                    updateField("arrival_date", event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="departure_time" className={labelClass}>
                  Departure time
                </label>
                <input
                  id="departure_time"
                  type="time"
                  required
                  value={form.departure_time}
                  onChange={(event) =>
                    updateField("departure_time", event.target.value)
                  }
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Enter time in 24-hour format (HH:MM). For example,
                  6:30 PM is 18:30.
                </p>
              </div>

              <div>
                <label htmlFor="arrival_time" className={labelClass}>
                  Arrival time
                </label>
                <input
                  id="arrival_time"
                  type="time"
                  value={form.arrival_time}
                  onChange={(event) =>
                    updateField("arrival_time", event.target.value)
                  }
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  24-hour format (HH:MM). For example, 9:15 AM is 09:15.
                </p>
              </div>
            </div>
          </section>

          {/* Passenger details */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Passenger and Ticket Details
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter the age and gender preference for each ticket.
              </p>
            </div>

            <div className="mb-6 max-w-xs">
              <label htmlFor="ticket_count" className={labelClass}>
                Number of tickets
              </label>
              <input
                id="ticket_count"
                type="number"
                required
                min={1}
                max={99}
                value={form.ticket_count}
                onChange={(event) =>
                  updateTicketCount(event.target.value)
                }
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Choose between 1 and 99 tickets.
              </p>
            </div>

            <div className="space-y-4">
              {passengers.map((passenger, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5"
                >
                  <h3 className="mb-4 font-semibold text-gray-900">
                    Passenger {index + 1}
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`passenger-age-${index}`}
                        className={labelClass}
                      >
                        Age
                      </label>
                      <input
                        id={`passenger-age-${index}`}
                        type="number"
                        required
                        min={0}
                        max={120}
                        value={passenger.age}
                        onChange={(event) =>
                          updatePassenger(
                            index,
                            "age",
                            event.target.value
                          )
                        }
                        placeholder="Enter age"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`passenger-gender-${index}`}
                        className={labelClass}
                      >
                        Gender
                      </label>
                      <select
                        id={`passenger-gender-${index}`}
                        required
                        value={passenger.gender}
                        onChange={(event) =>
                          updatePassenger(
                            index,
                            "gender",
                            event.target.value
                          )
                        }
                        className={inputClass}
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
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label htmlFor="selling_price" className={labelClass}>
                Total selling price (₹)
              </label>
              <input
                id="selling_price"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.selling_price}
                onChange={(event) =>
                  updateField("selling_price", event.target.value)
                }
                placeholder="Enter total price for all tickets"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Enter the total price for the listing, not the price
                per ticket.
              </p>
            </div>

            <div className="mt-5">
              <label htmlFor="ticket_details" className={labelClass}>
                Additional ticket details (optional)
              </label>
              <textarea
                id="ticket_details"
                rows={4}
                maxLength={2000}
                value={form.ticket_details}
                onChange={(event) =>
                  updateField("ticket_details", event.target.value)
                }
                placeholder="Add relevant details such as berth information or transfer arrangements. Do not share sensitive personal information."
                className={inputClass}
              />
            </div>
          </section>

          {/* Seller contact */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Seller Contact Details
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              Provide a phone number buyers can use to contact you
              according to TicketCircle&apos;s privacy rules.
            </p>

            <div className="max-w-md">
              <label htmlFor="seller_phone" className={labelClass}>
                Phone number
              </label>
              <input
                id="seller_phone"
                type="tel"
                required
                maxLength={20}
                value={form.seller_phone}
                onChange={(event) =>
                  updateField("seller_phone", event.target.value)
                }
                placeholder="Enter your contact number"
                className={inputClass}
              />
            </div>
          </section>

          {/* Resale confirmation */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                required
                checked={form.confirmsResalePermitted}
                onChange={(event) =>
                  updateField(
                    "confirmsResalePermitted",
                    event.target.checked
                  )
                }
                className="mt-1 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />

              <span className="text-sm leading-6 text-gray-700">
                I confirm that I am authorized to transfer or resell
                this ticket and that the listing complies with the
                applicable transport operator&apos;s rules and laws.
              </span>
            </label>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Publishing..." : "Publish Ticket"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
