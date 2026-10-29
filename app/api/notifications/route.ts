
import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

interface NotificationRow extends RowDataPacket {
  id: number;
  title: string;
  message: string;
  link: string | null;
  is_read: number | boolean;
  created_at: Date | string;
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

    const [rows] = await pool.execute<NotificationRow[]>(
      `SELECT id, title, message, link, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [userId]
    );

    return NextResponse.json({
      notifications: rows.map((row) => ({
        id: Number(row.id),
        title: row.title,
        message: row.message,
        link: row.link,
        isRead: Boolean(row.is_read),
        createdAt: row.created_at,
      })),
      unreadCount: rows.filter((row) => !Boolean(row.is_read)).length,
    });
  } catch (error) {
    console.error("Load notifications error:", error);
    return NextResponse.json(
      { error: "Unable to load notifications." },
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

    if (body.markAll === true) {
      await pool.execute(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
        [userId]
      );

      return NextResponse.json({
        message: "All notifications marked as read.",
      });
    }

    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "A valid notification ID is required." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      { error: "Unable to update notification." },
      { status: 500 }
    );
  }
}
