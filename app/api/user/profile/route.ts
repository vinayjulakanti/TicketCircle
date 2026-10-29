
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in." },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, name, email FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Load profile error:", error);
    return NextResponse.json(
      { error: "Unable to load your profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, name, email FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!rows[0]) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    await pool.execute(
      "UPDATE users SET name = ? WHERE id = ?",
      [name, userId]
    );

    return NextResponse.json({
      message: "Profile updated successfully.",
      name,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Unable to update your profile." },
      { status: 500 }
    );
  }
}
