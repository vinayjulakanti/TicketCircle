
import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

const allowedCategories = [
  "General feedback",
  "Report a bug",
  "Suggest a feature",
  "Ticket buying or selling",
  "Login or account issue",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rating = Number(body.rating);
    const category =
      typeof body.category === "string" ? body.category : "";
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Please select a rating from 1 to 5 stars." },
        { status: 400 }
      );
    }

    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { message: "Please select a valid feedback category." },
        { status: 400 }
      );
    }

    if (message.length < 5 || message.length > 2000) {
      return NextResponse.json(
        { message: "Feedback must be between 5 and 2000 characters." },
        { status: 400 }
      );
    }

    const sessionUserId = await getSessionUserId();
    const userId = sessionUserId ? Number(sessionUserId) : null;

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO feedback (user_id, rating, category, message)
       VALUES (?, ?, ?, ?)`,
      [userId, rating, category, message]
    );

    return NextResponse.json(
      {
        message: "Thank you! Your feedback has been submitted.",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Feedback submission error:", error);

    return NextResponse.json(
      { message: "Could not submit feedback. Please try again." },
      { status: 500 }
    );
  }
}
