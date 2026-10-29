
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to view your dashboard." },
        { status: 401 }
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
         description,
         status,
         created_at
       FROM journeys
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({ journeys: rows });
  } catch (error) {
    console.error("My listings request failed:", error);

    return NextResponse.json(
      { error: "Unable to load your listings right now." },
      { status: 500 }
    );
  }
}
