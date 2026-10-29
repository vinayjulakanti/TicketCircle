
import { NextResponse } from "next/server";
import pool from "@/lib/db";



export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT DATABASE() AS databaseName"
    );

    return NextResponse.json({
      connected: true,
      result: rows,
    });
  } catch (error) {
    console.error("MySQL connection test failed:", error);

    return NextResponse.json(
      {
        connected: false,
        message:
          "MySQL connection failed. Check your MySQL server and environment settings.",
      },
      { status: 500 }
    );
  }
}
