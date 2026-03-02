import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(
      `${appUrl}/settings?whoop=error&reason=${error ?? "no_code"}`
    );
  }

  const clientId = process.env.WHOOP_CLIENT_ID?.trim();
  const clientSecret = process.env.WHOOP_CLIENT_SECRET?.trim();
  const redirectUri = process.env.WHOOP_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(`${appUrl}/settings?whoop=error&reason=missing_config`);
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(WHOOP_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("WHOOP token exchange failed:", text);
      return NextResponse.redirect(`${appUrl}/settings?whoop=error&reason=token_exchange`);
    }

    const tokens = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.whoopToken.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope ?? null,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope ?? null,
      },
    });

    return NextResponse.redirect(`${appUrl}/settings?whoop=connected`);
  } catch (err) {
    console.error("WHOOP callback error:", err);
    return NextResponse.redirect(`${appUrl}/settings?whoop=error&reason=server_error`);
  }
}
