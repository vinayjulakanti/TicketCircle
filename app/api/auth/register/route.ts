
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { message: "Enter a name between 2 and 100 characters." },
        { status: 400 }
      );
    }

    if (
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const passwordPattern =
      /^[A-Z](?=.*[0-9])(?=.*[^A-Za-z0-9]).{7,}$/;

    if (password.length > 72 || !passwordPattern.test(password)) {
      return NextResponse.json(
        {
          message:
            "Password must be at least 8 characters, start with a capital letter, and contain a number and a symbol.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );

    await createSession(Number(result.insertId));

    return NextResponse.json(
      {
        message: "Account created successfully!",
        user: {
          id: Number(result.insertId),
          name,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { message: "This email is already registered. Please log in." },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { message: "Registration failed. Check the VS Code terminal." },
      { status: 500 }
    );
  }
}
