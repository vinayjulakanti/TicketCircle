
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";



export async function POST(request: NextRequest) {
  let body: { token?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "");

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  if (password.length < 8 || password.length > 72) {
    return NextResponse.json(
      { error: "Your password must be between 8 and 72 characters." },
      { status: 400 }
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const connection = await pool.getConnection();

  try {
    // Hash the new password before opening the short transaction.
    const passwordHash = await bcrypt.hash(password, 12);

    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = ?
         AND expires_at > UTC_TIMESTAMP()
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    const matches = rows as { id: number; user_id: number }[];

    if (matches.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }

    const reset = matches[0];

    const [updateResult] = await connection.execute(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [passwordHash, reset.user_id]
    );

    const updated = updateResult as { affectedRows: number };

    if (updated.affectedRows !== 1) {
      await connection.rollback();

      return NextResponse.json(
        { error: "Unable to reset the password. Please try again." },
        { status: 500 }
      );
    }

    // Invalidate this token and any other outstanding reset tokens.
    await connection.execute(
      "DELETE FROM password_reset_tokens WHERE user_id = ?",
      [reset.user_id]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Your password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // The transaction may already have ended.
    }

    console.error("Reset password error:", error);

    return NextResponse.json(
      { error: "Unable to reset the password right now. Please try again." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
