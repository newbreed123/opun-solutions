import {
  getSupabaseAdminConfig,
  supabaseAdminFetch,
  supabaseAdminRpc,
} from "@/lib/supabase-admin";
import { logCustomerInvitationActivationFailure } from "./activation-diagnostics";

type CreateCustomerResult = {
  organization_id: string;
  invitation_id: string;
  was_created: boolean;
};

type CustomerInvitationRow = {
  id: string;
  organization_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  auth_user_id: string | null;
  invitation_state:
    | "draft"
    | "invite_pending"
    | "invited"
    | "activated"
    | "invite_failed";
};

type OrganizationRow = {
  id: string;
  name: string;
  status?: string;
};

type AuthUser = {
  id?: string;
};

type AuthLinkResponse = {
  id?: string;
  action_link?: string;
  hashed_token?: string;
  user?: AuthUser;
  msg?: string;
  message?: string;
  error?: string;
};

type AuthResponse = AuthUser & {
  user?: AuthUser;
  msg?: string;
  message?: string;
  error?: string;
};

export type InvitationResult =
  | { ok: true; state: "invited" }
  | { ok: false; error: string; state: "invite_failed" };

export type InvitationActivationValidationResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      status: number | null;
      code: "invitation_record_invalid" | "supabase_api_key_invalid";
    };

const INVITATION_SELECT =
  "id,organization_id,email,first_name,last_name,auth_user_id,invitation_state";

export async function createCustomerOnboarding({
  requestId,
  customerName,
  businessName,
  email,
  organizationType,
  planCode,
  setupFee,
  monthlySubscription,
}: {
  requestId: string;
  customerName: string;
  businessName: string;
  email: string;
  organizationType: string;
  planCode: string;
  setupFee: number;
  monthlySubscription: number;
}) {
  const names = splitCustomerName(customerName);
  if (!names.firstName) {
    return { ok: false as const, error: "Enter the customer's name." };
  }

  const result = await supabaseAdminRpc<CreateCustomerResult[]>(
    "create_customer_onboarding",
    {
      p_request_id: requestId,
      p_customer_name: [names.firstName, names.lastName].filter(Boolean).join(" "),
      p_business_name: businessName,
      p_email: email,
      p_organization_type: organizationType,
      p_plan_code: planCode,
      p_setup_fee: setupFee,
      p_monthly_subscription: monthlySubscription,
    },
  );

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  const created = result.data[0];
  if (!created?.organization_id || !created.invitation_id) {
    return {
      ok: false as const,
      error: "Customer setup did not return its organization and invitation.",
    };
  }

  return {
    ok: true as const,
    organizationId: created.organization_id,
    invitationId: created.invitation_id,
    wasCreated: created.was_created,
  };
}

