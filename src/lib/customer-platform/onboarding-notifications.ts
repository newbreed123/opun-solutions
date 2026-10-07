import { supabaseAdminFetch } from "@/lib/supabase-admin";
import { opzixAuthFromAddress, opzixAuthSenderIdentity } from "./email-sender";

type NotificationResult =
  | { ok: true; provider: "resend"; recipient: string; messageId?: string }
  | { ok: false; provider: "resend" | "not-configured"; recipient: string; error: string; status?: number };

type ResendResponse = {
  id?: string;
  message?: string;
  error?: string;
};

export async function sendOnboardingSubmittedNotification({
  organizationId,
  organizationName,
  customerName,
}: {
  organizationId: string;
  organizationName: string;
  customerName: string;
}): Promise<NotificationResult> {
  const recipient = process.env.OPZIX_INTERNAL_NOTIFICATION_EMAIL?.trim() || "";
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const fromAddress = opzixAuthFromAddress();
  const from = opzixAuthSenderIdentity();

  if (!recipient || !apiKey || !fromAddress) {
    return {
      ok: false,
      provider: "not-configured",
      recipient,
      error:
        "Set OPZIX_INTERNAL_NOTIFICATION_EMAIL, RESEND_API_KEY, and OPZIX_AUTH_FROM_EMAIL for onboarding notifications.",
    };
  }

  const reviewUrl = adminReviewUrl(organizationId);
  const subject = `${organizationName} completed onboarding`;
  const text = [
    `${customerName} has submitted onboarding for ${organizationName}.`,
    "The customer is ready for Opzix review.",
    reviewUrl,
  ].join("\n\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#132238;line-height:1.6"><p>${escapeHtml(
    customerName,
  )} has submitted onboarding for <strong>${escapeHtml(
    organizationName,
  )}</strong>.</p><p>The customer is ready for Opzix review.</p><p><a href="${escapeHtml(
    reviewUrl,
  )}" style="display:inline-block;background:#13b8d4;color:#06202a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Review Customer</a></p></div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      text,
      html,
    }),
  }).catch(() => null);

  if (!response) {
    return {
      ok: false,
      provider: "resend",
      recipient,
      error: "Resend could not be reached.",
    };
  }

  const payload = (await response.json().catch(() => ({}))) as ResendResponse;
  if (!response.ok) {
    return {
      ok: false,
      provider: "resend",
      recipient,
      status: response.status,
      error:
        payload.message ||
        payload.error ||
        "Resend rejected the onboarding notification.",
    };
  }

  return {
    ok: true,
    provider: "resend",
    recipient,
    messageId: payload.id,
  };
}

export async function recordOnboardingNotificationResult({
  organizationId,
  result,
}: {
  organizationId: string;
  result: NotificationResult;
}) {
  await supabaseAdminFetch<null>("customer_account_audit_events", {
    method: "POST",
    body: {
      organization_id: organizationId,
      event_name: result.ok
        ? "customer_onboarding_notification_sent"
        : "customer_onboarding_notification_failed",
      target_type: "organization_onboarding",
      metadata: {
        provider: result.provider,
        recipientConfigured: Boolean(result.recipient),
        status: "status" in result ? result.status ?? null : null,
        error: result.ok ? null : result.error,
      },
    },
    prefer: "returning=minimal",
  });
}

function adminReviewUrl(organizationId: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://opzix.io";
  return `${base.replace(/\/$/, "")}/opzix-admin/customers/${organizationId}/onboarding`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
