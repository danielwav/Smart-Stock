import { NextRequest, NextResponse } from "next/server";
import { googleLoginAction } from "../../../../../lib/actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (error || !code) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", baseUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", baseUrl));
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Token exchange failed:", errText);
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", baseUrl));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=userinfo_failed", baseUrl));
    }

    const userInfo = await userInfoResponse.json();

    const result = await googleLoginAction({
      email: userInfo.email,
      name: userInfo.given_name || userInfo.name?.split(" ")[0] || userInfo.email.split("@")[0],
      lastname: userInfo.family_name || userInfo.name?.split(" ").slice(1).join(" ") || "",
      googleId: userInfo.id,
    });

    if (result.success && result.user) {
      const redirectUrl = new URL("/login", baseUrl);
      redirectUrl.searchParams.set("google_user", result.user.email);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(new URL("/login?error=login_failed", baseUrl));
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=server_error", baseUrl));
  }
}
