
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
};

interface AdminUserRow extends RowDataPacket {
  id: number | string;
  name: string;
  email: string;
  role: "user" | "admin";
}

/**
 * Returns the currently logged-in administrator.
 * Returns null if the user is not logged in or is not an admin.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return null;
    }

    const [rows] = await pool.execute<AdminUserRow[]>(
      `SELECT id, name, email, role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    const user = rows[0];

    if (!user || user.role !== "admin") {
      return null;
    }

    return {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: "admin",
    };
  } catch (error) {
    console.error("Admin authorization check failed:", error);
    return null;
  }
}
