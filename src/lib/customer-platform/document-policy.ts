export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const MAX_DOCUMENT_MB = 15;
export const DOCUMENT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.txt";

export type CustomerDocumentCategory =
  | "agreements"
  | "invoices"
  | "receipts"
  | "brand_assets"
  | "mls_brokerage"
  | "business_documents"
  | "other";

const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp", "txt"]);
const ALLOWED_BROWSER_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "",
]);

export type BrowserDocumentValidation =
  | { ok: true }
  | { ok: false; error: string; reason: "missing" | "too_large" | "unsupported" };

export function validateDocumentFileForBrowser(
  file: File | null,
): BrowserDocumentValidation {
  if (!file) {
    return { ok: false, reason: "missing", error: "Choose a file to upload." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return {
      ok: false,
      reason: "too_large",
      error: `This file is too large. Please upload a file smaller than ${MAX_DOCUMENT_MB} MB.`,
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      reason: "unsupported",
      error: "Upload a PDF, PNG, JPEG, WebP, or plain text file.",
    };
  }
  if (!ALLOWED_BROWSER_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      ok: false,
      reason: "unsupported",
      error: "Upload a PDF, PNG, JPEG, WebP, or plain text file.",
    };
  }

  return { ok: true };
}

export function documentCategoryLabel(category: string) {
  switch (category) {
    case "agreements":
      return "Agreements";
    case "invoices":
      return "Invoices";
    case "receipts":
      return "Receipts";
    case "brand_assets":
      return "Brand Assets";
    case "mls_brokerage":
      return "MLS / Brokerage";
    case "business_documents":
      return "Business Documents";
    case "other":
      return "Other";
    default:
      return "Document";
  }
}
