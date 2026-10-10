import { getSupabaseAdminConfig, supabaseAdminFetch } from "@/lib/supabase-admin";
import { CUSTOMER_ASSETS_BUCKET, isPreviewableImage } from "./onboarding-assets";

export type CustomerDocumentCategory =
  | "agreements"
  | "invoices"
  | "receipts"
  | "brand_assets"
  | "mls_brokerage"
  | "business_documents"
  | "other";

export type CustomerDocumentVisibility = "customer_visible" | "internal";
export type CustomerDocumentSource = "opzix_admin" | "customer";

export type CustomerDocumentRow = {
  id: string;
  organization_id: string;
  category: CustomerDocumentCategory;
  title: string;
  description: string | null;
  visibility: CustomerDocumentVisibility;
  source: CustomerDocumentSource;
  status: "active" | "replaced" | "deleted";
  bucket: string;
  object_path: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by_user_id: string | null;
  uploaded_by_label: string | null;
  replaced_by_document_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerDocumentRequestRow = {
  id: string;
  organization_id: string;
  category: CustomerDocumentCategory;
  title: string;
  message: string | null;
  status: "open" | "fulfilled" | "cancelled";
  fulfilled_by_document_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  fulfilled_at: string | null;
};

export type SignedCustomerDocument = CustomerDocumentRow & {
  viewUrl: string | null;
  downloadUrl: string | null;
  previewable: boolean;
};

const DOCUMENT_SELECT =
  "id,organization_id,category,title,description,visibility,source,status,bucket,object_path,filename,mime_type,size_bytes,uploaded_by_user_id,uploaded_by_label,replaced_by_document_id,created_at,updated_at";
const REQUEST_SELECT =
  "id,organization_id,category,title,message,status,fulfilled_by_document_id,created_by,created_at,updated_at,fulfilled_at";
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.txt";
export const INTERNAL_DOCUMENTS_BUCKET = "opzix-internal-documents";
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"]);
const ACTIVE_CONTENT_PATTERNS = [
  /<!doctype\s+html/i,
  /<html[\s>]/i,
  /<script[\s>]/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /<svg[\s>]/i,
  /<\?php/i,
];

export async function listCustomerDocuments({
  organizationId,
  includeInternal = false,
  includeArchived = false,
}: {
  organizationId: string;
  includeInternal?: boolean;
  includeArchived?: boolean;
}) {
  const result = await supabaseAdminFetch<CustomerDocumentRow[]>(
    "customer_documents",
    {
      query: {
        select: DOCUMENT_SELECT,
        organization_id: `eq.${organizationId}`,
        ...(includeArchived ? {} : { status: "eq.active" }),
        ...(includeInternal ? {} : { visibility: "eq.customer_visible" }),
        order: "created_at.desc",
        limit: 200,
      },
    },
  );
  if (!result.ok) {
    return {
      ok: false as const,
      data: [] as SignedCustomerDocument[],
      error: result.error,
    };
  }
  const signed = await Promise.all(result.data.map(signCustomerDocument));
  return { ok: true as const, data: signed };
}

export async function listDocumentRequests(organizationId: string) {
  const result = await supabaseAdminFetch<CustomerDocumentRequestRow[]>(
    "customer_document_requests",
    {
      query: {
        select: REQUEST_SELECT,
        organization_id: `eq.${organizationId}`,
        order: "created_at.desc",
        limit: 100,
      },
    },
  );
  return result.ok ? result.data : [];
}

export async function uploadCustomerDocument({
  organizationId,
  userId,
  source,
  title,
  description,
  category,
  visibility,
  file,
  requestId,
}: {
  organizationId: string;
  userId?: string;
  source: CustomerDocumentSource;
  title: string;
  description?: string;
  category: CustomerDocumentCategory;
  visibility: CustomerDocumentVisibility;
  file: File;
  requestId?: string;
}) {
  const validation = await validateDocumentFile(file);
  if (!validation.ok) return validation;
  if (source === "customer" && visibility !== "customer_visible") {
    return { ok: false as const, error: "Customer uploads must be customer visible." };
  }

  const config = getSupabaseAdminConfig();
  if (!config) {
    return { ok: false as const, error: "Supabase storage is not configured." };
  }

  if (requestId) {
    const request = await loadDocumentRequest({ organizationId, requestId });
    if (!request || request.status !== "open") {
      return { ok: false as const, error: "Document request was not found." };
    }
  }

  const now = new Date();
  const objectPath = [
    organizationId,
    "documents",
    category,
    `${now.getTime()}-${crypto.randomUUID()}-${safeFilename(file.name)}`,
  ].join("/");
  const bucket = documentBucketForVisibility(visibility);

  const upload = await uploadStorageObject({
    url: config.url,
    serviceRoleKey: config.serviceRoleKey,
    bucket,
    objectPath,
    file,
  });
  if (!upload.ok) return upload;

  const inserted = await supabaseAdminFetch<CustomerDocumentRow[]>(
    "customer_documents",
    {
      method: "POST",
      body: {
        organization_id: organizationId,
        category,
        title,
        description: description || null,
        visibility,
        source,
        status: "active",
        bucket,
        object_path: objectPath,
        filename: safeFilename(file.name),
        mime_type: validation.mimeType,
        size_bytes: file.size,
        uploaded_by_user_id: userId || null,
        uploaded_by_label:
          source === "customer" ? "Customer upload" : "Opzix admin",
      },
      prefer: "return=representation",
    },
  );
  if (!inserted.ok) return inserted;

  const document = inserted.data[0];
  if (requestId && document) {
    await supabaseAdminFetch<null>("customer_document_requests", {
      method: "PATCH",
      query: {
        id: `eq.${requestId}`,
        organization_id: `eq.${organizationId}`,
      },
      body: {
        status: "fulfilled",
        fulfilled_by_document_id: document.id,
        fulfilled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      prefer: "returning=minimal",
    });
  }

  return { ok: true as const, document };
}

export async function archiveCustomerDocument({
  organizationId,
  documentId,
  source,
}: {
  organizationId: string;
  documentId: string;
  source?: CustomerDocumentSource;
}) {
  return supabaseAdminFetch<CustomerDocumentRow[]>("customer_documents", {
    method: "PATCH",
    query: {
      id: `eq.${documentId}`,
      organization_id: `eq.${organizationId}`,
      status: "eq.active",
      ...(source ? { source: `eq.${source}` } : {}),
    },
    body: {
      status: "deleted",
      updated_at: new Date().toISOString(),
    },
    prefer: "return=representation",
  });
}

export async function createDocumentRequest({
  organizationId,
  category,
  title,
  message,
}: {
  organizationId: string;
  category: CustomerDocumentCategory;
  title: string;
  message?: string;
}) {
  return supabaseAdminFetch<null>("customer_document_requests", {
    method: "POST",
    body: {
      organization_id: organizationId,
      category,
      title,
      message: message || null,
      status: "open",
      created_by: "opzix-admin-session",
    },
    prefer: "returning=minimal",
  });
}

export async function signCustomerDocument(
  document: CustomerDocumentRow,
): Promise<SignedCustomerDocument> {
  const signed = await createSignedStorageUrl(document.bucket, document.object_path);
  const downloadUrl = signed
    ? `${signed}${signed.includes("?") ? "&" : "?"}download=${encodeURIComponent(
        document.filename,
      )}`
    : null;
  return {
    ...document,
    viewUrl: signed,
    downloadUrl,
    previewable: isPreviewableImage(document.mime_type) || document.mime_type === "application/pdf",
  };
}

export function documentCategoryLabel(category: CustomerDocumentCategory) {
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
  }
}

export async function validateDocumentFile(file: File) {
  if (!file || file.size <= 0) {
    return { ok: false as const, error: "Choose a file to upload." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false as const, error: "Documents must be 15 MB or smaller." };
  }
  const detected = await detectSafeDocumentMimeType(file);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected)) {
    return {
      ok: false as const,
      error: "Upload a PDF, PNG, JPEG, WebP, or plain text file.",
    };
  }
  return { ok: true as const, mimeType: detected };
}

