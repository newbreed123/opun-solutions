import {
  appointmentDisplayParts,
  cleanLabel,
  formatBusinessTypeLabel,
  formatPhoneForDisplay,
  formatSourceLabel,
} from "./display";
import type { AppointmentRecord } from "./types";

type EmailResult =
  | { ok: true; skipped: boolean; id?: string }
  | { ok: false; skipped: false; error: string };

type EmailPayload = {
  to: string | string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
};

export type AppointmentEmailTemplateProps = {
  title: string;
  intro: string;
  clientName: string;
  clientEmail: string;
  googleMeetUrl: string | null;
  appointmentDate: string;
  appointmentTime: string;
  timezone: string;
  rescheduleUrl: string;
  cancelUrl: string;
  preparationItems: string[];
};

const DEFAULT_FROM = "Opzix <onboarding@resend.dev>";
const OPZIX_CONTACT_EMAIL = "hello@opzix.io";
const MEET_PENDING_MESSAGE =
  "Your appointment is confirmed. Your meeting link is being prepared and will be emailed separately.";

export async function sendBookingConfirmation(appointment: AppointmentRecord) {
  return sendEmail({
    to: appointment.email,
    subject: "Your Opzix Strategy Session Is Confirmed",
    ...prospectEmail(
      appointment,
      "Your Opzix Strategy Session Is Confirmed",
      "Your strategy session is confirmed. Based on the information you shared, we'll be prepared to discuss your current website, systems, customer journey, and next practical step.",
    ),
  });
}

export async function sendFounderNotification(appointment: AppointmentRecord) {
  const appointmentLabel = appointmentDisplayParts(
    appointment.start_at,
    appointment.timezone,
    appointment.end_at,
  );
  const meetUrl = appointment.google_meet_url || appointment.meeting_url || "";
  const dashboardUrl = internalDashboardUrl();
  const dashboardLabel = "View All Appointments";
  const auditUrl = appointment.scan_id ? internalAuditUrl(appointment.scan_id) : "";
  const formattedPhone = formatPhoneForDisplay(appointment.phone);
  const missingBusinessFields = missingBusinessInformation(appointment);
  const calendarStatus = calendarStatusLabel(appointment);
  const calendarWarning = meetUrl
    ? ""
    : calendarStatus.needsAttention
      ? calendarStatus.message
      : "";
  const contactRows = [
    ["Client name", appointment.name],
    ["Email address", appointment.email],
    ["Phone number", formattedPhone || "Missing"],
  ];
  const appointmentRows = [
    ["Date", appointmentLabel.date],
    ["Time", appointmentLabel.timeRange],
    ["Timezone", appointmentLabel.timezone],
    ["Google Meet", meetUrl ? "Ready" : calendarStatus.meetLabel],
  ];
  const systemRows = [
    ["Appointment ID", appointment.id],
    ["Status", cleanLabel(appointment.status)],
    ["Calendar sync status", calendarStatus.systemLabel],
    ["Reschedule/cancel status", appointment.cancelled_at ? "Cancelled" : "Active"],
  ];
  const businessRows = [
    ...optionalRow("Business name", appointment.business_name),
    ...optionalRow("Website domain", appointment.website_domain),
    ...optionalRow("Business type", formatBusinessTypeLabel(appointment.business_type)),
    ...optionalRow("Main challenge", appointment.challenge),
    ...optionalRow(
      "Service requested",
      appointment.service_requested ? cleanLabel(appointment.service_requested) : "",
    ),
    ["Source", formatSourceLabel(appointment.source)],
    ...optionalRow("Audit context", appointment.scan_id ? `Scan ID ${appointment.scan_id}` : ""),
  ] satisfies string[][];
  const textRows = [...contactRows, ...appointmentRows, ...businessRows, ...systemRows];

  return sendEmail({
    to: process.env.CONTACT_NOTIFICATION_EMAIL?.trim() || OPZIX_CONTACT_EMAIL,
    replyTo: appointment.email,
    subject: "New Opzix Strategy Session Booked",
    text: [
      `${appointmentLabel.date}`,
      `${appointmentLabel.timeRange} ${appointmentLabel.timezone}`,
      "",
      ...textRows.map(([label, value]) => `${label}: ${value}`),
      missingBusinessFields.length > 0
        ? `Missing before the call: ${missingBusinessFields.join(", ")}`
        : "",
      meetUrl ? `Join Google Meet: ${meetUrl}` : calendarWarning,
      `${dashboardLabel}: ${dashboardUrl}`,
      "Quick Actions:",
      `Open Lead: ${dashboardUrl}`,
      `Open CRM: ${dashboardUrl}`,
      auditUrl ? `View Audit: ${auditUrl}` : "",
      `Send Proposal: ${quickActionMailto("Send proposal", appointment)}`,
      `Mark as Won: ${quickActionMailto("Mark as won", appointment)}`,
      `Mark as Lost: ${quickActionMailto("Mark as lost", appointment)}`,
    ].filter(Boolean).join("\n"),
    html: emailFrame(
      "New Opzix Strategy Session Booked",
      `
      ${calendarWarning ? alertBox(calendarWarning) : ""}
      ${appointmentHero(appointmentLabel.date, appointmentLabel.timeRange, appointmentLabel.timezone)}
      ${meetUrl ? button(meetUrl, "Join Google Meet", "primary") : ""}
      ${meetUrl ? secondaryLink(meetUrl, meetUrl) : ""}
      ${button(dashboardUrl, dashboardLabel, "secondary")}
      <h2 style="font-size:18px;margin-top:24px;">Contact information</h2>
      ${tableRows(contactRows, {
        "Email address": mailto(appointment.email),
        "Phone number": tel(appointment.phone || "", formattedPhone),
      })}
      <h2 style="font-size:18px;margin-top:24px;">Appointment information</h2>
      ${tableRows(appointmentRows)}
      <h2 style="font-size:18px;margin-top:24px;">Business information</h2>
      ${tableRows(businessRows)}
      ${missingBusinessFields.length > 0 ? missingInformationBox(missingBusinessFields) : ""}
      <h2 style="font-size:16px;margin-top:24px;color:#475569;">System details</h2>
      ${tableRows(systemRows)}
      <h2 style="font-size:18px;margin-top:24px;">Quick Actions</h2>
      ${quickActions(appointment, dashboardUrl, auditUrl)}
      `,
    ),
  });
}