export async function sendCustomerInvitation(
  invitationId: string,
  resend = false,
): Promise<InvitationResult> {
  const inviteResult = await supabaseAdminFetch<CustomerInvitationRow[]>(
    "organization_invitations",
    {
      query: {
        select: INVITATION_SELECT,
        id: `eq.${invitationId}`,
        limit: 1,
      },
    },
  );

  const invitation = inviteResult.ok ? inviteResult.data[0] : null;
  if (!inviteResult.ok || !invitation) {
    return {
      ok: false,
      state: "invite_failed",
      error: "The customer invitation could not be loaded.",
    };
  }
  if (invitation.invitation_state === "activated") {
    return {
      ok: false,
      state: "invite_failed",
      error: "This customer has already activated their account.",
    };
  }

  const organizationResult = await supabaseAdminFetch<OrganizationRow[]>(
    "organizations",
    {
      query: {
        select: "id,name,status",
        id: `eq.${invitation.organization_id}`,
        limit: 1,
      },
    },
  );
  const organization = organizationResult.ok
    ? organizationResult.data[0]
    : null;
  if (!organization) {
    return {
      ok: false,
      state: "invite_failed",
      error: "The customer's organization could not be loaded.",
    };
  }
  if (organization.status === "archived") {
    return {
      ok: false,
      state: "invite_failed",
      error: "Archived organizations cannot receive customer invitations.",
    };
  }

  const redirectTo = configuredInviteRedirect();
  if (!redirectTo.ok) {
    await markInvitationFailed(invitation.id, redirectTo.code);
    return {
      ok: false,
      state: "invite_failed",
      error: redirectTo.error,
    };
  }

  const pending = await updateInvitation(invitation.id, {
    invitation_state: "invite_pending",
    last_error: null,
    updated_at: new Date().toISOString(),
  });
  if (!pending.ok) {
    return {
      ok: false,
      state: "invite_failed",
      error: "The invitation could not be prepared. No email was sent.",
    };
  }

  let userId = invitation.auth_user_id;
  let delivery: "supabase-auth" | "resend" = "supabase-auth";

  if (resend && userId) {
    const linkResult = await createMagicLink({
      email: invitation.email,
      redirectTo: redirectTo.url,
    });
    if (!linkResult.ok) {
      await markInvitationFailed(
        invitation.id,
        linkResult.code,
        userId ?? undefined,
      );
      return {
        ok: false,
        state: "invite_failed",
        error: linkResult.error,
      };
    }
    userId = linkResult.userId || userId;
    const emailResult = await sendResendInvitation({
      email: invitation.email,
      firstName: invitation.first_name ?? "",
      businessName: organization.name,
      tokenHash: linkResult.tokenHash,
      invitationId: invitation.id,
    });
    if (!emailResult.ok) {
      await markInvitationFailed(
        invitation.id,
        emailResult.code,
        userId ?? undefined,
      );
      return {
        ok: false,
        state: "invite_failed",
        error: emailResult.error,
      };
    }
    delivery = "resend";
  } else {
    const authResult = await inviteWithSupabase({
      email: invitation.email,
      redirectTo: redirectTo.url,
      invitationId: invitation.id,
      organizationId: invitation.organization_id,
      businessName: organization.name,
      firstName: invitation.first_name ?? "",
      lastName: invitation.last_name ?? "",
    });

    if (authResult.ok) {
      userId = authResult.userId;
    } else if (authResult.alreadyRegistered) {
      const linkResult = await createMagicLink({
        email: invitation.email,
        redirectTo: redirectTo.url,
      });
      if (!linkResult.ok) {
        await markInvitationFailed(invitation.id, linkResult.code);
        return {
          ok: false,
          state: "invite_failed",
          error: linkResult.error,
        };
      }
      userId = linkResult.userId ?? invitation.auth_user_id;
      const emailResult = await sendResendInvitation({
        email: invitation.email,
        firstName: invitation.first_name ?? "",
        businessName: organization.name,
        tokenHash: linkResult.tokenHash,
        invitationId: invitation.id,
      });
      if (!emailResult.ok) {
        await markInvitationFailed(
          invitation.id,
          emailResult.code,
          userId ?? undefined,
        );
        return {
          ok: false,
          state: "invite_failed",
          error: emailResult.error,
        };
      }
      delivery = "resend";
    } else {
      await markInvitationFailed(invitation.id, authResult.code);
      return {
        ok: false,
        state: "invite_failed",
        error: authResult.error,
      };
    }
  }

  if (!userId) {
    await markInvitationFailed(invitation.id, "auth_user_id_missing");
    return {
      ok: false,
      state: "invite_failed",
      error: "Supabase Auth did not return a customer account identifier.",
    };
  }

  const linked = await supabaseAdminRpc<string>(
    "link_customer_invitation",
    {
      p_invitation_id: invitation.id,
      p_user_id: userId,
      p_delivery: delivery,
    },
  );
  if (!linked.ok || !["invited", "activated"].includes(linked.data)) {
    const state = await invitationState(invitation.id);
    if (state?.auth_user_id === userId && state.invitation_state === "invited") {
      return { ok: true, state: "invited" };
    }
    if (
      state?.auth_user_id === userId &&
      state.invitation_state === "activated"
    ) {
      return { ok: true, state: "invited" };
    }
    await markInvitationFailed(
      invitation.id,
      `customer_link_http_${linked.ok ? 200 : linked.status}`,
      userId,
    );
    return {
      ok: false,
      state: "invite_failed",
      error:
        "The invitation was sent, but account linking needs reconciliation. Retry the invitation.",
    };
  }

  return { ok: true, state: "invited" };
}

