import type { AppointmentInput, SchedulingContext } from "./types";

export type ValidatedAppointmentInput = Required<
  Pick<AppointmentInput, "startAt" | "timezone" | "name" | "email" | "phone">
> &
  SchedulingContext & {
    businessName?: string;
    websiteDomain?: string;
    message?: string;
    idempotencyKey: string;
  };

const MAX_BODY_CHARS = 12_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function parseJsonBody<T>(request: Request) {
  const text = await request.text();

  if (text.length > MAX_BODY_CHARS) {
    return { ok: false as const, error: "Request is too large." };
  }

  try {
    return { ok: true as const, data: JSON.parse(text || "{}") as T };
  } catch {
    return { ok: false as const, error: "Invalid request." };
  }
}

export function validateAppointmentInput(
  body: Record<string, unknown>,
  idempotencyHeader?: string | null,
): { ok: true; data: ValidatedAppointmentInput } | { ok: false; error: string } {
  const startAt = stringValue(body.startAt || body.selectedSlot);
  const timezone = stringValue(body.timezone);
  const name = stringValue(body.name);
  const email = stringValue(body.email).toLowerCase();
  const phone = normalizePhone(body.phone);
  const parsedStart = new Date(startAt);

  if (!Number.isFinite(parsedStart.getTime())) {
    return { ok: false, error: "Choose a valid time slot." };
  }

  if (!timezone) {
    return { ok: false, error: "Choose a valid timezone." };
  }

  if (!name) {
    return { ok: false, error: "Enter your name." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!phone) {
    return { ok: false, error: "Enter a valid phone number." };
  }

  return {
    ok: true,
    data: {
      startAt: parsedStart.toISOString(),
      timezone: timezone.slice(0, 80),
      name: name.slice(0, 120),
      email: email.slice(0, 180),
      phone,
      businessName: stringValue(body.businessName).slice(0, 160) || undefined,
      websiteDomain: normalizeWebsiteToDomain(body.website || body.websiteDomain),
      businessType: stringValue(body.businessType).slice(0, 120) || undefined,
      challenge: stringValue(body.challenge).slice(0, 180) || undefined,
      serviceRequested: stringValue(body.serviceRequested).slice(0, 160) || undefined,
      industry: stringValue(body.industry).slice(0, 120) || undefined,
      message: stringValue(body.message).slice(0, 1200) || undefined,
      source: safeIdentifier(body.source, 80),
      scanId: safeIdentifier(body.scanId, 120),
      sessionId: safeIdentifier(body.sessionId, 120),
      utmSource: stringValue(body.utm_source || body.utmSource).slice(0, 120) || undefined,
      utmMedium: stringValue(body.utm_medium || body.utmMedium).slice(0, 120) || undefined,
      utmCampaign:
        stringValue(body.utm_campaign || body.utmCampaign).slice(0, 160) || undefined,
      gclid: safeIdentifier(body.gclid, 180),
      idempotencyKey:
        safeIdentifier(idempotencyHeader, 180) ||
        safeIdentifier(body.idempotencyKey, 180) ||
        createIdempotencyKey(),
    },
  };
}

export function normalizePhone(value: unknown) {
  const raw = stringValue(value);
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  const normalizedDigits =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (normalizedDigits.length !== 10) return "";

  return `+1${normalizedDigits}`;
}

export function normalizeWebsiteToDomain(value: unknown) {
  const raw = stringValue(value);
  if (!raw) return undefined;

  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    return url.hostname.replace(/^www\./i, "").toLowerCase().slice(0, 180);
  } catch {
    return raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split(/[/?#]/)[0]
      .toLowerCase()
      .slice(0, 180);
  }
}

export function safeAnalyticsContext(input: SchedulingContext) {
  return {
    source: input.source,
    websiteUrl: input.websiteDomain,
    websiteDomain: input.websiteDomain,
    scanId: input.scanId,
    sessionId: input.sessionId,
    businessType: input.businessType,
    challenge: input.challenge,
    serviceRequested: input.serviceRequested,
    industry: input.industry,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    gclid: input.gclid,
  };
}

export function publicToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function createIdempotencyKey() {
  return `appointment-${crypto.randomUUID()}`;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function safeIdentifier(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_.:-]/g, "");
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}
