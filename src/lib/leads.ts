export const leadSourcePages = [
  "opzix-audit",
  "ecommerce-audit",
  "contact-general",
  "ai-chatbot",
  "services",
  "homepage",
] as const;

export type LeadSourcePage = (typeof leadSourcePages)[number];

export type LeadType = "contact" | "ecommerce-audit";

export type NormalizedLead = {
  leadType: LeadType;
  name: string;
  serviceNeeded: string;
  businessType: string;
  website: string;
  email: string;
  message: string;
  sourcePage: LeadSourcePage;
  scanId: string;
  scannedUrl: string;
  auditScore: string;
  auditStatus: string;
  primaryConcern: string;
  createdAt: string;
};

type NormalizeLeadOptions = {
  leadType: LeadType;
  defaultSourcePage: LeadSourcePage;
};

export function normalizeLead(
  values: Record<string, string>,
  options: NormalizeLeadOptions,
): NormalizedLead {
  return {
    leadType: options.leadType,
    name: values.name ?? "",
    serviceNeeded: values.serviceNeeded || values.service || "",
    businessType: values.businessType ?? "",
    website: values.website ?? "",
    email: values.email ?? "",
    message: values.message || values.projectDescription || values.biggestIssue || "",
    sourcePage: normalizeLeadSourcePage(
      values.sourcePage || values.source || "",
      options.defaultSourcePage,
    ),
    scanId: values.scanId ?? "",
    scannedUrl: values.scannedUrl ?? "",
    auditScore: values.auditScore || values.score || "",
    auditStatus: values.auditStatus || values.status || "",
    primaryConcern: values.primaryConcern ?? "",
    createdAt: new Date().toISOString(),
  };
}

export function normalizeLeadSourcePage(
  sourcePage: string,
  fallback: LeadSourcePage = "contact-general",
): LeadSourcePage {
  const cleanSource = sourcePage.trim().toLowerCase();

  if (isLeadSourcePage(cleanSource)) {
    return cleanSource;
  }

  return fallback;
}

export function isLeadSourcePage(sourcePage: string): sourcePage is LeadSourcePage {
  return leadSourcePages.includes(sourcePage as LeadSourcePage);
}
