"use server";

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "opzix_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!passcode || !value) return false;

  const [issuedAtText, nonce, signature, extra] = value.split(".");
  const issuedAt = Number(issuedAtText);
  const now = Math.floor(Date.now() / 1000);
  if (
    extra !== undefined ||
    !Number.isInteger(issuedAt) ||
    !nonce ||
    !signature ||
    issuedAt > now + 60 ||
    now - issuedAt > ADMIN_SESSION_MAX_AGE
  ) {
    return false;
  }

  const expected = sessionSignature(passcode, issuedAtText, nonce);
  const actualBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expected, "base64url");
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function getAdminPasscode() {
  return process.env.OPZIX_ADMIN_PASSCODE?.trim() ?? "";
}

export async function submitAdminPasscode(
  previousState: { ok: boolean; error: string } | undefined,
  formData: FormData,
) {
  const configured = await getAdminPasscode();
  const submittedPasscode = stringField(formData, "passcode");

  if (!configured) {
    return {
      ok: false as const,
      error: "Set OPZIX_ADMIN_PASSCODE before viewing internal admin pages.",
    };
  }

  if (!submittedPasscode) {
    return {
      ok: false as const,
      error: "Enter the internal passcode to continue.",
    };
  }

  const submittedHash = createHash("sha256").update(submittedPasscode).digest();
  const configuredHash = createHash("sha256").update(configured).digest();
  if (!timingSafeEqual(submittedHash, configuredHash)) {
    return {
      ok: false as const,
      error: "Invalid internal passcode.",
    };
  }

  const cookieStore = await cookies();
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(18).toString("base64url");
  const signature = sessionSignature(configured, issuedAt, nonce);
  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    `${issuedAt}.${nonce}.${signature}`,
    {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
    },
  );

  redirect("/opzix-admin/customers");
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/opzix-admin/customers");
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function sessionSignature(passcode: string, issuedAt: string, nonce: string) {
  return createHmac("sha256", passcode)
    .update(`${issuedAt}.${nonce}`)
    .digest("base64url");
}
