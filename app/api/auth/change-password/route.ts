
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to change your password." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return NextResponse.json(
        { error: "Please provide both passwords." },
        { status: 400 }
      );
    }

    if (
      currentPassword.length === 0 ||
      currentPassword.length > 128 ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      return NextResponse.json(
        { error: "Check your password lengths. The new password must be 8–128 characters." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Your new password must differ from your current password." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    const users = rows as { password_hash: string }[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User account was not found." },
        { status: 404 }
      );
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      users[0].password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: "Your current password is incorrect." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.execute(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [passwordHash, userId]
    );

    return NextResponse.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      { error: "Unable to change your password right now." },
      { status: 500 }
    );
  }
}
