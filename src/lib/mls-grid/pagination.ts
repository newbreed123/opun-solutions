import "server-only";
import { MlsGridError } from "./errors.js";

const MIN_REQUEST_SPACING_MS = 500;

export class MlsGridRequestScheduler {
  private nextRequestAt = 0;
  readonly delay: (ms: number) => Promise<void>;

  constructor(delay: (ms: number) => Promise<void> = defaultDelay) {
    this.delay = delay;
  }

  async waitForTurn(now = Date.now()) {
    const waitMs = Math.max(0, this.nextRequestAt - now);
    if (waitMs > 0) {
      await this.delay(waitMs);
    }
    this.nextRequestAt = Math.max(now, this.nextRequestAt) + MIN_REQUEST_SPACING_MS;
  }
}

export function validateMlsGridNextLink(nextLink: string, baseUrl: string) {
  let parsed: URL;
  let base: URL;
  try {
    parsed = new URL(nextLink);
    base = new URL(baseUrl);
  } catch {
    throw new MlsGridError({
      code: "invalid_pagination_url",
      message: "MLS Grid @odata.nextLink must be a valid absolute URL.",
    });
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "api.mlsgrid.com" ||
    parsed.hostname !== base.hostname
  ) {
    throw new MlsGridError({
      code: "invalid_pagination_url",
      message: "MLS Grid @odata.nextLink must remain on https://api.mlsgrid.com.",
      details: { host: parsed.hostname },
    });
  }

  return parsed;
}

function defaultDelay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
