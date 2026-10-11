import { getSupabaseAdminConfig, supabaseAdminFetch } from "@/lib/supabase-admin";
import {
  DOCUMENT_ACCEPT,
  type CustomerDocumentCategory as PolicyCustomerDocumentCategory,
  MAX_DOCUMENT_BYTES,
  documentCategoryLabel,
} from "./document-policy";
import { CUSTOMER_ASSETS_BUCKET, isPreviewableImage } from "./onboarding-assets";

export { DOCUMENT_ACCEPT, documentCategoryLabel };

export type CustomerDocumentCategory = PolicyCustomerDocumentCategory;

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

export async function createCustomerDocumentUploadUrl({
  organizationId,
  category,
  filename,
}: {
  organizationId: string;
  category: CustomerDocumentCategory;
  filename: string;
}) {
  const config = getSupabaseAdminConfig();
  if (!config) {
    return { ok: false as const, error: "Supabase storage is not configured." };
  }

  const now = new Date();
  const objectPath = [
    organizationId,
    "documents",
    category,
    `${now.getTime()}-${crypto.randomUUID()}-${safeFilename(filename)}`,
  ].join("/");
  const bucket = CUSTOMER_ASSETS_BUCKET;
  const response = await fetch(
    `${config.url}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-upsert": "false",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response) {
    return { ok: false as const, error: "Storage upload authorization failed before a response." };
  }
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    return {
      ok: false as const,
      error: "Storage upload authorization failed.",
      status: response.status,
    };
  }

  const rawSignedUrl = stringValue(payload.signedUrl) || stringValue(payload.signedURL);
  const rawUrl = stringValue(payload.url);
  const signedUploadUrl = rawSignedUrl
    ? absoluteStorageUrl(config.url, rawSignedUrl)
    : rawUrl
      ? absoluteStorageUrl(config.url, rawUrl)
      : "";
  if (!signedUploadUrl) {
    return { ok: false as const, error: "Storage upload authorization was incomplete." };
  }

  return {
    ok: true as const,
    bucket,
    objectPath,
    signedUploadUrl,
  };
}

export async function finalizeUploadedCustomerDocument({
  organizationId,
  userId,
  title,
  category,
  requestId,
  bucket,
  objectPath,
  filename,
  browserMimeType,
  sizeBytes,
}: {
  organizationId: string;
  userId: string;
  title: string;
  category: CustomerDocumentCategory;
  requestId?: string;
  bucket: string;
  objectPath: string;
  filename: string;
  browserMimeType?: string;
  sizeBytes: number;
}) {
  if (bucket !== CUSTOMER_ASSETS_BUCKET) {
    return { ok: false as const, error: "Document upload target is invalid." };
  }
  if (!objectPath.startsWith(`${organizationId}/documents/${category}/`)) {
    return { ok: false as const, error: "Document upload path is invalid." };
  }
  if (sizeBytes > MAX_DOCUMENT_BYTES) {
    await deleteStorageObject({ bucket, objectPath });
    return { ok: false as const, error: "Documents must be 15 MB or smaller." };
  }

  if (requestId) {
    const request = await loadDocumentRequest({ organizationId, requestId });
    if (!request || request.status !== "open") {
      await deleteStorageObject({ bucket, objectPath });
      return { ok: false as const, error: "Document request was not found." };
    }
  }

  const existing = await supabaseAdminFetch<CustomerDocumentRow[]>("customer_documents", {
    query: {
      select: DOCUMENT_SELECT,
      organization_id: `eq.${organizationId}`,
      bucket: `eq.${bucket}`,
      object_path: `eq.${objectPath}`,
      limit: 1,
    },
  });
  if (!existing.ok) {
    return existing;
  }
  const existingDocument = existing.data[0];
  if (existingDocument) {
    return { ok: true as const, document: existingDocument };
  }

  const downloaded = await downloadStorageObject({ bucket, objectPath });
  if (!downloaded.ok) {
    return downloaded;
  }

  const file = new File([downloaded.data], filename, {
    type: browserMimeType || "application/octet-stream",
  });
  const validation = await validateDocumentFile(file);
  if (!validation.ok) {
    await deleteStorageObject({ bucket, objectPath });
    return validation;
  }

  const inserted = await supabaseAdminFetch<CustomerDocumentRow[]>(
    "customer_documents",
    {
      method: "POST",
      body: {
        organization_id: organizationId,
        category,
        title,
        description: null,
        visibility: "customer_visible",
        source: "customer",
        status: "active",
        bucket,
        object_path: objectPath,
        filename: safeFilename(filename),
        mime_type: validation.mimeType,
        size_bytes: file.size,
        uploaded_by_user_id: userId,
        uploaded_by_label: "Customer upload",
      },
      prefer: "return=representation",
    },
  );
  if (!inserted.ok) {
    await deleteStorageObject({ bucket, objectPath });
    return inserted;
  }

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

async function downloadStorageObject({
  bucket,
  objectPath,
}: {
  bucket: string;
  objectPath: string;
}) {
  const config = getSupabaseAdminConfig();
  if (!config) {
    return { ok: false as const, error: "Supabase storage is not configured." };
  }

  const response = await fetch(
    `${config.url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`,
    {
      method: "GET",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
      cache: "no-store",
    },
  ).catch(() => null);
  if (!response) {
    return { ok: false as const, error: "Storage validation failed before a response." };
  }
  if (!response.ok) {
    return {
      ok: false as const,
      error: "Storage validation failed.",
      status: response.status,
    };
  }
  return { ok: true as const, data: await response.arrayBuffer() };
}

async function deleteStorageObject({
  bucket,
  objectPath,
}: {
  bucket: string;
  objectPath: string;
}) {
  const config = getSupabaseAdminConfig();
  if (!config) return { ok: false as const };

  const response = await fetch(
    `${config.url}/storage/v1/object/${encodeURIComponent(bucket)}`,
    {
      method: "DELETE",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: [objectPath] }),
    },
  ).catch(() => null);

  return { ok: response?.ok === true };
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

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function absoluteStorageUrl(baseUrl: string, value: string) {
  if (value.startsWith("http")) return value;
  if (value.startsWith("/storage/v1")) return `${baseUrl}${value}`;
  if (value.startsWith("/")) return `${baseUrl}/storage/v1${value}`;
  return value;
}