export async function activateCustomerInvitation({
  invitationId,
  userId,
  email,
}: {
  invitationId: string;
  userId: string;
  email: string;
}) {
  const result = await supabaseAdminRpc<boolean>(
    "activate_customer_invitation",
    {
      p_invitation_id: invitationId,
      p_user_id: userId,
      p_email: email.toLowerCase(),
    },
  );
  if (!result.ok || result.data !== true) {
    const providerMessage = result.ok ? "" : result.error;
    const code = /invalid api key/i.test(providerMessage)
      ? "supabase_api_key_invalid"
      : /invitation is not assigned|invitation cannot be linked/i.test(
            providerMessage,
          ) || (result.ok && result.data !== true)
        ? "invitation_record_invalid"
        : "membership_activation_failed";
    logCustomerInvitationActivationFailure({
      stage: "membership_activation",
      method: "POST",
      endpoint: "/rest/v1/rpc/activate_customer_invitation",
      status: result.status,
      diagnosticCode: code,
      keySource: "SUPABASE_SERVICE_ROLE_KEY",
      urlSource: "SUPABASE_URL",
    });
    return {
      ok: false as const,
      error:
        "Account activation could not be completed. Contact Opzix support.",
    };
  }
  return { ok: true as const };
}

export async function validateCustomerInvitationForActivation({
  invitationId,
  userId,
  email,
}: {
  invitationId: string;
  userId: string;
  email: string;
}): Promise<InvitationActivationValidationResult> {
  const inviteResult = await supabaseAdminFetch<CustomerInvitationRow[]>(
    "organization_invitations",
    {
      query: {
        select: INVITATION_SELECT,
        id: `eq.${invitationId}`,
        limit: 1,
      },
    },
  );
  if (!inviteResult.ok) {
    return {
      ok: false,
      error: "The customer invitation could not be loaded.",
      status: inviteResult.status,
      code: /invalid api key/i.test(inviteResult.error)
        ? "supabase_api_key_invalid"
        : "invitation_record_invalid",
    };
  }

  const invitation = inviteResult.data[0];
  if (
    !invitation ||
    invitation.auth_user_id !== userId ||
    invitation.email.toLowerCase() !== email.toLowerCase() ||
    invitation.invitation_state === "activated" ||
    !["invite_pending", "invited", "invite_failed"].includes(
      invitation.invitation_state,
    )
  ) {
    return {
      ok: false,
      error: "This invitation is not eligible for activation.",
      status: inviteResult.status,
      code: "invitation_record_invalid",
    };
  }

  const organizationResult = await supabaseAdminFetch<OrganizationRow[]>(
    "organizations",
    {
      query: {
        select: "id,status",
        id: `eq.${invitation.organization_id}`,
        limit: 1,
      },
    },
  );
  if (!organizationResult.ok) {
    return {
      ok: false,
      error: "The customer's organization could not be loaded.",
      status: organizationResult.status,
      code: /invalid api key/i.test(organizationResult.error)
        ? "supabase_api_key_invalid"
        : "invitation_record_invalid",
    };
  }

  const organization = organizationResult.data[0];
  if (!organization || organization.status === "archived") {
    return {
      ok: false,
      error: "This invitation is not eligible for activation.",
      status: organizationResult.status,
      code: "invitation_record_invalid",
    };
  }

  return { ok: true };
}

