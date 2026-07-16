const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g;
const CREDIT_CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const SECRET_PATTERN =
  /\b(password|passcode|api[_\s-]?key|secret|token)\b\s*[:=]\s*([^\s,.;]+)/gi;

export function redactSensitiveText(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .replace(EMAIL_PATTERN, "[email redacted]")
    .replace(PHONE_PATTERN, "[phone redacted]")
    .replace(CREDIT_CARD_PATTERN, "[payment detail redacted]")
    .replace(SSN_PATTERN, "[ssn redacted]")
    .replace(SECRET_PATTERN, "$1: [secret redacted]");
}

export function truncateForStorage(value: unknown, maxLength: number) {
  return redactSensitiveText(value).slice(0, maxLength);
}
