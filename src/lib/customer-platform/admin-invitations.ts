import { createHash, createHmac, randomBytes, randomInt, randomUUID } from "crypto";
import {
  getSupabaseAdminConfig,
  supabaseAdminFetch,
  supabaseAdminRpc,
} from "@/lib/supabase-admin";
import { logCustomerInvitationActivationFailure } from "./activation-diagnostics";
import { opzixAuthFromAddress, opzixAuthSenderIdentity } from "./email-sender";

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

type AuthAdminUserResponse = {
  id?: string;
  user?: AuthUser;
  app_metadata?: Record<string, unknown>;
  msg?: string;
  message?: string;
  error?: string;
};

type ActivationInvitationTokenRow = {
  id: string;
  invitation_id: string;
  organization_id: string;
  auth_user_id: string;
  email: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  revoked_at: string | null;
  superseded_at: string | null;
};

type ActivationInvitationView =
  | {
      ok: true;
      tokenHash: string;
      tokenId: string;
      invitationId: string;
      organizationId: string;
      authUserId: string;
      email: string;
      businessName: string;
      expiresAt: string;
      state: "valid";
    }
  | {
      ok: false;
      invitationId?: string;
      state:
        | "missing"
        | "invalid"
        | "expired"
        | "used"
        | "superseded"
        | "revoked"
        | "archived"
        | "activated";
    };

type ActivationChallengeResult = {
  ok: boolean;
  invitation_id?: string;
  organization_id?: string;
  auth_user_id?: string;
  email?: string;
  business_name?: string;
  error?: string;
};

