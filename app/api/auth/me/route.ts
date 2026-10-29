
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    return NextResponse.json(
      { loggedIn: userId !== null },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Authentication check failed:", error);

    return NextResponse.json(
      { loggedIn: false },
      { status: 500 }
    );
  }
}
