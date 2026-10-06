import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdminConfig } from "@/lib/supabase-admin";
import { activateCustomerInvitation } from "./admin-invitations";
import type { CustomerUser } from "./types";

const ACCESS_COOKIE = "opzix_customer_access_token";
const REFRESH_COOKIE = "opzix_customer_refresh_token";

type SupabaseAuthConfig = {
  url: string;
  anonKey: string;
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

export function getSupabaseAuthConfig(): SupabaseAuthConfig | null {
  const adminConfig = getSupabaseAdminConfig();
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    adminConfig?.url;
  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;

  return {
    url: url.replace(/\/$/, ""),
    anonKey,
  };
}

export async function signInWithPassword(email: string, password: string) {
  const config = getSupabaseAuthConfig();
  if (!config) {
    return {
      ok: false as const,
      error: "Supabase Auth environment variables are not configured.",
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
    return {
      ok: false as const,
      error: "Supabase Auth environment variables are not configured.",
    };
  }

  const verified = await fetch(`${config.url}/auth/v1/verify`, {
    method: "POST",
    headers: authHeaders(config.anonKey),
    body: JSON.stringify({ type: verificationType, token_hash: tokenHash }),
  }).catch((error: unknown) => authFetchError(error));

  if (!("json" in verified)) return verified;
  const session = (await verified.json().catch(() => ({}))) as
    | SupabaseAuthSession
    | Record<string, unknown>;

  if (!verified.ok || !("access_token" in session)) {
    return {
      ok: false as const,
      error: authErrorMessage(session) || "Invitation could not be verified.",
    };
  }

  const verifiedSession = session as SupabaseAuthSession;
  let authUser = verifiedSession.user;
  if (!authUser?.id || !authUser.email) {
    const userResponse = await fetch(`${config.url}/auth/v1/user`, {
      method: "GET",
      headers: {
        ...authHeaders(config.anonKey),
        Authorization: `Bearer ${verifiedSession.access_token}`,
      },
      cache: "no-store",
    }).catch((error: unknown) => authFetchError(error));

    if (!("json" in userResponse) || !userResponse.ok) {
      return {
        ok: false as const,
        error: "The verified customer account could not be loaded.",
      };
    }
    authUser = (await userResponse.json().catch(() => ({}))) as
      | SupabaseAuthUserResponse
      | undefined;
  }

  if (!authUser?.id || !authUser.email) {
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
  }).catch((error: unknown) => authFetchError(error));

  if (!("json" in update)) return update;
  const updatePayload = await update.json().catch(() => ({}));

  if (!update.ok) {
    return {
      ok: false as const,
      error: authErrorMessage(updatePayload) || "Password could not be saved.",
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

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
