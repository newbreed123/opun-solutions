import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  PRODUCTION_REDIRECT_URI,
  createGoogleOAuthClient,
  getGoogleOAuthConfig,
  isValidGoogleOAuthSetupSecret,
  validateGoogleCalendarProductionConfig,
} from "@/lib/scheduling/google-oauth";

export const dynamic = "force-dynamic";

const GOOGLE_OAUTH_ENV_NAMES = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_OAUTH_REDIRECT_URI",
  "GOOGLE_CALENDAR_ID",
  "GOOGLE_CALENDAR_TIMEZONE",
] as const;

export async function GET(request: NextRequest) {
  const providedSecret = request.nextUrl.searchParams.get("secret");

  if (!isValidGoogleOAuthSetupSecret(providedSecret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const oauth = createGoogleOAuthClient({ requireRefreshToken: true });
  const productionMissing = validateGoogleCalendarProductionConfig();
  const missing = uniqueStrings([
    ...(!oauth.ok ? oauth.missing : []),
    ...productionMissing,
  ]);
  const config = getGoogleOAuthConfig();

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    runtime: {
      nodeEnv: process.env.NODE_ENV || "",
      vercelEnv: process.env.VERCEL_ENV || "",
    },
    expectedProductionValues: {
      GOOGLE_OAUTH_REDIRECT_URI: PRODUCTION_REDIRECT_URI,
      GOOGLE_CALENDAR_ID: "hello@opzix.io",
      GOOGLE_CALENDAR_TIMEZONE: "America/New_York",
    },
    configuredValues: {
      GOOGLE_OAUTH_REDIRECT_URI: config.redirectUri,
      GOOGLE_CALENDAR_ID: config.calendarId,
      GOOGLE_CALENDAR_TIMEZONE: config.calendarTimezone,
    },
    env: Object.fromEntries(
      GOOGLE_OAUTH_ENV_NAMES.map((name) => [name, redactedEnvValue(name)]),
    ),
    hint:
      missing.length > 0
        ? "Set the missing variables in the same Vercel environment that serves production, then redeploy."
        : "Google OAuth environment variables are present for this deployment.",
  });
}

function redactedEnvValue(name: string) {
  const value = process.env[name]?.trim() || "";

  if (!value) {
    return { present: false, length: 0, fingerprint: null };
  }

  if (
    name === "GOOGLE_OAUTH_REDIRECT_URI" ||
    name === "GOOGLE_CALENDAR_ID" ||
    name === "GOOGLE_CALENDAR_TIMEZONE"
  ) {
    return {
      present: true,
      length: value.length,
      value,
    };
  }

  return {
    present: true,
    length: value.length,
    fingerprint: createHash("sha256").update(value).digest("hex").slice(0, 12),
  };
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
