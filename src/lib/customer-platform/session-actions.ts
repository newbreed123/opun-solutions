"use server";

import { redirect } from "next/navigation";
import {
  clearCustomerSession,
  requestPasswordReset,
  signInWithPassword,
  verifyInviteToken,
} from "./auth";

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

export async function acceptInviteAction(formData: FormData) {
  const tokenHash = stringField(formData, "token_hash");
  const password = stringField(formData, "password");
  const invitationId = stringField(formData, "invitation_id");
  const requestedType = stringField(formData, "verification_type");
  const verificationType =
    requestedType === "magiclink" ? "magiclink" : "invite";

  if (!tokenHash || password.length < 8 || !isUuid(invitationId)) {
    redirect("/accept-invite?error=missing-fields");
  }

  const result = await verifyInviteToken({
    tokenHash,
    password,
    invitationId,
    verificationType,
  });
  if (!result.ok) {
    redirect(`/accept-invite?error=${encodeURIComponent(result.error)}`);
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
