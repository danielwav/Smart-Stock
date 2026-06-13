import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  if (!baseUrl && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "NEXT_PUBLIC_BASE_URL is not configured" }, { status: 500 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const fallback = baseUrl || "http://localhost:3000";
    return NextResponse.redirect(new URL("/login?error=google_not_configured", fallback));
  }

  const safeBaseUrl = baseUrl || "http://localhost:3000";
  const redirectUri = `${safeBaseUrl}/api/auth/google/callback`;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(url.toString());
}