export async function sendReminder24h(appointment: AppointmentRecord) {
  return sendEmail({
    to: appointment.email,
    subject: "Your Opzix Strategy Session Is Tomorrow",
    ...prospectEmail(
      appointment,
      "Your Opzix Strategy Session Is Tomorrow",
      "Your Opzix strategy session is tomorrow. Bring any useful website, audit, or system context so we can make the conversation practical.",
    ),
  });
}

export async function sendReminder1h(appointment: AppointmentRecord) {
  return sendEmail({
    to: appointment.email,
    subject: "Your Opzix Strategy Session Starts in 1 Hour",
    ...prospectEmail(
      appointment,
      "Your Opzix Strategy Session Starts in 1 Hour",
      "Your Opzix strategy session starts in one hour. We'll focus on the challenge and context you shared.",
    ),
  });
}

export async function sendMeetLinkAvailableEmail(appointment: AppointmentRecord) {
  const meetUrl = appointment.google_meet_url || appointment.meeting_url || "";
  if (!meetUrl) {
    return {
      ok: false as const,
      skipped: false as const,
      error: "Appointment does not have a Google Meet URL.",
    };
  }

  const parts = appointmentDisplayParts(
    appointment.start_at,
    appointment.timezone,
    appointment.end_at,
  );
  const rescheduleLink = mailtoHref(
    "Reschedule Opzix Strategy Session",
    `Hi Opzix,\n\nI need to reschedule appointment ${appointment.id}.`,
  );
  const cancelLink = mailtoHref(
    "Cancel Opzix Strategy Session",
    `Hi Opzix,\n\nI need to cancel appointment ${appointment.id}.`,
  );

  return sendEmail({
    to: appointment.email,
    subject: "Your Google Meet Link for Your Opzix Strategy Session",
    text: [
      `Hi ${appointment.name},`,
      "Your Google Meet link for your Opzix strategy session is ready.",
      "",
      "Your meeting",
      parts.date,
      `${parts.timeRange} ${parts.timezone}`,
      `Join Google Meet: ${meetUrl}`,
      `Reschedule: ${rescheduleLink}`,
      `Cancel: ${cancelLink}`,
      `Questions: reply to this email or contact ${OPZIX_CONTACT_EMAIL}.`,
    ].join("\n\n"),
    html: emailFrame(
      "Your Google Meet Link Is Ready",
      `
      <p>Hi ${escapeHtml(appointment.name)},</p>
      <p>Your Google Meet link for your Opzix strategy session is ready.</p>
      <h2 style="font-size:18px;margin-top:24px;">Your meeting</h2>
      ${appointmentHero(parts.date, parts.timeRange, parts.timezone)}
      ${button(meetUrl, "Join Google Meet", "primary")}
      ${secondaryLink(meetUrl, meetUrl)}
      <p>
        <a href="${escapeHtml(rescheduleLink)}">Reschedule</a>
        &nbsp;|&nbsp;
        <a href="${escapeHtml(cancelLink)}">Cancel</a>
      </p>
      <p>Questions? Reply to this email or contact ${mailto(OPZIX_CONTACT_EMAIL)}.</p>
      `,
    ),
  });
}

