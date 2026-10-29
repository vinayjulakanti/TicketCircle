
import { NextResponse } from "next/server";
import { connection } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getCurrentAdmin } from "@/lib/admin-auth";

const allowedStatuses = ["new", "reviewed", "resolved"] as const;

export async function PATCH(request: Request) {
  await connection();

  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 }
    );
  }

  let body: {
    action?: unknown;
    id?: unknown;
    status?: unknown;
    reply?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { id, action } = body;

  if (
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id < 1
  ) {
    return NextResponse.json(
      { error: "Invalid feedback ID." },
      { status: 400 }
    );
  }

  try {
    if (action === "reply") {
      if (typeof body.reply !== "string") {
        return NextResponse.json(
          { error: "Please enter a reply." },
          { status: 400 }
        );
      }

      const reply = body.reply.trim();

      if (!reply || reply.length > 5000) {
        return NextResponse.json(
          { error: "Reply must contain 1–5000 characters." },
          { status: 400 }
        );
      }

      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE feedback
         SET admin_reply = ?, admin_replied_at = NOW()
         WHERE id = ?`,
        [reply, id]
      );

      if (result.affectedRows === 0) {
        const [rows] = await pool.execute<RowDataPacket[]>(
          "SELECT id FROM feedback WHERE id = ? LIMIT 1",
          [id]
        );

        if (rows.length === 0) {
          return NextResponse.json(
            { error: "Feedback not found." },
            { status: 404 }
          );
        }
      }

      return NextResponse.json({ success: true });
    }

    if (
      action === "status" &&
      typeof body.status === "string" &&
      allowedStatuses.includes(
        body.status as (typeof allowedStatuses)[number]
      )
    ) {
      const [result] = await pool.execute<ResultSetHeader>(
        "UPDATE feedback SET status = ? WHERE id = ?",
        [body.status, id]
      );

      if (result.affectedRows === 0) {
        const [rows] = await pool.execute<RowDataPacket[]>(
          "SELECT id FROM feedback WHERE id = ? LIMIT 1",
          [id]
        );

        if (rows.length === 0) {
          return NextResponse.json(
            { error: "Feedback not found." },
            { status: 404 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        status: body.status,
      });
    }

    return NextResponse.json(
      { error: "Invalid action or status." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin feedback update failed:", error);

    return NextResponse.json(
      { error: "Unable to save changes." },
      { status: 500 }
    );
  }
}
