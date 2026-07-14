import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleOAuthClient,
  isValidGoogleOAuthState,
} from "@/lib/scheduling/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return htmlResponse("Google OAuth Failed", `<p>${escapeHtml(error)}</p>`, 400);
  }

  if (!isValidGoogleOAuthState(state)) {
    return htmlResponse("Google OAuth Unauthorized", "<p>Invalid OAuth state.</p>", 401);
  }

  if (!code) {
    return htmlResponse("Google OAuth Missing Code", "<p>No authorization code was provided.</p>", 400);
  }

  const oauth = createGoogleOAuthClient({ requireRefreshToken: false });

  if (!oauth.ok) {
    return htmlResponse(
      "Google OAuth Missing Configuration",
      `<p>Missing: ${escapeHtml(oauth.missing.join(", "))}</p>`,
      500,
    );
  }

  try {
    const { tokens } = await oauth.oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return htmlResponse(
        "Google OAuth Connected Without Refresh Token",
        [
          "<p>Google did not return a refresh token.</p>",
          "<p>Visit the authorize route again with <code>prompt=consent</code>, or revoke the app grant in Google Account permissions and retry.</p>",
        ].join(""),
        400,
      );
    }

    const isLocalhost = request.nextUrl.hostname === "localhost";
    const refreshTokenMarkup = isLocalhost
      ? `<p>Copy this into <code>.env.local</code>:</p><pre>GOOGLE_REFRESH_TOKEN=${escapeHtml(
          refreshToken,
        )}</pre>`
      : "<p>Refresh token received. Store it securely as GOOGLE_REFRESH_TOKEN in the deployment environment.</p>";

    return htmlResponse(
      "Google OAuth Connected",
      [
        "<p>Calendar OAuth authorization succeeded.</p>",
        refreshTokenMarkup,
        "<p>Do not commit this token.</p>",
      ].join(""),
      200,
    );
  } catch {
    return htmlResponse(
      "Google OAuth Token Exchange Failed",
      "<p>The authorization code could not be exchanged. Check the OAuth client configuration.</p>",
      500,
    );
  }
}

function htmlResponse(title: string, body: string, status: number) {
  return new NextResponse(
    `<!doctype html><html><head><title>${escapeHtml(
      title,
    )}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="font-family:system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 20px;line-height:1.6;"><h1>${escapeHtml(
      title,
    )}</h1>${body}</body></html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

