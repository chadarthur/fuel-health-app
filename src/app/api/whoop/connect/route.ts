import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";

const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const SCOPES = "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const clientId = process.env.WHOOP_CLIENT_ID?.trim();
  const redirectUri = process.env.WHOOP_REDIRECT_URI?.trim();

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "WHOOP_CLIENT_ID and WHOOP_REDIRECT_URI must be configured" },
      { status: 500 }
    );
  }

  // state is required by WHOOP v2 OAuth (min 8 chars, CSRF protection).
  // Stored in an httpOnly cookie so the callback can verify it.
  const state = crypto.randomUUID().replace(/-/g, "");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });

  const res = NextResponse.redirect(`${WHOOP_AUTH_URL}?${params.toString()}`);
  res.cookies.set("whoop_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