async function inviteWithSupabase({
  email,
  redirectTo,
  invitationId,
  organizationId,
  businessName,
  firstName,
  lastName,
}: {
  email: string;
  redirectTo: string;
  invitationId: string;
  organizationId: string;
  businessName: string;
  firstName: string;
  lastName: string;
}) {
  const config = getSupabaseAdminConfig();
  if (!config) {
    return {
      ok: false as const,
      code: "supabase_admin_not_configured",
      error: "Supabase server-side Auth credentials are not configured.",
      alreadyRegistered: false,
    };
  }

  const url = new URL(`${config.url}/auth/v1/invite`);
  url.searchParams.set("redirect_to", redirectTo);
  const response = await fetch(url, {
    method: "POST",
    headers: adminAuthHeaders(config.serviceRoleKey),
    body: JSON.stringify({
      email,
      data: {
        organization_id: organizationId,
        organization_invitation_id: invitationId,
        business_name: businessName,
        first_name: firstName,
        last_name: lastName,
      },
    }),
  }).catch(() => null);
  if (!response) {
    return {
      ok: false as const,
      code: "supabase_auth_transport_error",
      error: "Supabase Auth could not be reached. No invitation confirmation was received.",
      alreadyRegistered: false,
    };
  }

  const payload = (await response.json().catch(() => ({}))) as AuthResponse;
  const userId = payload.id ?? payload.user?.id;
  if (!response.ok || !userId) {
    const alreadyRegistered =
      response.status === 422 &&
      /already (been )?registered|already exists|user exists/i.test(
        [payload.msg, payload.message, payload.error].filter(Boolean).join(" "),
      );
    return {
      ok: false as const,
      code: alreadyRegistered
        ? "auth_user_already_registered"
        : `supabase_auth_http_${response.status}`,
      error: alreadyRegistered
        ? "An account already exists for this email; issuing a secure replacement link."
        : `Supabase Auth rejected the invitation (HTTP ${response.status}).`,
      alreadyRegistered,
    };
  }

  return { ok: true as const, userId };
}

async function createMagicLink({
  email,
  redirectTo,
}: {
  email: string;
  redirectTo: string;
}) {
  const config = getSupabaseAdminConfig();
  if (!config) {
    return {
      ok: false as const,
      code: "supabase_admin_not_configured",
      error: "Supabase server-side Auth credentials are not configured.",
    };
  }

  const endpoint = new URL(`${config.url}/auth/v1/admin/generate_link`);
  endpoint.searchParams.set("redirect_to", redirectTo);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: adminAuthHeaders(config.serviceRoleKey),
    body: JSON.stringify({ type: "magiclink", email }),
  }).catch(() => null);

  if (!response) {
    return {
      ok: false as const,
      code: "supabase_link_transport_error",
      error: "Supabase could not create a secure replacement invitation.",
    };
  }
  const payload = (await response.json().catch(() => ({}))) as AuthLinkResponse;
  if (!response.ok || !payload.hashed_token) {
    return {
      ok: false as const,
      code: `supabase_link_http_${response.status}`,
      error: `Supabase could not create a secure replacement invitation (HTTP ${response.status}).`,
    };
  }

  return {
    ok: true as const,
    tokenHash: payload.hashed_token,
    userId: payload.user?.id ?? payload.id,
  };
}

async function sendResendInvitation({
  email,
  firstName,
  businessName,
  tokenHash,
  invitationId,
}: {
  email: string;
  firstName: string;
  businessName: string;
  tokenHash: string;
  invitationId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.OPZIX_AUTH_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return {
      ok: false as const,
      code: "resend_not_configured",
      error:
        "Replacement invitation email needs RESEND_API_KEY and OPZIX_AUTH_FROM_EMAIL configured.",
    };
  }

  const redirectTo = configuredInviteRedirect();
  if (!redirectTo.ok) {
    return {
      ok: false as const,
      code: redirectTo.code,
      error: redirectTo.error,
    };
  }

  const link = new URL(redirectTo.url);
  link.searchParams.set("token_hash", tokenHash);
  link.searchParams.set("type", "magiclink");
  link.searchParams.set("organization_invitation_id", invitationId);
  const name = escapeHtml(firstName || "there");
  const business = escapeHtml(businessName);
  const url = link.toString();
  const text = [
    `Welcome to Opzix, ${firstName || "there"}.`,
    `Your account for ${businessName} is ready.`,
    "Complete your account setup to begin onboarding your real estate platform:",
    url,
    "If you were not expecting this invitation, you can ignore this email.",
  ].join("\n\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#132238;line-height:1.6"><p>Welcome to Opzix, ${name}.</p><p>Your account for <strong>${business}</strong> is ready.</p><p>Complete your account setup to begin onboarding your real estate platform.</p><p><a href="${escapeHtml(url)}" style="display:inline-block;background:#13b8d4;color:#06202a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Complete Account Setup</a></p><p>If you were not expecting this invitation, you can ignore this email.</p></div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "You're invited to Opzix",
      text,
      html,
    }),
  }).catch(() => null);

  if (!response) {
    return {
      ok: false as const,
      code: "resend_transport_error",
      error: "The transactional email provider could not be reached.",
    };
  }
  if (!response.ok) {
    return {
      ok: false as const,
      code: `resend_http_${response.status}`,
      error: `The transactional email provider rejected the invitation (HTTP ${response.status}).`,
    };
  }

  return { ok: true as const };
}

