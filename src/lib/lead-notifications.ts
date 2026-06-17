import { NormalizedLead } from "@/lib/leads";

export const CONTACT_EMAIL = "hello@opzix.io";

type LeadNotificationResult =
  | {
      ok: true;
      provider: "resend" | "test-mode";
      messageId?: string;
      recipient: string;
      testMode: boolean;
    }
  | {
      ok: false;
      provider: "resend" | "not-configured";
      error: string;
      status?: number;
    };

type ResendResponse = {
  id?: string;
  message?: string;
  error?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function leadRows(lead: NormalizedLead) {
  return [
    ["Lead type", lead.leadType],
    ["Source", lead.sourcePage],
    ["Name", lead.name],
    ["Email", lead.email],
    ["Business type", lead.businessType],
    ["Service needed", lead.serviceNeeded],
    ["Website", lead.website],
    ["Message", lead.message],
    ["Scan ID", lead.scanId],
    ["Scanned URL", lead.scannedUrl],
    ["Audit score", lead.auditScore],
    ["Audit status", lead.auditStatus],
    ["Primary concern", lead.primaryConcern],
    ["Submitted at", lead.createdAt],
  ].filter(([, value]) => value);
}

function buildLeadEmail(lead: NormalizedLead) {
  const subject =
    lead.leadType === "ecommerce-audit"
      ? `Opzix Audit lead: ${lead.website || lead.scannedUrl || lead.email}`
      : `Opzix contact lead: ${lead.serviceNeeded || lead.email}`;
  const rows = leadRows(lead);
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:8px;border-bottom:1px solid #d9e2ef;">${escapeHtml(
          label,
        )}</th><td style="padding:8px;border-bottom:1px solid #d9e2ef;">${escapeHtml(
          value,
        )}</td></tr>`,
    )
    .join("");

  return {
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;color:#0f172a;"><h1>New Opzix lead</h1><table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:720px;">${htmlRows}</table></div>`,
  };
}

export async function sendLeadNotification(
  lead: NormalizedLead,
): Promise<LeadNotificationResult> {
  const recipient = CONTACT_EMAIL;
  const testMode = process.env.CONTACT_EMAIL_TEST_MODE === "true";

  const email = buildLeadEmail(lead);

  if (testMode) {
    console.info("Lead notification test mode email:", {
      to: recipient,
      subject: email.subject,
      text: email.text,
    });

    return {
      ok: true,
      provider: "test-mode",
      recipient,
      testMode: true,
    };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return {
      ok: false,
      provider: "not-configured",
      error: "RESEND_API_KEY is not configured.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.CONTACT_FROM_EMAIL?.trim() ||
        "Opzix Audit <onboarding@resend.dev>",
      to: [recipient],
      reply_to: lead.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as ResendResponse;

  if (!response.ok) {
    return {
      ok: false,
      provider: "resend",
      status: response.status,
      error:
        payload.message ||
        payload.error ||
        "Resend rejected the lead notification request.",
    };
  }

  return {
    ok: true,
    provider: "resend",
    messageId: payload.id,
    recipient,
    testMode: false,
  };
}

export function logSuccessfulLeadSubmission(lead: NormalizedLead) {
  console.info("Lead submission delivered:", {
    source: lead.sourcePage,
    scanId: lead.scanId,
    scannedUrl: lead.scannedUrl,
    score: lead.auditScore,
    primaryConcern: lead.primaryConcern,
  });
}
