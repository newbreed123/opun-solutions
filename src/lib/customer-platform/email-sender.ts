const OPZIX_SENDER_NAME = "Opzix";
const DEFAULT_OPZIX_AUTH_FROM_EMAIL = "hello@opzix.io";

export function opzixAuthFromAddress() {
  const configured = process.env.OPZIX_AUTH_FROM_EMAIL?.trim();
  return emailAddressFromSender(configured) || DEFAULT_OPZIX_AUTH_FROM_EMAIL;
}

export function opzixAuthSenderIdentity() {
  return formatSenderIdentity(OPZIX_SENDER_NAME, opzixAuthFromAddress());
}

function formatSenderIdentity(name: string, email: string) {
  return `${name} <${email}>`;
}

function emailAddressFromSender(value: string | undefined) {
  if (!value) return "";

  const bracketMatch = value.match(/<([^<>]+)>/);
  const candidate = (bracketMatch?.[1] || value).trim();

  return isSafeEmailAddress(candidate) ? candidate : "";
}

function isSafeEmailAddress(value: string) {
  return /^[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+$/.test(value);
}
