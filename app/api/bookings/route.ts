
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

type JourneyRow = {
  id: number;
  user_id: number;
  status: string;
};

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to request a booking." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const journeyId = Number(body.journeyId);
    const gender = body.gender;
    const age = Number(body.age);
    const ticketCount = Number(body.ticketCount);
    const phone = String(body.phone ?? "").trim();
    const phoneVisibility = body.phoneVisibility;

    if (!Number.isSafeInteger(journeyId) || journeyId <= 0) {
      return NextResponse.json(
        { error: "Please select a valid journey." },
        { status: 400 }
      );
    }

    const allowedGenders = [
      "Male",
      "Female",
      "Other",
      "Prefer not to say",
    ];

    if (!allowedGenders.includes(gender)) {
      return NextResponse.json(
        { error: "Please select a valid gender option." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(age) || age < 18 || age > 120) {
      return NextResponse.json(
        { error: "Age must be between 18 and 120." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 10) {
      return NextResponse.json(
        { error: "You can request between 1 and 10 tickets." },
        { status: 400 }
      );
    }

    if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number." },
        { status: 400 }
      );
    }

    if (
      !["always", "after_acceptance", "never"].includes(phoneVisibility)
    ) {
      return NextResponse.json(
        { error: "Please select a valid phone privacy option." },
        { status: 400 }
      );
    }

    const [journeyRows] = await pool.execute(
      `SELECT id, user_id, status
       FROM journeys
       WHERE id = ?
       LIMIT 1`,
      [journeyId]
    );

    const journey = (journeyRows as JourneyRow[])[0];

    if (!journey || journey.status !== "available") {
      return NextResponse.json(
        { error: "This journey is no longer available." },
        { status: 404 }
      );
    }

    if (Number(journey.user_id) === userId) {
      return NextResponse.json(
        { error: "You cannot request your own listing." },
        { status: 400 }
      );
    }

    const [existingRows] = await pool.execute(
      `SELECT id
       FROM bookings
       WHERE journey_id = ?
         AND passenger_id = ?
         AND status IN ('pending', 'accepted')
       LIMIT 1`,
      [journeyId, userId]
    );

    if ((existingRows as { id: number }[]).length > 0) {
      return NextResponse.json(
        { error: "You already have an active request for this journey." },
        { status: 409 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO bookings
        (journey_id, passenger_id, status, passenger_gender,
         passenger_age, ticket_count, passenger_phone, phone_visibility)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [
        journeyId,
        userId,
        gender,
        age,
        ticketCount,
        phone,
        phoneVisibility,
      ]
    );

    const insertResult = result as { insertId: number | bigint };

    return NextResponse.json(
      {
        message: "Booking request submitted successfully.",
        bookingId: Number(insertResult.insertId),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking request failed:", error);

    return NextResponse.json(
      { error: "Unable to submit your booking request right now." },
      { status: 500 }
    );
  }
}
