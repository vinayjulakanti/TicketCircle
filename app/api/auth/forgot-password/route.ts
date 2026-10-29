
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import pool from "@/lib/db";


const TOKEN_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (
      !email ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const genericMessage =
      "If an account exists for that email, reset instructions will be sent.";

    const [rows] = await pool.execute(
      "SELECT id, email FROM users WHERE LOWER(email) = ? LIMIT 1",
      [email]
    );

    const users = rows as { id: number; email: string }[];

    // Return the same response whether or not the email is registered.
    if (users.length === 0) {
      return NextResponse.json({ message: genericMessage });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const fromEmail = process.env.SMTP_FROM || smtpUser;
    const appUrl = process.env.APP_URL;

    if (!smtpUser || !smtpPassword || !fromEmail || !appUrl) {
      console.error("Forgot password: SMTP or APP_URL is not configured.");

      return NextResponse.json(
        { error: "Password reset email is not configured." },
        { status: 503 }
      );
    }

    const baseUrl = new URL(appUrl);

    if (
      baseUrl.protocol !== "https:" &&
      baseUrl.hostname !== "localhost" &&
      baseUrl.hostname !== "127.0.0.1"
    ) {
      return NextResponse.json(
        { error: "APP_URL must use HTTPS outside local development." },
        { status: 500 }
      );
    }

    // A random 256-bit token is generated; only its SHA-256 hash is stored.
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const user = users[0];

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        "DELETE FROM password_reset_tokens WHERE user_id = ?",
        [user.id]
      );

      await connection.execute(
        `INSERT INTO password_reset_tokens
          (user_id, token_hash, expires_at, created_at)
         VALUES (
           ?, ?,
           DATE_ADD(UTC_TIMESTAMP(), INTERVAL ${TOKEN_MINUTES} MINUTE),
           UTC_TIMESTAMP()
         )`,
        [user.id, tokenHash]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const resetUrl = new URL("/reset-password", baseUrl);
    resetUrl.searchParams.set("token", token);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    try {
      await transporter.sendMail({
        from: fromEmail,
        to: user.email,
        subject: "Reset your TicketCircle password",
        text: [
          "You requested a TicketCircle password reset.",
          "",
          `Use this link within ${TOKEN_MINUTES} minutes:`,
          resetUrl.toString(),
          "",
          "If you did not request this, ignore this email.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
            <h2 style="color:#6d28d9">TicketCircle</h2>
            <h3>Reset your password</h3>
            <p>You requested a password reset for your account.</p>
            <p>This link expires in ${TOKEN_MINUTES} minutes and can only be used once.</p>
            <p>
              <a href="${resetUrl.toString()}"
                 style="display:inline-block;padding:12px 20px;background:#6d28d9;color:white;text-decoration:none;border-radius:8px">
                Reset Password
              </a>
            </p>
            <p>If you did not request this, ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      // Remove the token if the email could not be sent.
      await pool.execute(
        "DELETE FROM password_reset_tokens WHERE user_id = ? AND token_hash = ?",
        [user.id, tokenHash]
      );

      throw error;
    }

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      { error: "Unable to process the request right now. Please try again later." },
      { status: 500 }
    );
  }
}