async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (process.env.CONTACT_EMAIL_TEST_MODE === "true") {
    console.info("Scheduling email test mode:", {
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });
    return { ok: true, skipped: true };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: true, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      reply_to: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      error: body.message || body.error || "Resend rejected the email.",
    };
  }

  return { ok: true, skipped: false, id: body.id };
}

function prospectEmail(appointment: AppointmentRecord, title: string, intro: string) {
  return renderProspectEmail(
    appointmentEmailTemplateProps(appointment, title, intro),
  );
}

export function appointmentEmailTemplateProps(
  appointment: AppointmentRecord,
  title: string,
  intro: string,
): AppointmentEmailTemplateProps {
  const parts = appointmentDisplayParts(
    appointment.start_at,
    appointment.timezone,
    appointment.end_at,
  );
  const meetUrl = appointment.google_meet_url || appointment.meeting_url || "";
  const rescheduleLink = mailtoHref(
    "Reschedule Opzix Strategy Session",
    `Hi Opzix,\n\nI need to reschedule appointment ${appointment.id}.`,
  );
  const cancelLink = mailtoHref(
    "Cancel Opzix Strategy Session",
    `Hi Opzix,\n\nI need to cancel appointment ${appointment.id}.`,
  );

  return {
    title,
    intro,
    clientName: clientNameForEmail(appointment.name),
    clientEmail: appointment.email,
    googleMeetUrl: meetUrl || null,
    appointmentDate: parts.date,
    appointmentTime: parts.timeRange,
    timezone: parts.timezone,
    rescheduleUrl: rescheduleLink,
    cancelUrl: cancelLink,
    preparationItems: preparationChecklist(appointment),
  };
}

export function renderProspectEmail(props: AppointmentEmailTemplateProps) {
  const meetingLine = props.googleMeetUrl
    ? `Google Meet: ${props.googleMeetUrl}`
    : MEET_PENDING_MESSAGE;

  return {
    text: [
      `Hi ${props.clientName},`,
      props.intro,
      "",
      "Your meeting",
      props.appointmentDate,
      `${props.appointmentTime} ${props.timezone}`,
      meetingLine,
      props.googleMeetUrl ? `Join Google Meet: ${props.googleMeetUrl}` : "",
      "Before the call:",
      ...props.preparationItems.map((item) => `- ${item}`),
      `Reschedule: ${props.rescheduleUrl}`,
      `Cancel: ${props.cancelUrl}`,
      `Questions: reply to this email or contact ${OPZIX_CONTACT_EMAIL}.`,
    ].filter(Boolean).join("\n\n"),
    html: emailFrame(
      props.title,
      `
      <p>Hi ${escapeHtml(props.clientName)},</p>
      <p>${escapeHtml(props.intro)}</p>
      <h2 style="font-size:18px;margin-top:24px;">Your meeting</h2>
      ${appointmentHero(props.appointmentDate, props.appointmentTime, props.timezone)}
      ${
        props.googleMeetUrl
          ? `${button(props.googleMeetUrl, "Join Google Meet", "primary")}${secondaryLink(props.googleMeetUrl, props.googleMeetUrl)}`
          : `<p><strong>Meeting:</strong> ${escapeHtml(MEET_PENDING_MESSAGE)}</p>`
      }
      <h2 style="font-size:18px;margin-top:24px;">Before the call</h2>
      <ul>${props.preparationItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <p>
        <a href="${escapeHtml(props.rescheduleUrl)}">Reschedule</a>
        &nbsp;|&nbsp;
        <a href="${escapeHtml(props.cancelUrl)}">Cancel</a>
      </p>
      <p>Questions? Reply to this email or contact ${mailto(OPZIX_CONTACT_EMAIL)}.</p>
      `,
    ),
  };
}

