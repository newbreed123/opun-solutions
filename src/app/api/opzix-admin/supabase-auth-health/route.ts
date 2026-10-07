import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getPasswordRecoveryRedirectConfig,
  PRODUCTION_PASSWORD_RECOVERY_REDIRECT,
} from "@/lib/customer-platform/password-recovery-redirect";

export const dynamic = "force-dynamic";

const EXPECTED_SUPABASE_PROJECT_REF = "qskrnivgfmymvtuaefmt";
const EXPECTED_SUPABASE_HOST = `${EXPECTED_SUPABASE_PROJECT_REF}.supabase.co`;

type EnvName =
  | "SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_ANON_KEY"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export async function GET(request: NextRequest) {
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim() || "";
  const providedPasscode =
    request.nextUrl.searchParams.get("passcode")?.trim() ||
    request.headers.get("x-opzix-admin-passcode")?.trim() ||
    "";

  if (!passcode) {
    return NextResponse.json(
      { ok: false, error: "Set OPZIX_ADMIN_PASSCODE before using this diagnostic." },
      { status: 503 },
    );
  }

  if (providedPasscode !== passcode) {
    return NextResponse.json(
      { ok: false, error: "Passcode required." },
      { status: 401 },
    );
  }

  const supabaseUrl = envValue("SUPABASE_URL");
  const publicSupabaseUrl = envValue("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = envValue("SUPABASE_ANON_KEY");
  const publicAnonKey = envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const selectedUrl = supabaseUrl || publicSupabaseUrl;
  const selectedUrlSource = supabaseUrl
    ? "SUPABASE_URL"
    : publicSupabaseUrl
      ? "NEXT_PUBLIC_SUPABASE_URL"
      : null;
  const selectedKeySource = anonKey
    ? "SUPABASE_ANON_KEY"
    : publicAnonKey
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      : null;

  const [serverAnonHealth, publicAnonHealth] = await Promise.all([
    checkSupabaseAuthPublicKey({
      url: selectedUrl,
      urlSource: selectedUrlSource,
      key: anonKey,
      keySource: "SUPABASE_ANON_KEY",
    }),
    checkSupabaseAuthPublicKey({
      url: selectedUrl,
      urlSource: selectedUrlSource,
      key: publicAnonKey,
      keySource: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    }),
  ]);
  const passwordResetRedirect = describePasswordResetRedirect();

  return NextResponse.json({
    ok:
      Boolean(selectedUrl) &&
      Boolean(selectedKeySource) &&
      passwordResetRedirect.ok &&
      (selectedKeySource === "SUPABASE_ANON_KEY"
        ? serverAnonHealth.valid === true
        : publicAnonHealth.valid === true),
    runtime: {
      nodeEnv: process.env.NODE_ENV || "",
      vercelEnv: process.env.VERCEL_ENV || "",
    },
    expectedSupabase: {
      projectRef: EXPECTED_SUPABASE_PROJECT_REF,
      host: EXPECTED_SUPABASE_HOST,
    },
    selectedAuthConfig: {
      urlSource: selectedUrlSource,
      keySource: selectedKeySource,
      urlMatchesExpectedProject: selectedUrl
        ? urlMatchesExpectedProject(selectedUrl)
        : false,
    },
    urls: {
      SUPABASE_URL: describeSupabaseUrl(supabaseUrl),
      NEXT_PUBLIC_SUPABASE_URL: describeSupabaseUrl(publicSupabaseUrl),
    },
    keys: {
      SUPABASE_ANON_KEY: describePublicAuthKey(anonKey),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: describePublicAuthKey(publicAnonKey),
      samePublicKey: Boolean(
        anonKey && publicAnonKey && anonKey === publicAnonKey,
      ),
    },
    healthChecks: {
      SUPABASE_ANON_KEY: serverAnonHealth,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: publicAnonHealth,
    },
    passwordResetRedirect,
    hint:
      "This endpoint performs read-only GET /auth/v1/settings checks and does not send email, create customers, or change authentication state.",
  });
}

function envValue(name: EnvName) {
  return process.env[name]?.trim() || "";
}

function describeSupabaseUrl(value: string) {
  if (!value) {
    return {
      present: false,
      host: null,
      projectRef: null,
      matchesExpectedProject: false,
    };
  }

  try {
    const url = new URL(value);
    return {
      present: true,
      host: url.host,
      projectRef: projectRefFromSupabaseHost(url.hostname),
      matchesExpectedProject: url.hostname === EXPECTED_SUPABASE_HOST,
    };
  } catch {
    return {
      present: true,
      host: null,
      projectRef: null,
      matchesExpectedProject: false,
    };
  }
}

function describePublicAuthKey(value: string) {
  if (!value) {
    return {
      present: false,
      length: 0,
      fingerprint: null,
      kind: null,
      jwtRole: null,
    };
  }

  const jwtRole = jwtRoleFromKey(value);
  return {
    present: true,
    length: value.length,
    fingerprint: createHash("sha256").update(value).digest("hex").slice(0, 12),
    kind: keyKind(value, jwtRole),
    jwtRole,
  };
}

async function checkSupabaseAuthPublicKey({
  url,
  urlSource,
  key,
  keySource,
}: {
  url: string;
  urlSource: "SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_URL" | null;
  key: string;
  keySource: "SUPABASE_ANON_KEY" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
}) {
  if (!url || !key) {
    return {
      checked: false,
      endpoint: "/auth/v1/settings",
      method: "GET",
      valid: null,
      status: null,
      diagnosticCode: "supabase_config_missing",
      urlSource,
      keySource,
      upstreamCode: null,
      upstreamMessage: null,
    };
  }

  let endpoint: URL;
  try {
    endpoint = new URL(`${url.replace(/\/$/, "")}/auth/v1/settings`);
  } catch {
    return {
      checked: false,
      endpoint: "/auth/v1/settings",
      method: "GET",
      valid: null,
      status: null,
      diagnosticCode: "supabase_url_invalid",
      urlSource,
      keySource,
      upstreamCode: null,
      upstreamMessage: null,
    };
  }

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      apikey: key,
      Accept: "application/json",
    },
    cache: "no-store",
  }).catch(() => null);

  if (!response) {
    return {
      checked: true,
      endpoint: "/auth/v1/settings",
      method: "GET",
      valid: null,
      status: null,
      diagnosticCode: "auth_transport_error",
      urlSource,
      keySource,
      upstreamCode: null,
      upstreamMessage: null,
    };
  }

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const failure = authHealthFailure(response.status, payload);
  return {
    checked: true,
    endpoint: "/auth/v1/settings",
    method: "GET",
    valid: response.ok,
    status: response.status,
    diagnosticCode: response.ok ? null : failure.diagnosticCode,
    urlSource,
    keySource,
    upstreamCode: response.ok ? null : failure.upstreamCode,
    upstreamMessage: response.ok ? null : failure.upstreamMessage,
  };
}

