import "server-only";

import { createHash, timingSafeEqual } from "crypto";
import { google } from "googleapis";

export const GOOGLE_CALENDAR_EVENTS_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";
export const GOOGLE_CALENDAR_FREEBUSY_SCOPE =
  "https://www.googleapis.com/auth/calendar.freebusy";

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
  calendarId: string;
  calendarTimezone: string;
};

const PRODUCTION_REDIRECT_URI = "https://opzix.io/api/google/oauth/callback";

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim() || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || "",
    redirectUri:
      process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
      "http://localhost:3000/api/google/oauth/callback",
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim() || undefined,
    calendarId: process.env.GOOGLE_CALENDAR_ID?.trim() || "hello@opzix.io",
    calendarTimezone:
      process.env.GOOGLE_CALENDAR_TIMEZONE?.trim() ||
      process.env.OPZIX_BOOKING_TIMEZONE?.trim() ||
      "America/New_York",
  };
}

export function createGoogleOAuthClient(options: { requireRefreshToken?: boolean } = {}) {
  const config = getGoogleOAuthConfig();
  const missing = missingGoogleOAuthConfig(
    config,
    options.requireRefreshToken ?? false,
    isProductionRuntime(),
  );

  if (missing.length > 0) {
    return { ok: false as const, missing, config };
  }

  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  );

  if (config.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });
  }

  return { ok: true as const, oauth2Client, config };
}

export function validateGoogleCalendarProductionConfig() {
  const config = getGoogleOAuthConfig();
  return missingGoogleOAuthConfig(config, true, true);
}

export function googleOAuthSetupSecret() {
  return process.env.GOOGLE_OAUTH_SETUP_SECRET?.trim() || "";
}

export function googleOAuthStateToken() {
  const config = getGoogleOAuthConfig();
  if (!config.clientId || !config.redirectUri) return "";

  return createHash("sha256")
    .update(`opzix-google-oauth-state:${config.clientId}:${config.redirectUri}`)
    .digest("hex");
}

export function isValidGoogleOAuthState(value: string | null) {
  const expected = googleOAuthStateToken();
  if (!value || !expected || value.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isValidGoogleOAuthSetupSecret(value: string | null) {
  const secret = googleOAuthSetupSecret();
  if (!value || !secret || value.length !== secret.length) return false;

  try {
    return timingSafeEqual(Buffer.from(value), Buffer.from(secret));
  } catch {
    return false;
  }
}

function missingGoogleOAuthConfig(
  config: GoogleOAuthConfig,
  requireRefreshToken: boolean,
  validateProductionValues = false,
) {
  return [
    config.clientId ? "" : "GOOGLE_CLIENT_ID",
    config.clientSecret ? "" : "GOOGLE_CLIENT_SECRET",
    config.redirectUri ? "" : "GOOGLE_OAUTH_REDIRECT_URI",
    requireRefreshToken && !config.refreshToken ? "GOOGLE_REFRESH_TOKEN" : "",
    config.calendarId ? "" : "GOOGLE_CALENDAR_ID",
    config.calendarTimezone ? "" : "GOOGLE_CALENDAR_TIMEZONE",
    validateProductionValues && config.redirectUri !== PRODUCTION_REDIRECT_URI
      ? "GOOGLE_OAUTH_REDIRECT_URI"
      : "",
    validateProductionValues && config.calendarId !== "hello@opzix.io"
      ? "GOOGLE_CALENDAR_ID"
      : "",
    validateProductionValues && config.calendarTimezone !== "America/New_York"
      ? "GOOGLE_CALENDAR_TIMEZONE"
      : "",
  ].filter(Boolean);
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}
