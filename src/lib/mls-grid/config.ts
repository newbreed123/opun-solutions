import "server-only";
import { MlsGridError } from "./errors.js";
import type { MlsGridUse } from "./types/common.js";

const DEFAULT_BASE_URL = "https://api.mlsgrid.com/v2";
const DEFAULT_ORIGINATING_SYSTEM_NAME = "carolina";

export type MlsGridConfig = {
  baseUrl: string;
  originatingSystemName: string;
  accessToken: string;
  use: MlsGridUse;
};

export function getMlsGridConfig({ use }: { use: MlsGridUse }): MlsGridConfig {
  const baseUrl = (
    process.env.MLS_GRID_BASE_URL?.trim() || DEFAULT_BASE_URL
  ).replace(/\/$/, "");
  const originatingSystemName =
    process.env.MLS_GRID_ORIGINATING_SYSTEM_NAME?.trim() ||
    DEFAULT_ORIGINATING_SYSTEM_NAME;
  const tokenVariable =
    use === "idx" ? "MLS_GRID_IDX_ACCESS_TOKEN" : "MLS_GRID_BO_ACCESS_TOKEN";
  const accessToken = process.env[tokenVariable]?.trim();

  if (!accessToken) {
    throw new MlsGridError({
      code: "missing_configuration",
      message: `Missing required MLS Grid environment variable: ${tokenVariable}.`,
      details: { variable: tokenVariable, use },
    });
  }

  validateBaseUrl(baseUrl);

  return {
    baseUrl,
    originatingSystemName,
    accessToken,
    use,
  };
}

export function hasMlsGridConfig({ use }: { use: MlsGridUse }) {
  try {
    getMlsGridConfig({ use });
    return true;
  } catch {
    return false;
  }
}

function validateBaseUrl(baseUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new MlsGridError({
      code: "missing_configuration",
      message: "MLS_GRID_BASE_URL must be a valid HTTPS URL.",
      details: { variable: "MLS_GRID_BASE_URL" },
    });
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "api.mlsgrid.com") {
    throw new MlsGridError({
      code: "missing_configuration",
      message: "MLS_GRID_BASE_URL must use https://api.mlsgrid.com.",
      details: { variable: "MLS_GRID_BASE_URL", host: parsed.hostname },
    });
  }
}