async function updateInvitation(
  invitationId: string,
  body: Record<string, unknown>,
) {
  return supabaseAdminFetch<null>("organization_invitations", {
    method: "PATCH",
    query: { id: `eq.${invitationId}` },
    body,
    prefer: "return=minimal",
  });
}

async function invitationState(invitationId: string) {
  const result = await supabaseAdminFetch<
    Pick<CustomerInvitationRow, "auth_user_id" | "invitation_state">[]
  >("organization_invitations", {
    query: {
      select: "auth_user_id,invitation_state",
      id: `eq.${invitationId}`,
      limit: 1,
    },
  });
  if (!result.ok) throw new Error(result.error);
  return result.data[0] ?? null;
}

async function markInvitationFailed(
  invitationId: string,
  errorCode: string,
  userId?: string,
) {
  const update = await updateInvitation(invitationId, {
    ...(userId ? { auth_user_id: userId } : {}),
    invitation_state: "invite_failed",
    last_error: errorCode,
    updated_at: new Date().toISOString(),
  });
  if (!update.ok) {
    throw new Error(`Invitation failure state could not be saved: ${update.error}`);
  }
  const invitation = await supabaseAdminFetch<CustomerInvitationRow[]>(
    "organization_invitations",
    {
      query: {
        select: "id,organization_id,email,first_name,last_name,auth_user_id,invitation_state",
        id: `eq.${invitationId}`,
        limit: 1,
      },
    },
  );
  if (!invitation.ok) throw new Error(invitation.error);
  const row = invitation.data[0];
  if (row) {
    await recordInvitationEvent({
      organizationId: row.organization_id,
      invitationId: row.id,
      eventName: "customer_invitation_failed",
      metadata: { errorCode: safeErrorCode(errorCode) },
    });
  } else {
    throw new Error("Invitation record could not be reloaded after failure.");
  }
  return update;
}

async function recordInvitationEvent({
  organizationId,
  invitationId,
  eventName,
  metadata,
}: {
  organizationId: string;
  invitationId: string;
  eventName: string;
  metadata: Record<string, string>;
}) {
  const result = await supabaseAdminFetch<null>(
    "customer_account_audit_events",
    {
    method: "POST",
    body: {
      organization_id: organizationId,
      event_name: eventName,
      target_type: "organization_invitation",
      target_id: invitationId,
      metadata: { ...metadata, actor: "opzix-admin-session" },
    },
    prefer: "return=minimal",
    },
  );
  if (!result.ok) throw new Error(result.error);
}

function configuredInviteRedirect() {
  const value = process.env.OPZIX_AUTH_REDIRECT_URL?.trim();
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  if (!value) {
    return {
      ok: false as const,
      code: "invite_redirect_not_configured",
      error: "Set OPZIX_AUTH_REDIRECT_URL to the permitted /accept-invite URL.",
    };
  }

  try {
    const url = new URL(value);
    if (
      url.pathname !== "/accept-invite" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      (isProduction &&
        (url.protocol !== "https:" ||
          url.hostname !== "opzix.io" ||
          url.host !== "opzix.io" ||
          value !== "https://opzix.io/accept-invite")) ||
      (!isProduction &&
        !["https:", "http:"].includes(url.protocol))
    ) {
      throw new Error("invalid redirect");
    }
    return { ok: true as const, url: value };
  } catch {
    return {
      ok: false as const,
      code: "invite_redirect_invalid",
      error:
        "OPZIX_AUTH_REDIRECT_URL must be the exact permitted /accept-invite URL.",
    };
  }
}

function adminAuthHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function splitCustomerName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeErrorCode(value: string) {
  return /^[a-z0-9_-]+$/i.test(value) ? value.slice(0, 80) : "invite_failed";
}
