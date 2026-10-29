
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to view your bookings." },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
         b.id AS booking_id,
         b.status AS booking_status,
         b.created_at AS booking_created_at,
         j.id AS journey_id,
         j.transport_type,
         j.vehicle_name,
         j.departure_city,
         j.destination_city,
         j.travel_date,
         j.departure_time,
         j.arrival_date,
         j.arrival_time,
         j.price,
         j.status AS journey_status
       FROM bookings b
       INNER JOIN journeys j ON j.id = b.journey_id
       WHERE b.passenger_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ bookings: rows });
  } catch (error) {
    console.error("My bookings request failed:", error);

    return NextResponse.json(
      { error: "Unable to load your bookings right now." },
      { status: 500 }
    );
  }
}
