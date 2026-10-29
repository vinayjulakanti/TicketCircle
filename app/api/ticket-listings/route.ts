
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

const allowedGenders = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
];

interface Passenger {
  age: number;
  gender: string;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validTime(value: string | null) {
  return (
    value === null ||
    /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
  );
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function normalizePassengers(row: Record<string, unknown>): Passenger[] {
  const raw = row.passengers;
  let passengers: Passenger[] = [];

  if (Array.isArray(raw)) {
    passengers = raw as Passenger[];
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        passengers = parsed as Passenger[];
      }
    } catch {
      passengers = [];
    }
  }

  // Keep only passenger records with valid age and gender fields.
  passengers = passengers.filter(
    (passenger) =>
      passenger !== null &&
      typeof passenger === "object" &&
      Number.isFinite(Number(passenger.age)) &&
      Number(passenger.age) >= 1 &&
      typeof passenger.gender === "string"
  );

  // Older listings may have only the original single-passenger columns.
  if (passengers.length === 0 && row.passenger_age != null) {
    passengers = [
      {
        age: Number(row.passenger_age),
        gender: String(row.passenger_gender ?? ""),
      },
    ];
  }

  return passengers;
}

function normalizeListings(rows: Record<string, unknown>[]) {
  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    travel_date: normalizeDate(row.travel_date),
    arrival_date: normalizeDate(row.arrival_date),
    passenger_age: Number(row.passenger_age),
    ticket_count: Number(row.ticket_count),
    selling_price: Number(row.selling_price),
    passengers: normalizePassengers(row),
  }));
}

