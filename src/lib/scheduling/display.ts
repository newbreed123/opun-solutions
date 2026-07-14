import { getSchedulingConfig } from "./config";

export type AppointmentDisplayParts = {
  date: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  timezone: string;
  summary: string;
};

export function appointmentDisplayParts(
  startAt: string,
  timezone: string,
  endAt?: string,
): AppointmentDisplayParts {
  const start = new Date(startAt);
  const end = endAt
    ? new Date(endAt)
    : new Date(start.getTime() + getSchedulingConfig().durationMinutes * 60_000);
  const friendlyTimezone = formatTimezoneLabel(timezone);
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(start);
  const startTime = timeOnly(start, timezone);
  const endTime = timeOnly(end, timezone);
  const timeRange = `${startTime} - ${endTime}`;

  return {
    date,
    startTime,
    endTime,
    timeRange,
    timezone: friendlyTimezone,
    summary: `${date} at ${timeRange} ${friendlyTimezone}`,
  };
}

export function formatTimezoneLabel(timezone: string) {
  const timezoneLabels: Record<string, string> = {
    "America/New_York": "Eastern Time (ET)",
    "America/Detroit": "Eastern Time (ET)",
    "America/Chicago": "Central Time (CT)",
    "America/Denver": "Mountain Time (MT)",
    "America/Phoenix": "Mountain Time (MT)",
    "America/Los_Angeles": "Pacific Time (PT)",
  };

  return timezoneLabels[timezone] || timezone.replace(/_/g, " ");
}

export function formatPhoneForDisplay(phone: string | null | undefined) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

export function formatSourceLabel(source: string | null | undefined) {
  const sourceLabels: Record<string, string> = {
    audit_assistant: "Audit Assistant",
    audit_scanner: "Audit Scanner",
    contact_page: "Contact Page",
    ecommerce: "Ecommerce Page",
    footer: "Footer",
    header: "Website Header",
    hero: "Homepage Hero",
    pricing: "Pricing Section",
    services: "Services Page",
    services_page: "Services Page",
    strategy_cta: "Strategy Call CTA",
    zora: "Zora AI",
  };
  const cleaned = source?.trim();

  return cleaned ? sourceLabels[cleaned] || cleanLabel(cleaned) : "Direct";
}

export function formatBusinessTypeLabel(value: string | null | undefined) {
  const cleaned = value?.trim();
  if (!cleaned) return "";

  const labels: Record<string, string> = {
    ecommerce: "Ecommerce",
    "e-commerce": "Ecommerce",
    dropshipping: "Dropshipping",
    real_estate: "Real Estate",
    beauty: "Beauty",
    service: "Service Business",
    services: "Service Business",
    service_business: "Service Business",
  };

  return labels[cleaned.toLowerCase()] || cleanLabel(cleaned);
}

export function cleanLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function timeOnly(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}
