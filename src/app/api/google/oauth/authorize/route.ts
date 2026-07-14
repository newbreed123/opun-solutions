import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  GOOGLE_CALENDAR_FREEBUSY_SCOPE,
  createGoogleOAuthClient,
  googleOAuthStateToken,
  isValidGoogleOAuthSetupSecret,
} from "@/lib/scheduling/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const providedSecret = request.nextUrl.searchParams.get("secret");

  if (!isValidGoogleOAuthSetupSecret(providedSecret)) {
    return oauthSetupUnauthorized(
      process.env.GOOGLE_OAUTH_SETUP_SECRET?.trim()
        ? "Invalid OAuth setup secret"
        : "OAuth setup secret is missing",
    );
  }

  const oauth = createGoogleOAuthClient({ requireRefreshToken: false });

  if (!oauth.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Google OAuth environment variables are missing.",
        missing: oauth.missing,
      },
      { status: 500 },
    );
  }

  const authorizationUrl = oauth.oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: [GOOGLE_CALENDAR_EVENTS_SCOPE, GOOGLE_CALENDAR_FREEBUSY_SCOPE],
    state: googleOAuthStateToken(),
  });

  return NextResponse.redirect(authorizationUrl);
}

function oauthSetupUnauthorized(developmentMessage: string) {
  const message =
    process.env.NODE_ENV === "development" ? developmentMessage : "Unauthorized.";

  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}
