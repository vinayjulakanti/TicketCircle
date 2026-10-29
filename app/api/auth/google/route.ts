
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL || new URL(request.url).origin;

  if (!clientId) {
    return NextResponse.json(
      { message: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID in .env.local." },
      { status: 500 }
    );
  }

  const state = randomBytes(32).toString("hex");

  const response = NextResponse.redirect(
    new URL("https://accounts.google.com/o/oauth2/v2/auth")
  );

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set(
    "redirect_uri",
    `${appUrl}/api/auth/google/callback`
  );
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", state);
  googleUrl.searchParams.set("prompt", "select_account");

  const redirectResponse = NextResponse.redirect(googleUrl);

  redirectResponse.cookies.set("ticketcircle_google_oauth_state", state, {
    httpOnly: true,
    secure: appUrl.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return redirectResponse;
}
