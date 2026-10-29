
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const sellerId = await getSessionUserId();

    if (!sellerId) {
      return NextResponse.json(
        { error: "Please log in to view your dashboard." },
        { status: 401 }
      );
    }

    const [listings] = await pool.execute(
      `SELECT
         id,
         transport_type,
         vehicle_name,
         departure_city,
         destination_city,
         travel_date,
         departure_time,
         passenger_age,
         passenger_gender,
         ticket_count,
         selling_price,
         ticket_details,
         seller_phone,
         status,
         created_at
       FROM ticket_listings
       WHERE seller_id = ?
       ORDER BY created_at DESC`,
      [sellerId]
    );

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Loading ticket dashboard failed:", error);

    return NextResponse.json(
      { error: "Unable to load your ticket listings." },
      { status: 500 }
    );
  }
}