function authHealthFailure(status: number, payload: Record<string, unknown>) {
  const upstreamCode = safeUpstreamCode(
    payload.error_code ?? payload.code ?? payload.name,
  );
  const upstreamMessage = safeDiagnosticMessage(
    [payload.message, payload.msg, payload.error_description]
      .filter((value): value is string => typeof value === "string")
      .join(" "),
  );
  const diagnosticCode =
    upstreamCode === "invalid_api_key" ||
    /invalid api key/i.test(upstreamMessage || "")
      ? "supabase_api_key_invalid"
      : `supabase_auth_settings_${status}`;

  return {
    diagnosticCode,
    upstreamCode,
    upstreamMessage,
  };
}

function describePasswordResetRedirect() {
  const config = getPasswordRecoveryRedirectConfig();

  return {
    ok: config.ok,
    source: config.source,
    configured: config.ok ? config.url : config.configured,
    expectedProduction: PRODUCTION_PASSWORD_RECOVERY_REDIRECT,
    host: config.host,
    pathname: config.pathname,
    search: config.search,
    usesLocalhost: config.usesLocalhost,
    productionSafe: config.productionSafe,
    error: config.ok ? null : config.error,
  };
}

function keyKind(value: string, jwtRole: string | null) {
  if (value.startsWith("sb_publishable_")) return "supabase_publishable";
  if (value.startsWith("sb_secret_")) return "supabase_secret";
  if (jwtRole === "anon") return "legacy_jwt_anon";
  if (jwtRole === "service_role") return "legacy_jwt_service_role";
  if (value.split(".").length === 3) return "legacy_jwt_unknown_role";
  return "unknown";
}

function jwtRoleFromKey(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(base64UrlToBase64(parts[1]), "base64").toString("utf8"),
    ) as Record<string, unknown>;
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function safeUpstreamCode(value: unknown) {
  return typeof value === "string" && /^[a-z0-9_-]{1,80}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

function safeDiagnosticMessage(value: string) {
  const message = value.trim().replace(/\s+/g, " ");
  if (!message) return null;
  if (message.length > 180) return null;
  if (/@/.test(message)) return null;
  if (/eyJ[a-z0-9_-]*\./i.test(message)) return null;
  if (/[a-z0-9_-]{32,}/i.test(message)) return null;
  return message;
}

function projectRefFromSupabaseHost(hostname: string) {
  return hostname.endsWith(".supabase.co")
    ? hostname.replace(".supabase.co", "")
    : null;
}

function urlMatchesExpectedProject(value: string) {
  try {
    return new URL(value).hostname === EXPECTED_SUPABASE_HOST;
  } catch {
    return false;
  }
}

function base64UrlToBase64(value: string) {
  return value.replace(/-/g, "+").replace(/_/g, "/");
}