function emailFrame(title: string, content: string) {
  return `<div style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:28px;"><div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #d9e2ef;border-radius:12px;padding:28px;"><p style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0891b2;font-weight:700;">Opzix</p><h1 style="margin:10px 0 18px;font-size:28px;color:#071024;">${escapeHtml(title)}</h1>${content}</div></div>`;
}

function appointmentHero(
  date: string,
  timeRange: string,
  timezone: string,
) {
  return `<div style="border:1px solid #c7d7ea;background:#f8fbff;border-radius:10px;padding:14px 16px;margin:0 0 18px;"><p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#071024;">${escapeHtml(
    date,
  )}</p><p style="margin:0;font-size:15px;color:#334155;">${escapeHtml(
    timeRange,
  )} ${escapeHtml(timezone)}</p></div>`;
}

function tableRows(rows: string[][], htmlOverrides: Record<string, string> = {}) {
  const body = rows
    .map(([label, value]) => {
      const display = htmlOverrides[label] || escapeHtml(value);
      return `<tr><th align="left" style="padding:10px;border-bottom:1px solid #d9e2ef;vertical-align:top;">${escapeHtml(
        label,
      )}</th><td style="padding:10px;border-bottom:1px solid #d9e2ef;vertical-align:top;">${display}</td></tr>`;
    })
    .join("");

  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:720px;">${body}</table>`;
}

function button(href: string, label: string, variant: "primary" | "secondary" = "primary") {
  const styles =
    variant === "primary"
      ? "background:#0891b2;color:#ffffff;border:1px solid #0891b2;"
      : "background:#ffffff;color:#0369a1;border:1px solid #c7d7ea;";

  return `<p><a href="${escapeHtml(href)}" style="display:inline-block;${styles}text-decoration:none;font-weight:700;border-radius:8px;padding:12px 18px;">${escapeHtml(label)}</a></p>`;
}

function secondaryLink(href: string, label: string) {
  return `<p style="margin-top:-6px;"><a href="${escapeHtml(
    href,
  )}" style="color:#0369a1;font-weight:700;text-decoration:underline;">${escapeHtml(
    label,
  )}</a></p>`;
}

function alertBox(message: string) {
  return `<div style="border:1px solid #f59e0b;background:#fffbeb;color:#78350f;border-radius:8px;padding:12px 14px;margin:14px 0;"><strong>Action needed:</strong> ${escapeHtml(message)}</div>`;
}

function missingInformationBox(fields: string[]) {
  return `<div style="border:1px solid #f59e0b;background:#fffbeb;color:#78350f;border-radius:8px;padding:12px 14px;margin:16px 0;"><strong>Missing Business Information</strong><ul style="margin:8px 0 0;padding-left:20px;">${fields
    .map((field) => `<li>${escapeHtml(field)}</li>`)
    .join("")}</ul></div>`;
}

function quickActions(
  appointment: AppointmentRecord,
  dashboardUrl: string,
  auditUrl: string,
) {
  const actions = [
    ["Open Lead", dashboardUrl],
    ["Open CRM", dashboardUrl],
    ["View Audit", auditUrl],
    ["Send Proposal", quickActionMailto("Send proposal", appointment)],
    ["Mark as Won", quickActionMailto("Mark as won", appointment)],
    ["Mark as Lost", quickActionMailto("Mark as lost", appointment)],
  ].filter(([, href]) => href);

  return `<div style="display:block;">${actions
    .map(
      ([label, href]) =>
        `<a href="${escapeHtml(
          href,
        )}" style="display:inline-block;margin:0 8px 8px 0;border:1px solid #c7d7ea;border-radius:8px;padding:9px 12px;color:#0369a1;text-decoration:none;font-weight:700;">${escapeHtml(
          label,
        )}</a>`,
    )
    .join("")}</div>`;
}

function optionalRow(label: string, value: string | null | undefined): string[][] {
  const cleaned = value?.trim();
  return cleaned ? [[label, cleaned]] : [];
}

function missingBusinessInformation(appointment: AppointmentRecord) {
  return [
    appointment.business_name ? "" : "Business name",
    appointment.website_domain ? "" : "Website",
    appointment.business_type ? "" : "Business type",
    appointment.challenge ? "" : "Main challenge",
  ].filter(Boolean);
}

