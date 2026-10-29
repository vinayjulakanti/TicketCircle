
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { createSession } from "@/lib/auth";

interface UserRow extends RowDataPacket {
  id: number | string;
  name: string;
  email: string;
  password_hash: string;
  role: "user" | "admin";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!email || !password || password.length > 72) {
      return NextResponse.json(
        { message: "Enter your email and password." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<UserRow[]>(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.role !== "admin" && user.role !== "user") {
      return NextResponse.json(
        { message: "This account has an invalid role." },
        { status: 403 }
      );
    }

    await createSession(Number(user.id));

    const redirectTo =
  user.role === "admin" ? "/admin" : "/tickets";

    return NextResponse.json({
      message: "Login successful!",
      redirectTo,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
