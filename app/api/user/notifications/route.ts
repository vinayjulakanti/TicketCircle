
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

interface PreferencesRow extends RowDataPacket {
  email_ticket_updates: number | boolean;
  email_account_updates: number | boolean;
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

    const [rows] = await pool.execute<PreferencesRow[]>(
      `SELECT email_ticket_updates, email_account_updates
       FROM user_notification_preferences
       WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    const preferences = rows[0];

    return NextResponse.json({
      preferences: {
        emailTicketUpdates: preferences
          ? Boolean(preferences.email_ticket_updates)
          : true,
        emailAccountUpdates: preferences
          ? Boolean(preferences.email_account_updates)
          : true,
      },
    });
  } catch (error) {
    console.error("Load notification preferences error:", error);
    return NextResponse.json(
      { error: "Unable to load notification preferences." },
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

    if (
      typeof body.emailTicketUpdates !== "boolean" ||
      typeof body.emailAccountUpdates !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Please provide valid notification preferences." },
        { status: 400 }
      );
    }

    await pool.execute(
      `INSERT INTO user_notification_preferences
         (user_id, email_ticket_updates, email_account_updates)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email_ticket_updates = VALUES(email_ticket_updates),
         email_account_updates = VALUES(email_account_updates)`,
      [
        userId,
        body.emailTicketUpdates,
        body.emailAccountUpdates,
      ]
    );

    return NextResponse.json({
      message: "Notification preferences saved.",
      preferences: {
        emailTicketUpdates: body.emailTicketUpdates,
        emailAccountUpdates: body.emailAccountUpdates,
      },
    });
  } catch (error) {
    console.error("Save notification preferences error:", error);
    return NextResponse.json(
      { error: "Unable to save notification preferences." },
      { status: 500 }
    );
  }
}
