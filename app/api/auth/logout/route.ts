
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ message: "Logged out successfully" });
  } catch {
    return NextResponse.json(
      { message: "Unable to log out" },
      { status: 500 }
    );
  }
}
