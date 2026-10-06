"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "opzix_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value === "authenticated";
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

  if (submittedPasscode !== configured) {
    return {
      ok: false as const,
      error: "Invalid internal passcode.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

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
