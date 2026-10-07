export const PRODUCTION_PASSWORD_RECOVERY_REDIRECT =
  "https://opzix.io/accept-invite?mode=recovery";

export const PASSWORD_RECOVERY_REDIRECT_ENV =
  "OPZIX_PASSWORD_RECOVERY_REDIRECT_URL";

export type PasswordRecoveryRedirectConfig =
  | {
      ok: true;
      url: string;
      source: typeof PASSWORD_RECOVERY_REDIRECT_ENV;
      host: string;
      pathname: string;
      search: string;
      usesLocalhost: boolean;
      productionSafe: boolean;
    }
  | {
      ok: false;
      code:
        | "password_recovery_redirect_missing"
        | "password_recovery_redirect_invalid";
      error: string;
      source: typeof PASSWORD_RECOVERY_REDIRECT_ENV;
      configured: string | null;
      host: string | null;
      pathname: string | null;
      search: string | null;
      usesLocalhost: boolean;
      productionSafe: false;
    };

export function getPasswordRecoveryRedirectConfig():
  PasswordRecoveryRedirectConfig {
  const value = process.env[PASSWORD_RECOVERY_REDIRECT_ENV]?.trim() || "";
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  if (!value) {
    return {
      ok: false,
      code: "password_recovery_redirect_missing",
      error:
        "Set OPZIX_PASSWORD_RECOVERY_REDIRECT_URL to the approved password recovery URL.",
      source: PASSWORD_RECOVERY_REDIRECT_ENV,
      configured: null,
      host: null,
      pathname: null,
      search: null,
      usesLocalhost: false,
      productionSafe: false,
    };
  }

  try {
    const url = new URL(value);
    const usesLocalhost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const validCommonShape =
      url.pathname === "/accept-invite" &&
      url.search === "?mode=recovery" &&
      !url.hash &&
      !url.username &&
      !url.password;
    const validProduction =
      !isProduction ||
      (value === PRODUCTION_PASSWORD_RECOVERY_REDIRECT &&
        url.protocol === "https:" &&
        url.hostname === "opzix.io" &&
        url.host === "opzix.io");
    const validDevelopment =
      isProduction || ["https:", "http:"].includes(url.protocol);

    if (!validCommonShape || !validProduction || !validDevelopment) {
      throw new Error("invalid password recovery redirect");
    }

    return {
      ok: true,
      url: value,
      source: PASSWORD_RECOVERY_REDIRECT_ENV,
      host: url.host,
      pathname: url.pathname,
      search: url.search,
      usesLocalhost,
      productionSafe:
        !isProduction || value === PRODUCTION_PASSWORD_RECOVERY_REDIRECT,
    };
  } catch {
    let parsed: URL | null = null;
    try {
      parsed = new URL(value);
    } catch {
      parsed = null;
    }

    return {
      ok: false,
      code: "password_recovery_redirect_invalid",
      error:
        "OPZIX_PASSWORD_RECOVERY_REDIRECT_URL must be the approved password recovery URL.",
      source: PASSWORD_RECOVERY_REDIRECT_ENV,
      configured: value,
      host: parsed?.host ?? null,
      pathname: parsed?.pathname ?? null,
      search: parsed?.search ?? null,
      usesLocalhost: parsed
        ? parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
        : false,
      productionSafe: false,
    };
  }
}
