"use server";

import { redirect } from "next/navigation";
import {
  clearCustomerSession,
  requestPasswordReset,
  resetRecoveredPassword,
  signInWithPassword,
  verifyInviteToken,
} from "./auth";
import {
  completeCustomerActivationWithCode,
  requestCustomerActivationRecovery,
  sendCustomerActivationVerificationCode,
} from "./admin-invitations";

export type PasswordRecoveryState = {
  error?: string;
};

export type ActivationCodeState = {
  error?: string;
  sent?: boolean;
  challengeId?: string;
  invitedEmail?: string;
  invitationId?: string;
};

export type ActivationCompletionState = {
  error?: string;
  invitationId?: string;
};

export async function loginAction(formData: FormData) {
  const email = stringField(formData, "email");
  const password = stringField(formData, "password");

  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }

  const result = await signInWithPassword(email, password);
  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/app/onboarding");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = stringField(formData, "email");
  if (!email) redirect("/forgot-password?error=missing-email");

  const result = await requestPasswordReset(email);
  if (!result.ok) {
    redirect(`/forgot-password?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/forgot-password?sent=1");
}

export async function resetRecoveredPasswordAction(
  _state: PasswordRecoveryState,
  formData: FormData,
): Promise<PasswordRecoveryState> {
  const accessToken = stringField(formData, "access_token");
  const password = stringField(formData, "password");
  const confirmPassword = stringField(formData, "confirm_password");

  if (!accessToken || password.length < 8 || password !== confirmPassword) {
    return {
      error:
        password !== confirmPassword
          ? "Passwords must match."
          : "Enter a password with at least 8 characters.",
    };
  }

  const result = await resetRecoveredPassword({ accessToken, password });
  if (!result.ok) return { error: result.error };

  redirect(
    `/login?message=${encodeURIComponent(
      "Password updated. Sign in with your new password.",
    )}`,
  );
}

export async function acceptInviteAction(formData: FormData) {
  const tokenHash = stringField(formData, "token_hash");
  const password = stringField(formData, "password");
  const invitationId = stringField(formData, "invitation_id");
  const requestedType = stringField(formData, "verification_type");
  const verificationType =
    requestedType === "invite" || requestedType === "magiclink"
      ? requestedType
      : null;

  if (
    !tokenHash ||
    password.length < 8 ||
    !isUuid(invitationId) ||
    !verificationType
  ) {
    redirect(acceptInviteErrorUrl("missing", invitationId));
  }

  const result = await verifyInviteToken({
    tokenHash,
    password,
    invitationId,
    verificationType,
  });
  if (!result.ok) {
    redirect(acceptInviteErrorUrl("invalid", invitationId));
  }

  redirect("/app/onboarding");
}

export async function requestActivationLinkAction(formData: FormData) {
  const invitationId = stringField(formData, "invitation_id");
  const email = stringField(formData, "email").toLowerCase();

  if (isUuid(invitationId) && email) {
    await requestCustomerActivationRecovery({ invitationId, email });
  }

  const params = new URLSearchParams({ recovery_requested: "1" });
  if (isUuid(invitationId)) params.set("invitation_id", invitationId);
  redirect(`/accept-invite?${params.toString()}`);
}

export async function sendActivationCodeAction(
  _state: ActivationCodeState,
  formData: FormData,
): Promise<ActivationCodeState> {
  const activationToken = stringField(formData, "activation_token");
  const result = await sendCustomerActivationVerificationCode(activationToken);

  if (result.ok) {
    return {
      sent: true,
      challengeId: result.challengeId,
      invitedEmail: result.email,
    };
  }

  return {
    error:
      "A verification code could not be sent. Request a fresh link if this invitation has expired.",
    invitationId: result.invitationId,
  };
}

export async function completeActivationWithCodeAction(
  _state: ActivationCompletionState,
  formData: FormData,
): Promise<ActivationCompletionState> {
  const activationToken = stringField(formData, "activation_token");
  const challengeId = stringField(formData, "challenge_id");
  const code = stringField(formData, "verification_code").replace(/\s+/g, "");
  const password = stringField(formData, "password");
  const confirmPassword = stringField(formData, "confirm_password");

  if (password !== confirmPassword) {
    return { error: "Passwords must match." };
  }

  const result = await completeCustomerActivationWithCode({
    activationToken,
    challengeId,
    code,
    password,
  });
  if (!result.ok) {
    return {
      error:
        "Activation could not be completed. Request a fresh link or contact Opzix support.",
      invitationId: result.invitationId,
    };
  }

  const signedIn = await signInWithPassword(result.email, password);
  if (!signedIn.ok) {
    redirect(
      `/login?message=${encodeURIComponent(
        "Account activated. Sign in with your new password.",
      )}`,
    );
  }

  redirect("/app/onboarding");
}

export async function logoutAction() {
  await clearCustomerSession();
  redirect("/login");
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function acceptInviteErrorUrl(reason: "missing" | "invalid", invitationId: string) {
  const params = new URLSearchParams({
    activation_error: reason,
  });
  if (isUuid(invitationId)) params.set("invitation_id", invitationId);
  return `/accept-invite?${params.toString()}`;
}