type ActivationReservationResult = ActivationChallengeResult & {
  operation_id?: string;
  password_already_set?: boolean;
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

export type ActivationRecoveryRequestResult = {
  ok: true;
  alreadyActivated?: boolean;
};

export type SendActivationCodeResult =
  | { ok: true; challengeId: string; email: string }
  | { ok: false; error: string; invitationId?: string };

export type CompleteActivationWithCodeResult =
  | { ok: true; email: string }
  | { ok: false; error: string; invitationId?: string };

const ACTIVATION_INVITATION_TTL_MS = 24 * 60 * 60 * 1000;
const ACTIVATION_CODE_TTL_MS = 10 * 60 * 1000;

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

  const activationInvitation = await sendApplicationActivationInvitation({
    invitation,
    businessName: organization.name,
    redirectTo: redirectTo.url,
  });

  if (!activationInvitation.ok) {
    await markInvitationFailed(
      invitation.id,
      activationInvitation.code,
      activationInvitation.userId,
    );
    return {
      ok: false,
      state: "invite_failed",
      error:
        activationInvitation.error ??
        "The activation invitation could not be sent.",
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

export async function requestCustomerActivationRecovery({
  invitationId,
  email,
}: {
  invitationId: string;
  email: string;
}): Promise<ActivationRecoveryRequestResult> {
  if (!isUuid(invitationId) || !email) {
    return { ok: true };
  }

  const inviteResult = await supabaseAdminFetch<
    (CustomerInvitationRow & {
      status: string;
      invited_at: string | null;
      accepted_at: string | null;
    })[]
  >("organization_invitations", {
    query: {
      select:
        "id,organization_id,email,first_name,last_name,auth_user_id,invitation_state,status,invited_at,accepted_at",
      id: `eq.${invitationId}`,
      limit: 1,
    },
  });

  const invitation = inviteResult.ok ? inviteResult.data[0] : null;
  if (!invitation || invitation.email.toLowerCase() !== email.toLowerCase()) {
    return { ok: true };
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
  const organization = organizationResult.ok
    ? organizationResult.data[0]
    : null;
  if (!organization || organization.status === "archived") {
    return { ok: true };
  }

  if (invitation.invitation_state === "activated") {
    return { ok: true, alreadyActivated: true };
  }

  if (await activationRecoveryRateLimited(invitation.id)) {
    return { ok: true };
  }

  await recordInvitationEvent({
    organizationId: invitation.organization_id,
    invitationId: invitation.id,
    eventName: "customer_activation_recovery_requested",
    metadata: { requestType: "customer_self_service" },
  });

  await sendCustomerInvitation(invitation.id, true).catch(() => null);
  return { ok: true };
}

export async function getCustomerActivationInvitationView(
  activationToken: string,
): Promise<ActivationInvitationView> {
  if (!activationToken) return { ok: false, state: "missing" };
  const tokenHash = hashActivationToken(activationToken);
  const tokenResult = await supabaseAdminFetch<ActivationInvitationTokenRow[]>(
    "customer_activation_invitation_tokens",
    {
      query: {
        select:
          "id,invitation_id,organization_id,auth_user_id,email,token_hash,expires_at,consumed_at,revoked_at,superseded_at",
        token_hash: `eq.${tokenHash}`,
        limit: 1,
      },
    },
  );

  const token = tokenResult.ok ? tokenResult.data[0] : null;
  if (!token) return { ok: false, state: "invalid" };
  if (token.consumed_at) {
    return { ok: false, state: "used", invitationId: token.invitation_id };
  }
  if (token.revoked_at) {
    return { ok: false, state: "revoked", invitationId: token.invitation_id };
  }
  if (token.superseded_at) {
    return { ok: false, state: "superseded", invitationId: token.invitation_id };
  }
  if (Date.parse(token.expires_at) <= Date.now()) {
    return { ok: false, state: "expired", invitationId: token.invitation_id };
  }

  const invitationResult = await supabaseAdminFetch<CustomerInvitationRow[]>(
    "organization_invitations",
    {
      query: {
        select: INVITATION_SELECT,
        id: `eq.${token.invitation_id}`,
        limit: 1,
      },
    },
  );
  const invitation = invitationResult.ok ? invitationResult.data[0] : null;
  if (
    !invitation ||
    invitation.organization_id !== token.organization_id ||
    invitation.auth_user_id !== token.auth_user_id ||
    invitation.email.toLowerCase() !== token.email
  ) {
    return { ok: false, state: "invalid", invitationId: token.invitation_id };
  }
  if (invitation.invitation_state === "activated") {
    return { ok: false, state: "activated", invitationId: token.invitation_id };
  }

  const organizationResult = await supabaseAdminFetch<OrganizationRow[]>(
    "organizations",
    {
      query: {
        select: "id,name,status",
        id: `eq.${token.organization_id}`,
        limit: 1,
      },
    },
  );
  const organization = organizationResult.ok
    ? organizationResult.data[0]
    : null;
  if (!organization) {
    return { ok: false, state: "invalid", invitationId: token.invitation_id };
  }
  if (organization.status === "archived") {
    return { ok: false, state: "archived", invitationId: token.invitation_id };
  }

  return {
    ok: true,
    state: "valid",
    tokenHash,
    tokenId: token.id,
    invitationId: token.invitation_id,
    organizationId: token.organization_id,
    authUserId: token.auth_user_id,
    email: token.email,
    businessName: organization.name,
    expiresAt: token.expires_at,
  };
}

export async function sendCustomerActivationVerificationCode(
  activationToken: string,
): Promise<SendActivationCodeResult> {
  const view = await getCustomerActivationInvitationView(activationToken);
  if (!view.ok) {
    return {
      ok: false,
      error: "This invitation is no longer valid.",
      invitationId: view.invitationId,
    };
  }

  const challengeId = randomUUID();
  const code = randomSixDigitCode();
  const codeHash = tryHashActivationCode({
    code,
    challengeId,
    tokenHash: view.tokenHash,
  });
  if (!codeHash) {
    return {
      ok: false,
      error: "A verification code could not be sent right now.",
      invitationId: view.invitationId,
    };
  }
  const expiresAt = new Date(Date.now() + ACTIVATION_CODE_TTL_MS).toISOString();
  const challenge = await supabaseAdminRpc<ActivationChallengeResult[]>(
    "create_customer_activation_email_challenge",
    {
      p_token_hash: view.tokenHash,
      p_challenge_id: challengeId,
      p_code_hash: codeHash,
      p_expires_at: expiresAt,
    },
  );

  const challengeResult = challenge.ok ? challenge.data[0] : null;
  if (!challenge.ok || !challengeResult?.ok) {
    return {
      ok: false,
      error: "A verification code could not be sent right now.",
      invitationId: view.invitationId,
    };
  }

  const sent = await sendActivationCodeEmail({
    email: view.email,
    businessName: view.businessName,
    code,
  });
  if (!sent.ok) {
    await supabaseAdminRpc<boolean>(
      "record_customer_activation_email_challenge_delivery",
      {
        p_challenge_id: challengeId,
        p_delivered: false,
      },
    ).catch(() => null);
    return {
      ok: false,
      error: "A verification code could not be sent right now.",
      invitationId: view.invitationId,
    };
  }

  const delivered = await supabaseAdminRpc<boolean>(
    "record_customer_activation_email_challenge_delivery",
    {
      p_challenge_id: challengeId,
      p_delivered: true,
    },
  );
  if (!delivered.ok || delivered.data !== true) {
    return {
      ok: false,
      error: "A verification code could not be sent right now.",
      invitationId: view.invitationId,
    };
  }

  return { ok: true, challengeId, email: view.email };
}

export async function completeCustomerActivationWithCode({
  activationToken,
  challengeId,
  code,
  password,
}: {
  activationToken: string;
  challengeId: string;
  code: string;
  password: string;
}): Promise<CompleteActivationWithCodeResult> {
  const view = await getCustomerActivationInvitationView(activationToken);
  if (!view.ok) {
    return {
      ok: false,
      error: "This invitation is no longer valid.",
      invitationId: view.invitationId,
    };
  }
  if (!isUuid(challengeId) || !/^[0-9]{6}$/.test(code) || password.length < 8) {
    return {
      ok: false,
      error: "Enter the verification code and a password with at least 8 characters.",
      invitationId: view.invitationId,
    };
  }

  const codeHash = tryHashActivationCode({
    code,
    challengeId,
    tokenHash: view.tokenHash,
  });
  if (!codeHash) {
    return {
      ok: false,
      error: "The verification code could not be verified.",
      invitationId: view.invitationId,
    };
  }
  const operationId = randomUUID();
  const reserved = await supabaseAdminRpc<ActivationReservationResult[]>(
    "reserve_customer_activation_password_setup",
    {
      p_token_hash: view.tokenHash,
      p_challenge_id: challengeId,
      p_code_hash: codeHash,
      p_operation_id: operationId,
    },
  );
  const reservation = reserved.ok ? reserved.data[0] : null;
  if (!reserved.ok || !reservation?.ok || !reservation.operation_id) {
    return {
      ok: false,
      error: "The verification code could not be verified.",
      invitationId: view.invitationId,
    };
  }

  if (!reservation.password_already_set) {
    const passwordUpdate = await setActivationUserPassword({
      userId: view.authUserId,
      password,
      operationId: reservation.operation_id,
    });
    if (!passwordUpdate.ok) {
      await supabaseAdminRpc<boolean>(
        "record_customer_activation_password_setup_result",
        {
          p_token_hash: view.tokenHash,
          p_challenge_id: challengeId,
          p_operation_id: reservation.operation_id,
          p_result: passwordUpdate.unknown ? "unknown" : "failed",
        },
      ).catch(() => null);
      return {
        ok: false,
        error: "Your password could not be saved. Request a fresh activation link.",
        invitationId: view.invitationId,
      };
    }

    const recorded = await supabaseAdminRpc<boolean>(
      "record_customer_activation_password_setup_result",
      {
        p_token_hash: view.tokenHash,
        p_challenge_id: challengeId,
        p_operation_id: reservation.operation_id,
        p_result: "succeeded",
      },
    );
    if (!recorded.ok || recorded.data !== true) {
      return {
        ok: false,
        error:
          "Your password was saved, but activation needs support reconciliation.",
        invitationId: view.invitationId,
      };
    }
  }

  const activated = await supabaseAdminRpc<boolean>(
    "finalize_customer_activation_with_reservation",
    {
      p_token_hash: view.tokenHash,
      p_challenge_id: challengeId,
      p_operation_id: reservation.operation_id,
      p_user_id: view.authUserId,
      p_email: view.email,
    },
  );
  if (!activated.ok || activated.data !== true) {
    await supabaseAdminRpc<boolean>(
      "record_customer_activation_password_setup_result",
      {
        p_token_hash: view.tokenHash,
        p_challenge_id: challengeId,
        p_operation_id: reservation.operation_id,
        p_result: "succeeded",
      },
    ).catch(() => null);
    return {
      ok: false,
      error:
        "Your password was saved, but account activation could not be completed. Contact Opzix support.",
      invitationId: view.invitationId,
    };
  }

  return { ok: true, email: view.email };
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
  const fromAddress = opzixAuthFromAddress();
  const from = opzixAuthSenderIdentity();
  if (!apiKey || !fromAddress) {
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

async function sendApplicationActivationInvitation({
  invitation,
  businessName,
  redirectTo,
}: {
  invitation: CustomerInvitationRow;
  businessName: string;
  redirectTo: string;
}) {
  const authUser = invitation.auth_user_id
    ? { ok: true as const, userId: invitation.auth_user_id }
    : await createActivationAuthUser({
        invitation,
        businessName,
      });
  if (!authUser.ok) return authUser;

  const linked = await supabaseAdminRpc<string>("link_customer_invitation", {
    p_invitation_id: invitation.id,
    p_user_id: authUser.userId,
    p_delivery: "resend",
  });
  if (!linked.ok || !["invited", "activated"].includes(linked.data)) {
    return {
      ok: false as const,
      code: `customer_link_http_${linked.ok ? 200 : linked.status}`,
      error:
        "The activation invitation could not be linked to the customer account.",
      userId: authUser.userId,
    };
  }

  const token = await createActivationInvitationToken({
    invitation,
    authUserId: authUser.userId,
  });
  if (!token.ok) {
    return {
      ...token,
      userId: authUser.userId,
    };
  }

  const sent = await sendActivationInvitationEmail({
    email: invitation.email,
    firstName: invitation.first_name ?? "",
    businessName,
    activationToken: token.token,
    redirectTo,
  });
  if (!sent.ok) {
    return {
      ...sent,
      userId: authUser.userId,
    };
  }

  return { ok: true as const };
}

async function createActivationAuthUser({
  invitation,
  businessName,
}: {
  invitation: CustomerInvitationRow;
  businessName: string;
}) {
  const config = getSupabaseAdminConfig();
  if (!config) {
    return {
      ok: false as const,
      code: "supabase_admin_not_configured",
      error: "Supabase server-side Auth credentials are not configured.",
    };
  }

  const response = await fetch(`${config.url}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminAuthHeaders(config.serviceRoleKey),
    body: JSON.stringify({
      email: invitation.email,
      user_metadata: {
        organization_id: invitation.organization_id,
        organization_invitation_id: invitation.id,
        business_name: businessName,
        first_name: invitation.first_name ?? "",
        last_name: invitation.last_name ?? "",
      },
    }),
  }).catch(() => null);
  if (!response) {
    return {
      ok: false as const,
      code: "supabase_auth_transport_error",
      error: "Supabase Auth could not be reached.",
    };
  }

  const payload = (await response.json().catch(() => ({}))) as AuthAdminUserResponse;
  const userId = payload.user?.id ?? payload.id;
  if (!response.ok || !userId) {
    return {
      ok: false as const,
      code: `supabase_auth_create_user_http_${response.status}`,
      error: `Supabase Auth could not create the customer account (HTTP ${response.status}).`,
    };
  }

  return { ok: true as const, userId };
}

async function createActivationInvitationToken({
  invitation,
  authUserId,
}: {
  invitation: CustomerInvitationRow;
  authUserId: string;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ACTIVATION_INVITATION_TTL_MS);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashActivationToken(token);
  const supersede = await supabaseAdminFetch<null>(
    "customer_activation_invitation_tokens",
    {
      method: "PATCH",
      query: {
        invitation_id: `eq.${invitation.id}`,
        consumed_at: "is.null",
        revoked_at: "is.null",
        superseded_at: "is.null",
      },
      body: {
        superseded_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      prefer: "return=minimal",
    },
  );
  if (!supersede.ok && supersede.status !== 404) {
    return {
      ok: false as const,
      code: "activation_token_supersede_failed",
      error: "Existing activation links could not be superseded.",
    };
  }

  const created = await supabaseAdminFetch<null>(
    "customer_activation_invitation_tokens",
    {
      method: "POST",
      body: {
        invitation_id: invitation.id,
        organization_id: invitation.organization_id,
        auth_user_id: authUserId,
        email: invitation.email.toLowerCase(),
        token_hash: tokenHash,
        issued_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      prefer: "return=minimal",
    },
  );
  if (!created.ok) {
    return {
      ok: false as const,
      code: `activation_token_create_http_${created.status}`,
      error: "A 24-hour activation link could not be created.",
    };
  }

  return { ok: true as const, token };
}

async function sendActivationInvitationEmail({
  email,
  firstName,
  businessName,
  activationToken,
  redirectTo,
}: {
  email: string;
  firstName: string;
  businessName: string;
  activationToken: string;
  redirectTo: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = opzixAuthFromAddress();
  const from = opzixAuthSenderIdentity();
  if (!apiKey || !fromAddress) {
    return {
      ok: false as const,
      code: "resend_not_configured",
      error:
        "Activation invitation email needs RESEND_API_KEY and OPZIX_AUTH_FROM_EMAIL configured.",
    };
  }

  const link = new URL(redirectTo);
  link.hash = `activation_token=${encodeURIComponent(activationToken)}`;
  const name = escapeHtml(firstName || "there");
  const business = escapeHtml(businessName);
  const url = link.toString();
  const text = [
    `Welcome to Opzix, ${firstName || "there"}.`,
    `Your Opzix onboarding invitation for ${businessName} is valid for 24 hours.`,
    "When you're ready, open the link and verify your email to create your password.",
    url,
    "If you were not expecting this invitation, you can ignore this email.",
  ].join("\n\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#132238;line-height:1.6"><p>Welcome to Opzix, ${name}.</p><p>Your Opzix onboarding invitation for <strong>${business}</strong> is valid for 24 hours.</p><p>When you're ready, open the link and verify your email to create your password.</p><p><a href="${escapeHtml(url)}" style="display:inline-block;background:#13b8d4;color:#06202a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Open Invitation</a></p><p>If you were not expecting this invitation, you can ignore this email.</p></div>`;

  return sendResendEmail({
    apiKey,
    from,
    to: email,
    subject: "Your Opzix onboarding invitation",
    text,
    html,
    code: "activation_invitation",
  });
}

async function sendActivationCodeEmail({
  email,
  businessName,
  code,
}: {
  email: string;
  businessName: string;
  code: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = opzixAuthFromAddress();
  const from = opzixAuthSenderIdentity();
  if (!apiKey || !fromAddress) {
    return { ok: false as const };
  }

  const business = escapeHtml(businessName);
  const safeCode = escapeHtml(code);
  const text = [
    `Your Opzix verification code for ${businessName} is ${code}.`,
    "This code expires in 10 minutes.",
    "If you did not request this code, you can ignore this email.",
  ].join("\n\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#132238;line-height:1.6"><p>Your Opzix verification code for <strong>${business}</strong> is:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${safeCode}</p><p>This code expires in 10 minutes.</p><p>If you did not request this code, you can ignore this email.</p></div>`;

  return sendResendEmail({
    apiKey,
    from,
    to: email,
    subject: "Your Opzix verification code",
    text,
    html,
    code: "activation_code",
  });
}

async function sendResendEmail({
  apiKey,
  from,
  to,
  subject,
  text,
  html,
  code,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  code: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
    }),
  }).catch(() => null);

  if (!response) return { ok: false as const, code: `${code}_transport_error` };
  if (!response.ok) {
    return {
      ok: false as const,
      code: `${code}_http_${response.status}`,
    };
  }
  return { ok: true as const };
}

async function setActivationUserPassword({
  userId,
  password,
  operationId,
}: {
  userId: string;
  password: string;
  operationId: string;
}) {
  const config = getSupabaseAdminConfig();
  if (!config) return { ok: false as const, unknown: false };
  const userResponse = await fetch(
    `${config.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    { headers: adminAuthHeaders(config.serviceRoleKey) },
  ).catch(() => null);
  if (!userResponse?.ok) return { ok: false as const, unknown: false };
  const user = (await userResponse.json().catch(() => ({}))) as AuthAdminUserResponse;
  const appMetadata = isRecord(user.app_metadata) ? user.app_metadata : {};
  const response = await fetch(
    `${config.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: adminAuthHeaders(config.serviceRoleKey),
      body: JSON.stringify({
        password,
        email_confirm: true,
        app_metadata: {
          ...appMetadata,
          opzix_activation_password_operation_id: operationId,
        },
      }),
    },
  ).catch(() => null);
  if (!response) return { ok: false as const, unknown: true };
  return { ok: response.ok, unknown: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
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

function hashActivationToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hashActivationCode({
  code,
  challengeId,
  tokenHash,
}: {
  code: string;
  challengeId: string;
  tokenHash: string;
}) {
  return createHmac("sha256", activationHashSecret())
    .update(`${challengeId}.${tokenHash}.${code}`)
    .digest("hex");
}

function tryHashActivationCode(input: {
  code: string;
  challengeId: string;
  tokenHash: string;
}) {
  try {
    return hashActivationCode(input);
  } catch {
    return "";
  }
}

function activationHashSecret() {
  const secret = process.env.OPZIX_ACTIVATION_CODE_SECRET?.trim();
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  if (!secret && isProduction) {
    throw new Error("OPZIX_ACTIVATION_CODE_SECRET is required.");
  }
  return secret || "opzix-activation-code-secret-dev";
}

function randomSixDigitCode() {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

async function activationRecoveryRateLimited(invitationId: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const result = await supabaseAdminFetch<{ id: string }[]>(
    "customer_account_audit_events",
    {
      query: {
        select: "id",
        target_type: "eq.organization_invitation",
        target_id: `eq.${invitationId}`,
        event_name: "eq.customer_activation_recovery_requested",
        created_at: `gte.${since}`,
        limit: 3,
      },
    },
  );
  return result.ok && result.data.length >= 3;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
