
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to view incoming requests." },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
         b.id AS booking_id,
         b.status AS booking_status,
         b.created_at AS request_date,
         b.passenger_gender,
         b.passenger_age,
         b.ticket_count,
         b.phone_visibility,
         CASE
           WHEN b.phone_visibility = 'always'
             OR (b.phone_visibility = 'after_acceptance'
                 AND b.status = 'accepted')
           THEN b.passenger_phone
           ELSE NULL
         END AS passenger_phone,
         u.name AS passenger_name,
         u.email AS passenger_email,
         j.id AS journey_id,
         j.transport_type,
         j.vehicle_name,
         j.departure_city,
         j.destination_city,
         j.travel_date,
         j.departure_time,
         j.arrival_date,
         j.arrival_time,
         j.price
       FROM bookings b
       INNER JOIN journeys j ON j.id = b.journey_id
       INNER JOIN users u ON u.id = b.passenger_id
       WHERE j.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ requests: rows });
  } catch (error) {
    console.error("Incoming requests error:", error);

    return NextResponse.json(
      { error: "Unable to load incoming requests." },
      { status: 500 }
    );
  }
}