// GET: seller's listings or public ticket search.
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    if (params.get("mine") === "true") {
      const userId = await getSessionUserId();

      if (!userId) {
        return NextResponse.json(
          { error: "Please log in to view your tickets." },
          { status: 401 }
        );
      }

      const [rows] = await pool.execute(
        `SELECT
          id, seller_id, transport_type, vehicle_name,
          departure_city, destination_city, travel_date,
          arrival_date, departure_time, arrival_time,
          passenger_age, passenger_gender, ticket_count,
          passengers, selling_price, ticket_details, status, created_at
        FROM ticket_listings
        WHERE seller_id = ?
        ORDER BY created_at DESC
        LIMIT 100`,
        [userId]
      );

      const listings = normalizeListings(
        rows as Record<string, unknown>[]
      );

      return NextResponse.json(
        { listings, tickets: listings },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const from = params.get("from")?.trim() || "";
    const to = params.get("to")?.trim() || "";
    const date = params.get("date") || "";
    const ageText = params.get("age") || "";
    const gender = params.get("gender") || "";
    const transportType = params.get("transportType") || "";

    if (!from || !to || !validDate(date)) {
      return NextResponse.json(
        { error: "Enter a valid departure, destination, and travel date." },
        { status: 400 }
      );
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      return NextResponse.json(
        { error: "Departure and destination must be different." },
        { status: 400 }
      );
    }

    const conditions = [
      "status = 'available'",
      "departure_city = ?",
      "destination_city = ?",
      "travel_date = ?",
    ];

    const values: (string | number)[] = [from, to, date];

    if (ageText) {
      const age = Number(ageText);

      if (!Number.isInteger(age) || age < 1 || age > 120) {
        return NextResponse.json(
          { error: "Enter a valid passenger age." },
          { status: 400 }
        );
      }

      conditions.push("passenger_age = ?");
      values.push(age);
    }

    if (gender) {
      if (!allowedGenders.includes(gender)) {
        return NextResponse.json(
          { error: "Choose a valid gender filter." },
          { status: 400 }
        );
      }

      conditions.push("passenger_gender = ?");
      values.push(gender);
    }

    if (transportType && transportType !== "all") {
      if (!["train", "bus"].includes(transportType)) {
        return NextResponse.json(
          { error: "Choose train, bus, or all transport types." },
          { status: 400 }
        );
      }

      conditions.push("transport_type = ?");
      values.push(transportType);
    }

    const [rows] = await pool.execute(
      `SELECT
        id, transport_type, vehicle_name,
        departure_city, destination_city, travel_date,
        arrival_date, departure_time, arrival_time,
        passenger_age, passenger_gender, ticket_count,
        passengers, selling_price, ticket_details,
        seller_phone, transfer_eligibility, created_at
      FROM ticket_listings
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT 100`,
      values
    );

    return NextResponse.json(
      {
        listings: normalizeListings(
          rows as Record<string, unknown>[]
        ),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Ticket listing GET failed:", error);

    return NextResponse.json(
      { error: "Unable to load ticket listings. Check the server terminal." },
      { status: 500 }
    );
  }
}

// POST: create a ticket listing with passenger details.
export async function POST(request: NextRequest) {
  try {
    const sellerId = await getSessionUserId();

    if (!sellerId) {
      return NextResponse.json(
        { error: "Please log in before listing a ticket." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const transportType = body.transport_type ?? body.transportType;
    const vehicleName = String(
      body.vehicle_name ?? body.vehicleName ?? ""
    ).trim();
    const from = String(
      body.departure_city ?? body.departureCity ?? ""
    ).trim();
    const to = String(
      body.destination_city ?? body.destinationCity ?? ""
    ).trim();
    const travelDate = String(body.travel_date ?? body.travelDate ?? "");

    const arrivalDateValue = body.arrival_date ?? body.arrivalDate ?? "";
    const arrivalDate = arrivalDateValue ? String(arrivalDateValue) : null;

    const departureValue = body.departure_time ?? body.departureTime ?? "";
    const arrivalValue = body.arrival_time ?? body.arrivalTime ?? "";

    const departureTime = departureValue ? String(departureValue) : null;
    const arrivalTime = arrivalValue ? String(arrivalValue) : null;

    const ticketCount = Number(body.ticket_count ?? body.ticketCount);
    const price = Number(body.selling_price ?? body.sellingPrice);
    const details = String(
      body.ticket_details ?? body.ticketDetails ?? ""
    ).trim();
    const phone = String(
      body.seller_phone ?? body.sellerPhone ?? ""
    ).trim();

    const eligibility =
      body.transfer_eligibility ??
      body.transferEligibility ??
      (body.confirmsResalePermitted === true
        ? "operator_permits_transfer"
        : "");

    // Accept an array of passengers, or fall back to the old single-passenger form.
    const rawPassengers: unknown[] = Array.isArray(body.passengers)
      ? body.passengers
      : [
          {
            age: body.passenger_age ?? body.passengerAge,
            gender: body.passenger_gender ?? body.passengerGender,
          },
        ];

    if (!Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 10) {
      return NextResponse.json(
        { error: "Ticket count must be between 1 and 10." },
        { status: 400 }
      );
    }

    if (rawPassengers.length !== ticketCount) {
      return NextResponse.json(
        {
          error: `Please enter age and gender for all ${ticketCount} passengers.`,
        },
        { status: 400 }
      );
    }

    const passengers: Passenger[] = [];

    for (const item of rawPassengers) {
      if (!item || typeof item !== "object") {
        return NextResponse.json(
          { error: "Invalid passenger details." },
          { status: 400 }
        );
      }

      const passenger = item as Record<string, unknown>;
      const age = Number(passenger.age);
      const gender = String(passenger.gender ?? "");

      if (!Number.isInteger(age) || age < 1 || age > 120) {
        return NextResponse.json(
          { error: "Each passenger's age must be between 1 and 120." },
          { status: 400 }
        );
      }

      if (!allowedGenders.includes(gender)) {
        return NextResponse.json(
          { error: "Choose a valid gender for every passenger." },
          { status: 400 }
        );
      }

      passengers.push({ age, gender });
    }

    const age = passengers[0].age;
    const gender = passengers[0].gender;

    if (!["train", "bus"].includes(transportType)) {
      return NextResponse.json(
        { error: "Choose train or bus." },
        { status: 400 }
      );
    }

    if (!vehicleName || vehicleName.length > 150) {
      return NextResponse.json(
        { error: "Enter the train or bus name or number." },
        { status: 400 }
      );
    }

    if (
      !from ||
      !to ||
      from.length > 100 ||
      to.length > 100 ||
      from.toLowerCase() === to.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Enter different, valid departure and destination cities." },
        { status: 400 }
      );
    }

    if (!validDate(travelDate)) {
      return NextResponse.json(
        { error: "Enter a valid travel date." },
        { status: 400 }
      );
    }

    if (
      arrivalDate !== null &&
      (!validDate(arrivalDate) || arrivalDate < travelDate)
    ) {
      return NextResponse.json(
        { error: "Arrival date must be on or after travel date." },
        { status: 400 }
      );
    }

    if (!validTime(departureTime) || !validTime(arrivalTime)) {
      return NextResponse.json(
        { error: "Enter valid departure and arrival times." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0 || price > 10000000) {
      return NextResponse.json(
        { error: "Enter a valid selling price." },
        { status: 400 }
      );
    }

    if (details.length > 1000) {
      return NextResponse.json(
        { error: "Ticket details must be 1000 characters or fewer." },
        { status: 400 }
      );
    }

    if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid seller phone number." },
        { status: 400 }
      );
    }

    if (
      ![
        "operator_permits_transfer",
        "official_transfer_approved",
      ].includes(eligibility)
    ) {
      return NextResponse.json(
        { error: "Select valid ticket transfer eligibility." },
        { status: 400 }
      );
    }

    if (body.confirmsResalePermitted !== true) {
      return NextResponse.json(
        { error: "Confirm that the operator permits this ticket transfer." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ticket_listings (
        seller_id, transport_type, vehicle_name,
        departure_city, destination_city, travel_date,
        arrival_date, departure_time, arrival_time,
        passenger_age, passenger_gender, ticket_count,
        selling_price, ticket_details, seller_phone,
        transfer_eligibility, passengers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        transportType,
        vehicleName,
        from,
        to,
        travelDate,
        arrivalDate,
        departureTime,
        arrivalTime,
        age,
        gender,
        ticketCount,
        price,
        details || null,
        phone,
        eligibility,
        JSON.stringify(passengers),
      ]
    );

    return NextResponse.json(
      {
        message: "Ticket listing created.",
        listingId: Number(result.insertId),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Creating ticket listing failed:", error);

    return NextResponse.json(
      { error: "Unable to create the ticket listing. Check the server terminal." },
      { status: 500 }
    );
  }
}

// PATCH: mark a listing sold or withdraw it.
export async function PATCH(request: NextRequest) {
  try {
    const sellerId = await getSessionUserId();

    if (!sellerId) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);
    const status = body.status;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid ticket listing ID." },
        { status: 400 }
      );
    }

    if (!["sold", "withdrawn"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid listing status." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE ticket_listings
       SET status = ?
       WHERE id = ? AND seller_id = ? AND status = 'available'`,
      [status, id, sellerId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Listing not found or no longer available." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: status === "sold" ? "Ticket marked as sold." : "Listing withdrawn.",
    });
  } catch (error) {
    console.error("Updating listing failed:", error);

    return NextResponse.json(
      { error: "Unable to update the ticket listing." },
      { status: 500 }
    );
  }
}

// DELETE: delete a listing owned by the signed-in seller.
export async function DELETE(request: NextRequest) {
  try {
    const sellerId = await getSessionUserId();

    if (!sellerId) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const id = Number(request.nextUrl.searchParams.get("id"));

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid ticket listing ID." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM ticket_listings
       WHERE id = ? AND seller_id = ?`,
      [id, sellerId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Ticket listing not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Ticket listing deleted successfully.",
    });
  } catch (error) {
    console.error("Deleting listing failed:", error);

    return NextResponse.json(
      { error: "Unable to delete the ticket listing." },
      { status: 500 }
    );
  }
}