async function detectSafeDocumentMimeType(file: File) {
  const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 4096)).arrayBuffer());
  const declared = (file.type || "").toLowerCase();
  const filename = file.name.toLowerCase();

  if (hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if ((declared === "text/plain" || filename.endsWith(".txt")) && looksLikePlainText(bytes)) {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (!ACTIVE_CONTENT_PATTERNS.some((pattern) => pattern.test(text))) {
      return "text/plain";
    }
  }

  return null;
}

function hasPrefix(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function looksLikePlainText(bytes: Uint8Array) {
  if (!bytes.length) return false;
  let controlCount = 0;
  for (const byte of bytes) {
    if (byte === 0) return false;
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) controlCount += 1;
  }
  return controlCount <= 2;
}

function documentBucketForVisibility(visibility: CustomerDocumentVisibility) {
  return visibility === "internal" ? INTERNAL_DOCUMENTS_BUCKET : CUSTOMER_ASSETS_BUCKET;
}

async function loadDocumentRequest({
  organizationId,
  requestId,
}: {
  organizationId: string;
  requestId: string;
}) {
  const result = await supabaseAdminFetch<CustomerDocumentRequestRow[]>(
    "customer_document_requests",
    {
      query: {
        select: REQUEST_SELECT,
        id: `eq.${requestId}`,
        organization_id: `eq.${organizationId}`,
        limit: 1,
      },
    },
  );
  return result.ok ? result.data[0] ?? null : null;
}

async function uploadStorageObject({
  url,
  serviceRoleKey,
  bucket,
  objectPath,
  file,
}: {
  url: string;
  serviceRoleKey: string;
  bucket: string;
  objectPath: string;
  file: File;
}) {
  const response = await fetch(
    `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: await file.arrayBuffer(),
    },
  ).catch(() => null);

  if (!response) {
    return { ok: false as const, error: "Storage upload failed before a response." };
  }
  if (!response.ok) {
    return {
      ok: false as const,
      error: `Storage upload failed with status ${response.status}.`,
      status: response.status,
    };
  }
  return { ok: true as const };
}

async function createSignedStorageUrl(bucket: string, objectPath: string) {
  const config = getSupabaseAdminConfig();
  if (!config || !bucket || !objectPath) return null;

  const response = await fetch(
    `${config.url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ expiresIn: 60 * 60 }),
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response?.ok) return null;
  const payload = (await response.json().catch(() => ({}))) as {
    signedURL?: unknown;
    signedUrl?: unknown;
  };
  const signedPath =
    typeof payload.signedURL === "string"
      ? payload.signedURL
      : typeof payload.signedUrl === "string"
        ? payload.signedUrl
        : "";
  if (!signedPath) return null;
  return signedPath.startsWith("http")
    ? signedPath
    : `${config.url}/storage/v1${signedPath}`;
}

function safeFilename(value: string) {
  const cleaned = value
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 160);
  return cleaned || "document";
}

function encodeObjectPath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}
