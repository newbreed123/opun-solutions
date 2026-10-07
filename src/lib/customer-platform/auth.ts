import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdminConfig } from "@/lib/supabase-admin";
import { logCustomerInvitationActivationFailure } from "./activation-diagnostics";
import type { ActivationDiagnosticCode } from "./activation-diagnostics";
import { activateCustomerInvitation } from "./admin-invitations";
import type { CustomerUser } from "./types";

const ACCESS_COOKIE = "opzix_customer_access_token";
const REFRESH_COOKIE = "opzix_customer_refresh_token";

type SupabaseAuthConfig = {
  url: string;
  anonKey: string;
  urlSource: "SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_URL";
  keySource: "SUPABASE_ANON_KEY" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
};

type SupabaseAuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
};

type SupabaseAuthUserResponse = {
  id?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type AuthFailure = {
  status: number | null;
  code: ActivationDiagnosticCode;
  message: string;
};

export function getSupabaseAuthConfig(): SupabaseAuthConfig | null {
  const adminConfig = getSupabaseAdminConfig();
  const configuredUrl = process.env.SUPABASE_URL?.trim();
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const configuredAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const url = configuredUrl || publicUrl || adminConfig?.url;
  const anonKey = configuredAnonKey || publicAnonKey;

  if (!url || !anonKey) return null;

  return {
    url: url.replace(/\/$/, ""),
    anonKey,
    urlSource: configuredUrl
      ? "SUPABASE_URL"
      : publicUrl
        ? "NEXT_PUBLIC_SUPABASE_URL"
        : "SUPABASE_URL",
    keySource: configuredAnonKey
      ? "SUPABASE_ANON_KEY"
      : "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  };
}

export async function signInWithPassword(email: string, password: string) {
  const config = getSupabaseAuthConfig();
  if (!config) {
    console.warn({
      event: "customer_sign_in_failed",
      stage: "password_sign_in",
      method: "POST",
      endpoint: "/auth/v1/token",
      status: null,
      diagnosticCode: "supabase_config_missing",
      keySource: configuredAuthKeySource(),
      urlSource: configuredAuthUrlSource(),
    });
    return {
      ok: false as const,
      error:
        "Account activation is temporarily unavailable. Contact Opzix support.",
    };
  }

  const response = await fetch(
    `${config.url}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: authHeaders(config.anonKey),
      body: JSON.stringify({ email, password }),
    },
  ).catch((error: unknown) => authFetchError(error));

  if (!("json" in response)) return response;

  const payload = (await response.json().catch(() => ({}))) as
    | SupabaseAuthSession
    | { error_description?: string; msg?: string; message?: string };

  if (!response.ok || !("access_token" in payload)) {
    return {
      ok: false as const,
      error: authErrorMessage(payload) || "Sign in failed.",
    };
  }

  await persistAuthSession(payload);
  return { ok: true as const };
}

export async function requestPasswordReset(email: string) {
  const config = getSupabaseAuthConfig();
  if (!config) {
    return {
      ok: false as const,
      error: "Supabase Auth environment variables are not configured.",
    };
  }

  const redirectTo = `${siteUrl()}/accept-invite?mode=recovery`;
  const response = await fetch(`${config.url}/auth/v1/recover`, {
    method: "POST",
    headers: authHeaders(config.anonKey),
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  }).catch((error: unknown) => authFetchError(error));

  if (!("json" in response)) return response;
  const payload = await response.json().catch(() => ({}));

  return response.ok
    ? { ok: true as const }
    : {
        ok: false as const,
        error: authErrorMessage(payload) || "Password reset request failed.",
      };
}

export async function verifyInviteToken({
  tokenHash,
  password,
  invitationId,
  verificationType,
}: {
  tokenHash: string;
  password: string;
  invitationId: string;
  verificationType: "invite" | "magiclink";
}) {
  const config = getSupabaseAuthConfig();
  if (!config) {
    logCustomerInvitationActivationFailure({
      stage: "token_verification",
      method: "POST",
      endpoint: "/auth/v1/verify",
      status: null,
      diagnosticCode: "supabase_config_missing",
      keySource: configuredAuthKeySource(),
      urlSource: configuredAuthUrlSource(),
    });
    return {
      ok: false as const,
      error: "Supabase Auth environment variables are not configured.",
    };
  }

  const verified = await fetch(`${config.url}/auth/v1/verify`, {
    method: "POST",
    headers: authHeaders(config.anonKey),
    body: JSON.stringify({ type: verificationType, token_hash: tokenHash }),
  }).catch(() => null);
  if (!verified) {
    logCustomerInvitationActivationFailure({
      stage: "token_verification",
      method: "POST",
      endpoint: "/auth/v1/verify",
      status: null,
      diagnosticCode: "auth_transport_error",
      urlSource: config.urlSource,
      keySource: config.keySource,
    });
    return {
      ok: false as const,
      error:
        "The activation link could not be verified. Ask Opzix to send a fresh link.",
    };
  }
  const session = (await verified.json().catch(() => ({}))) as
    | SupabaseAuthSession
    | Record<string, unknown>;

  if (!verified.ok || !("access_token" in session)) {
    const failure = invitationVerificationFailure(
      verified.status,
      session,
    );
    logCustomerInvitationActivationFailure({
      stage: "token_verification",
      method: "POST",
      endpoint: "/auth/v1/verify",
      status: failure.status,
      diagnosticCode: failure.code,
      urlSource: config.urlSource,
      keySource: config.keySource,
    });
    return {
      ok: false as const,
      error: failure.code === "supabase_api_key_invalid"
        ? "Account activation is temporarily unavailable. Contact Opzix support."
        : failure.code === "invite_token_expired"
          ? "This activation link has expired. Ask Opzix to send a fresh link."
          : "This activation link could not be verified. Ask Opzix to send a fresh link.",
    };
  }

  const verifiedSession = session as SupabaseAuthSession;
  let authUser = verifiedSession.user;
  let authUserLookupStatus: number | null = null;
  if (!authUser?.id || !authUser.email) {
    const userResponse = await fetch(`${config.url}/auth/v1/user`, {
      method: "GET",
      headers: {
        ...authHeaders(config.anonKey),
        Authorization: `Bearer ${verifiedSession.access_token}`,
      },
      cache: "no-store",
    }).catch(() => null);

    if (!userResponse || !userResponse.ok) {
      const failure = userResponse
        ? authRequestFailure(
            userResponse.status,
            await responsePayload(userResponse),
          )
        : authTransportFailure();
      logCustomerInvitationActivationFailure({
        stage: "auth_user_lookup",
        method: "GET",
        endpoint: "/auth/v1/user",
        status: failure.status,
        diagnosticCode: failure.code,
        urlSource: config.urlSource,
        keySource: config.keySource,
      });
      return {
        ok: false as const,
        error:
          "Account activation is temporarily unavailable. Contact Opzix support.",
      };
    }
    authUserLookupStatus = userResponse.status;
    authUser = (await userResponse.json().catch(() => ({}))) as
      | SupabaseAuthUserResponse
      | undefined;
  }

  if (!authUser?.id || !authUser.email) {
    logCustomerInvitationActivationFailure({
      stage: "auth_user_lookup",
      method: "GET",
      endpoint: "/auth/v1/user",
      status: authUserLookupStatus,
      diagnosticCode: "auth_request_failed",
      urlSource: config.urlSource,
      keySource: config.keySource,
    });
    return {
      ok: false as const,
      error: "The verified customer account did not include an account identifier.",
    };
  }

  const metadataInvitationId =
    typeof authUser.user_metadata?.organization_invitation_id === "string"
      ? authUser.user_metadata.organization_invitation_id
      : "";
  if (
    verificationType === "invite" &&
    metadataInvitationId !== invitationId
  ) {
    logCustomerInvitationActivationFailure({
      stage: "invitation_validation",
      method: "POST",
      endpoint: "/rest/v1/rpc/activate_customer_invitation",
      status: null,
      diagnosticCode: "invitation_record_invalid",
      urlSource: "SUPABASE_URL",
      keySource: "SUPABASE_SERVICE_ROLE_KEY",
    });
    return {
      ok: false as const,
      error: "This invitation link is not associated with the submitted invitation.",
    };
  }

  const update = await fetch(`${config.url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      ...authHeaders(config.anonKey),
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ password }),
  }).catch(() => null);

  if (!update) {
    logCustomerInvitationActivationFailure({
      stage: "password_update",
      method: "PUT",
      endpoint: "/auth/v1/user",
      status: null,
      diagnosticCode: "auth_transport_error",
      urlSource: config.urlSource,
      keySource: config.keySource,
    });
    return {
      ok: false as const,
      error:
        "Account activation is temporarily unavailable. Contact Opzix support.",
    };
  }
  const updatePayload = await responsePayload(update);

  if (!update.ok) {
    const failure = authRequestFailure(update.status, updatePayload);
    logCustomerInvitationActivationFailure({
      stage: "password_update",
      method: "PUT",
      endpoint: "/auth/v1/user",
      status: failure.status,
      diagnosticCode: failure.code,
      urlSource: config.urlSource,
      keySource: config.keySource,
    });
    return {
      ok: false as const,
      error:
        failure.code === "supabase_api_key_invalid"
          ? "Account activation is temporarily unavailable. Contact Opzix support."
          : "The password could not be saved. Please try again or contact Opzix support.",
    };
  }

  const activation = await activateCustomerInvitation({
    invitationId,
    userId: authUser.id,
    email: authUser.email,
  });
  if (!activation.ok) return activation;

  await persistAuthSession(verifiedSession);
  return { ok: true as const };
}

