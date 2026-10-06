import "server-only";
import { redactMlsGridText } from "./redaction.js";

export type MlsGridErrorCode =
  | "missing_configuration"
  | "authentication_failure"
  | "authorization_failure"
  | "rate_limited"
  | "invalid_query"
  | "invalid_pagination_url"
  | "provider_timeout"
  | "malformed_provider_response"
  | "upstream_server_failure";

export class MlsGridError extends Error {
  readonly code: MlsGridErrorCode;
  readonly status?: number;
  readonly details?: Record<string, unknown>;

  constructor({
    code,
    message,
    status,
    details,
  }: {
    code: MlsGridErrorCode;
    message: string;
    status?: number;
    details?: Record<string, unknown>;
  }) {
    super(redactMlsGridText(message));
    this.name = "MlsGridError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function serializeMlsGridError(error: unknown) {
  if (error instanceof MlsGridError) {
    return {
      name: error.name,
      code: error.code,
      status: error.status ?? null,
      message: redactMlsGridText(error.message),
      details: redactMlsGridObject(error.details ?? {}),
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    name: "Error",
    code: "upstream_server_failure" satisfies MlsGridErrorCode,
    status: null,
    message: redactMlsGridText(message),
    details: {},
  };
}

function redactMlsGridObject(value: unknown): unknown {
  if (typeof value === "string") return redactMlsGridText(value);
  if (Array.isArray(value)) return value.map(redactMlsGridObject);
  if (typeof value !== "object" || value === null) return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      redactMlsGridObject(entry),
    ]),
  );
}
