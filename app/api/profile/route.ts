
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to view your profile." },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, gender
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    const users = rows as {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      gender: string;
    }[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    console.error("GET /api/profile error:", error);

    return NextResponse.json(
      { error: "Unable to load profile. Check the server terminal." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to update your profile." },
        { status: 401 }
      );
    }

    let body: {
      name?: unknown;
      phone?: unknown;
      gender?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const gender =
      typeof body.gender === "string" ? body.gender : "";

    const allowedGenders = [
      "male",
      "female",
      "other",
      "prefer_not_to_say",
    ];

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 1 and 100 characters." },
        { status: 400 }
      );
    }

    if (phone.length > 20) {
      return NextResponse.json(
        { error: "Phone number must not exceed 20 characters." },
        { status: 400 }
      );
    }

    if (!allowedGenders.includes(gender)) {
      return NextResponse.json(
        { error: "Please select a valid gender." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE users
       SET name = ?, phone = ?, gender = ?
       WHERE id = ?`,
      [name, phone || null, gender, userId]
    );

    const updateResult = result as { affectedRows: number };

    if (updateResult.affectedRows === 0) {
      const [rows] = await pool.execute(
        "SELECT id FROM users WHERE id = ? LIMIT 1",
        [userId]
      );

      if ((rows as unknown[]).length === 0) {
        return NextResponse.json(
          { error: "Account not found." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);

    return NextResponse.json(
      { error: "Unable to save profile. Check the server terminal." },
      { status: 500 }
    );
  }
}