export async function currentCustomerUser(): Promise<CustomerUser | null> {
  const config = getSupabaseAuthConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "GET",
    headers: {
      ...authHeaders(config.anonKey),
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) return null;

  const user = (await response.json().catch(() => null)) as
    | SupabaseAuthUserResponse
    | null;
  if (!user?.id || !user.email) return null;

  return {
    id: user.id,
    email: user.email,
  };
}

export async function requireCustomerUser() {
  const user = await currentCustomerUser();
  if (!user) redirect("/login");
  return user;
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

async function persistAuthSession(session: SupabaseAuthSession) {
  const cookieStore = await cookies();
  const maxAge = session.expires_in ?? 60 * 60 * 24 * 7;

  cookieStore.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  if (session.refresh_token) {
    cookieStore.set(REFRESH_COOKIE, session.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

function authHeaders(anonKey: string) {
  return {
    apikey: anonKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function authFetchError(error: unknown) {
  return {
    ok: false as const,
    error:
      error instanceof Error && error.message
        ? error.message
        : "Supabase Auth request failed.",
  };
}

function authErrorMessage(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return "";
  const record = payload as Record<string, unknown>;
  return [record.error_description, record.message, record.msg]
    .filter(
      (value): value is string => typeof value === "string" && Boolean(value),
    )
    .join(" ");
}

function invitationVerificationFailure(
  status: number,
  payload: unknown,
): AuthFailure {
  const failure = authRequestFailure(status, payload);
  const code = failure.code;
  const message =
    code === "supabase_api_key_invalid"
      ? "Supabase rejected the configured API key."
      : code === "invite_token_expired"
        ? "Supabase rejected the invitation token as expired or already used."
        : code === "invite_token_invalid"
          ? "Supabase rejected the invitation token."
          : failure.message;
  return {
    status,
    code,
    message,
  };
}

function authRequestFailure(status: number, payload: unknown): AuthFailure {
  const record =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  const candidate = record.error_code ?? record.code ?? record.name;
  const upstreamCode =
    typeof candidate === "string" && /^[a-z0-9_-]{1,80}$/i.test(candidate)
      ? candidate.toLowerCase()
      : "";
  const upstreamMessage = [
    record.message,
    record.msg,
    record.error_description,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");

  if (
    upstreamCode === "invalid_api_key" ||
    /invalid api key/i.test(upstreamMessage)
  ) {
    return {
      status,
      code: "supabase_api_key_invalid",
      message: "Supabase rejected the configured API key.",
    };
  }
  if (
    upstreamCode === "otp_expired" ||
    upstreamCode === "token_expired"
  ) {
    return {
      status,
      code: "invite_token_expired",
      message: "Supabase rejected the invitation token as expired or already used.",
    };
  }
  if (
    upstreamCode === "invalid_token" ||
    upstreamCode === "otp_not_found" ||
    /invalid.*(token|link)|token.*invalid/i.test(upstreamMessage)
  ) {
    return {
      status,
      code: "invite_token_invalid",
      message: "Supabase rejected the invitation token.",
    };
  }
  return {
    status,
    code: "auth_request_failed",
    message: "Supabase rejected the authentication request.",
  };
}

async function responsePayload(response: Response) {
  return (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
}

function authTransportFailure(): AuthFailure {
  return {
    status: null,
    code: "auth_transport_error",
    message: "Supabase Auth request failed before a response was received.",
  };
}

function configuredAuthKeySource():
  | "SUPABASE_ANON_KEY"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | null {
  if (process.env.SUPABASE_ANON_KEY?.trim()) return "SUPABASE_ANON_KEY";
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY";
  }
  return null;
}

function configuredAuthUrlSource():
  | "SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | null {
  if (process.env.SUPABASE_URL?.trim()) return "SUPABASE_URL";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_URL";
  }
  return null;
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
