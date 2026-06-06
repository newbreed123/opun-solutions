export type AuditAttribution = {
  scanId?: string;
  scannedUrl?: string;
  score?: number | string;
  status?: string;
  primaryConcern?: string;
};

export type AuditSourceArea = "report" | "assistant" | "hero" | "footer";

export function buildAuditContactHref(attribution: AuditAttribution) {
  const params = new URLSearchParams({ source: "opzix-audit" });

  if (attribution.scanId) {
    params.set("scanId", attribution.scanId);
  }

  if (attribution.scannedUrl) {
    params.set("scannedUrl", attribution.scannedUrl);
  }

  if (attribution.score !== undefined && attribution.score !== "") {
    params.set("score", String(attribution.score));
  }

  if (attribution.status) {
    params.set("status", attribution.status);
  }

  if (attribution.primaryConcern) {
    params.set("primaryConcern", attribution.primaryConcern);
  }

  return `/contact?${params.toString()}`;
}
