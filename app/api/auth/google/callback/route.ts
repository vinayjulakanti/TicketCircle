
import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const fail = () =>
    NextResponse.redirect(
      new URL("/login?error=google_auth_failed", appUrl)
    );

  try {
    if (!clientId || !clientSecret) {
      console.error("Google OAuth environment variables are missing.");
      return fail();
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const savedState = request.cookies.get(
      "ticketcircle_google_oauth_state"
    )?.value;

    if (!code || !state || !savedState || state !== savedState) {
      console.error("Google OAuth state validation failed.");
      return fail();
    }

    const oauthClient = new OAuth2Client(
      clientId,
      clientSecret,
      `${appUrl}/api/auth/google/callback`
    );

    const { tokens } = await oauthClient.getToken(code);

    if (!tokens.id_token) {
      console.error("Google did not return an ID token.");
      return fail();
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const googleUser = ticket.getPayload();

    if (
      !googleUser?.email ||
      !googleUser.email_verified ||
      !googleUser.sub
    ) {
      console.error("Google account email is missing or unverified.");
      return fail();
    }

    const email = googleUser.email.trim().toLowerCase();
    const name = googleUser.name?.trim() || email.split("@")[0];

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    let userId: number;

    if (rows.length > 0) {
      userId = Number(rows[0].id);
    } else {
      // Existing users table requires a password hash.
      // Generate a random value; the user will sign in with Google.
      const randomPassword = randomBytes(48).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      const [result] = await pool.execute<ResultSetHeader>(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        [name, email, passwordHash]
      );

      userId = Number(result.insertId);
    }

    await createSession(userId);

    const response = NextResponse.redirect(new URL("/tickets", appUrl));

    response.cookies.delete("ticketcircle_google_oauth_state");

    return response;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return fail();
  }
}
