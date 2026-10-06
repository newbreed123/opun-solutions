import "server-only";

const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._~+/-]+/gi;
const TOKEN_PARAM_PATTERN = /(access[_-]?token|token|api[_-]?key)=([^&\s]+)/gi;
const AUTH_HEADER_PATTERN = /(authorization|apikey)["']?\s*[:=]\s*["']?[^"',\s}]+/gi;
const MEDIA_USER_AGENT_PATTERN = /(user[-_ ]?agent)["']?\s*[:=]\s*["'][^"']+["']/gi;

export function redactMlsGridText(value: unknown) {
  return String(value ?? "")
    .replace(BEARER_PATTERN, "Bearer [redacted]")
    .replace(TOKEN_PARAM_PATTERN, "$1=[redacted]")
    .replace(AUTH_HEADER_PATTERN, "$1: [redacted]")
    .replace(MEDIA_USER_AGENT_PATTERN, "$1: [redacted]");
}

export function safeQueryShape(query: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => [
      key,
      typeof value === "string" ? redactMlsGridText(value) : value,
    ]),
  );
}
