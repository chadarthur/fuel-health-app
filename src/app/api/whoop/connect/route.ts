import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";

const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const SCOPES = "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const clientId = process.env.WHOOP_CLIENT_ID;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "WHOOP_CLIENT_ID and WHOOP_REDIRECT_URI must be configured" },
      { status: 500 }
    );
  }

  // state is required by WHOOP v2 OAuth (min 8 chars, CSRF protection)
  const state = Math.random().toString(36).substring(2, 12);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });

  return NextResponse.redirect(`${WHOOP_AUTH_URL}?${params.toString()}`);
}