function calendarStatusLabel(appointment: AppointmentRecord) {
  const status = appointment.calendar_sync_status || "pending";
  const labels: Record<string, { systemLabel: string; meetLabel: string; message: string; needsAttention: boolean }> = {
    synced: {
      systemLabel: "Calendar event created and Meet link ready",
      meetLabel: "Ready",
      message: "",
      needsAttention: false,
    },
    conference_pending: {
      systemLabel: "Calendar event created; Meet generation pending",
      meetLabel: "Meet generation pending",
      message:
        "Calendar event was created; Google Meet generation is still pending and will be retried automatically.",
      needsAttention: false,
    },
    failed: {
      systemLabel: "Calendar event creation or Meet generation failed",
      meetLabel: "Failed",
      message:
        appointment.calendar_sync_error ||
        "Calendar event creation or Meet generation failed.",
      needsAttention: true,
    },
    oauth_config_incomplete: {
      systemLabel: "Google OAuth configuration incomplete",
      meetLabel: "Configuration incomplete",
      message:
        appointment.calendar_sync_error ||
        "Google OAuth configuration is incomplete.",
      needsAttention: true,
    },
    skipped: {
      systemLabel: "Calendar sync skipped",
      meetLabel: "Skipped",
      message: appointment.calendar_sync_error || "Calendar sync was skipped.",
      needsAttention: true,
    },
    pending: {
      systemLabel: "Calendar sync pending",
      meetLabel: "Pending",
      message: "Calendar sync is pending.",
      needsAttention: false,
    },
  };

  return labels[status] || {
    systemLabel: cleanLabel(status),
    meetLabel: cleanLabel(status),
    message: appointment.calendar_sync_error || "",
    needsAttention: Boolean(appointment.calendar_sync_error),
  };
}

function preparationChecklist(appointment: AppointmentRecord) {
  const text = [
    appointment.business_type,
    appointment.service_requested,
    appointment.industry,
    appointment.source,
    appointment.challenge,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(ecommerce|e-commerce|dropship|shopify|store|retail|product)\b/.test(text)) {
    return [
      "Products or niche being considered.",
      "Supplier or fulfillment setup.",
      "Competitor websites.",
      "Launch timeline.",
      "Marketing budget or acquisition plan.",
    ];
  }

  if (/\b(real estate|realtor|broker|property|buyer|seller|listing)\b/.test(text)) {
    return [
      "Primary market.",
      "Buyer or seller focus.",
      "Current website and CRM.",
      "Lead sources.",
      "Main conversion challenge.",
    ];
  }

  if (/\b(service|agency|consult|contractor|clinic|care|local|lead generation)\b/.test(text)) {
    return [
      "Current website.",
      "Primary service.",
      "Target customer.",
      "Current lead-generation process.",
      "Main business challenge.",
    ];
  }

  return [
    "Website URL.",
    "Current business challenge.",
    "Existing audit report.",
    "What success should look like.",
  ];
}

function clientNameForEmail(value: string | null | undefined) {
  const cleaned = value?.trim();

  if (!cleaned || isInternalSchedulingLabel(cleaned)) {
    return "there";
  }

  return cleaned;
}

function isInternalSchedulingLabel(value: string) {
  return /^(schedule time|selected time|choose time|timezone|context|appointment summary|final review)$/i.test(
    value,
  );
}

function quickActionMailto(action: string, appointment: AppointmentRecord) {
  return mailtoHref(
    `Opzix CRM: ${action}`,
    [
      `Action: ${action}`,
      `Appointment ID: ${appointment.id}`,
      `Client: ${appointment.name}`,
      `Email: ${appointment.email}`,
    ].join("\n"),
  );
}

function mailto(email: string) {
  return `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`;
}

function tel(phone: string, label = phone) {
  if (!phone) return "Not provided";
  return `<a href="tel:${escapeHtml(phone)}">${escapeHtml(label)}</a>`;
}

function mailtoHref(subject: string, body: string) {
  return `mailto:${OPZIX_CONTACT_EMAIL}?${new URLSearchParams({ subject, body }).toString()}`;
}

function internalDashboardUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://opzix.io";
  return `${baseUrl.replace(/\/$/, "")}/admin/founder-dashboard`;
}

function internalAuditUrl(scanId: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://opzix.io";
  return `${baseUrl.replace(/\/$/, "")}/opzix-admin/scans?scanId=${encodeURIComponent(
    scanId,
  )}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
