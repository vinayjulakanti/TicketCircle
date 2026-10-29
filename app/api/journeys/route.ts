
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function isValidTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const type = params.get("type");
    const from = params.get("from")?.trim();
    const to = params.get("to")?.trim();
    const date = params.get("date");

    if (
      (type !== "train" && type !== "bus") ||
      !from ||
      !to ||
      !date ||
      from.length > 100 ||
      to.length > 100 ||
      from.toLowerCase() === to.toLowerCase() ||
      !isValidDate(date)
    ) {
      return NextResponse.json(
        { error: "Please provide valid journey search details." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
         id,
         transport_type,
         vehicle_name,
         departure_city,
         destination_city,
         travel_date,
         departure_time,
         arrival_date,
         arrival_time,
         price,
         description
       FROM journeys
       WHERE transport_type = ?
         AND LOWER(departure_city) = LOWER(?)
         AND LOWER(destination_city) = LOWER(?)
         AND travel_date = ?
         AND status = 'available'
       ORDER BY departure_time ASC, price ASC`,
      [type, from, to, date]
    );

    return NextResponse.json({ journeys: rows });
  } catch (error) {
    console.error("Journey search failed:", error);

    return NextResponse.json(
      { error: "Unable to search journeys right now." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in before creating a listing." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const transportType = body.transportType;
    const vehicleName =
      typeof body.vehicleName === "string" ? body.vehicleName.trim() : "";
    const departureCity =
      typeof body.departureCity === "string"
        ? body.departureCity.trim()
        : "";
    const destinationCity =
      typeof body.destinationCity === "string"
        ? body.destinationCity.trim()
        : "";
    const travelDate = body.travelDate;
    const departureTime = body.departureTime;
    const arrivalDate = body.arrivalDate;
    const arrivalTime = body.arrivalTime;
    const price = Number(body.price);
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (
      (transportType !== "train" && transportType !== "bus") ||
      !vehicleName ||
      vehicleName.length > 150 ||
      !departureCity ||
      departureCity.length > 100 ||
      !destinationCity ||
      destinationCity.length > 100 ||
      departureCity.toLowerCase() === destinationCity.toLowerCase() ||
      !isValidDate(travelDate) ||
      !isValidDate(arrivalDate) ||
      !isValidTime(departureTime) ||
      !isValidTime(arrivalTime) ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 1000000 ||
      description.length > 500
    ) {
      return NextResponse.json(
        { error: "Please enter valid journey details." },
        { status: 400 }
      );
    }

    // Compare complete dates and times, including overnight journeys.
    const departureDateTime = `${travelDate}T${departureTime}`;
    const arrivalDateTime = `${arrivalDate}T${arrivalTime}`;

    if (
      arrivalDate < travelDate ||
      arrivalDateTime <= departureDateTime
    ) {
      return NextResponse.json(
        {
          error:
            "Arrival must be after departure. Check both dates and times.",
        },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO journeys (
        user_id,
        transport_type,
        vehicle_name,
        departure_city,
        destination_city,
        travel_date,
        departure_time,
        arrival_date,
        arrival_time,
        price,
        description,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
      [
        userId,
        transportType,
        vehicleName,
        departureCity,
        destinationCity,
        travelDate,
        departureTime,
        arrivalDate,
        arrivalTime,
        price,
        description || null,
      ]
    );

    return NextResponse.json(
      {
        message: "Journey listing created successfully.",
        id: Number((result as { insertId: number | bigint }).insertId),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create journey failed:", error);

    return NextResponse.json(
      { error: "Unable to create listing right now." },
      { status: 500 }
    );
  }
}
