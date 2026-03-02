import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.WHOOP_CLIENT_ID ?? "NOT SET";
  const redirectUri = process.env.WHOOP_REDIRECT_URI ?? "NOT SET";
  const mockMode = process.env.WHOOP_MOCK_MODE ?? "NOT SET";
  const hasSecret = !!process.env.WHOOP_CLIENT_SECRET;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline",
    state: "debugstate1",
  });

  const oauthUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`;

  return NextResponse.json({
    clientId,
    clientIdPrefix: clientId.slice(0, 8) + "...",
    redirectUri,
    mockMode,
    hasSecret,
    oauthUrl,
  });
}
