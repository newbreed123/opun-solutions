"use server";

import { revalidatePath } from "next/cache";
import {
  createCustomerDocumentUploadUrl,
  finalizeUploadedCustomerDocument,
  type CustomerDocumentCategory,
} from "./documents";
import { MAX_DOCUMENT_BYTES } from "./document-policy";
import { requireCustomerContext } from "./store";

type UploadIntentInput = {
  category: string;
  requestId?: string;
  title: string;
  filename: string;
  mimeType?: string;
  sizeBytes: number;
};

type FinalizeUploadInput = UploadIntentInput & {
  bucket: string;
  objectPath: string;
};

const categories: CustomerDocumentCategory[] = [
  "agreements",
  "invoices",
  "receipts",
  "brand_assets",
  "mls_brokerage",
  "business_documents",
  "other",
];

export async function createCustomerDocumentUploadIntent(input: UploadIntentInput) {
  const context = await requireCustomerContext();
  const validated = validateUploadInput(input);
  if (!validated.ok) return validated;

  const intent = await createCustomerDocumentUploadUrl({
    organizationId: context.organization.id,
    category: validated.category,
    filename: validated.filename,
  });
  if (!intent.ok) {
    return { ok: false as const, error: "Upload could not be prepared. Try again." };
  }

  return {
    ok: true as const,
    bucket: intent.bucket,
    objectPath: intent.objectPath,
    signedUploadUrl: intent.signedUploadUrl,
  };
}

export async function finalizeCustomerDocumentUpload(input: FinalizeUploadInput) {
  const context = await requireCustomerContext();
  const validated = validateUploadInput(input);
  if (!validated.ok) return validated;

  const finalized = await finalizeUploadedCustomerDocument({
    organizationId: context.organization.id,
    userId: context.user.id,
    title: validated.title,
    category: validated.category,
    requestId: validated.requestId,
    bucket: input.bucket,
    objectPath: input.objectPath,
    filename: validated.filename,
    browserMimeType: validated.mimeType,
    sizeBytes: validated.sizeBytes,
  });

  if (!finalized.ok) {
    return {
      ok: false as const,
      error:
        finalized.error === "Documents must be 15 MB or smaller."
          ? "This file is too large. Please upload a file smaller than 15 MB."
          : "Document upload failed. Check the file type and size, then try again.",
    };
  }

  revalidatePath("/app");
  revalidatePath("/app/billing");
  revalidatePath("/app/documents");
  return { ok: true as const };
}

function validateUploadInput(input: UploadIntentInput) {
  const title = input.title.trim();
  const filename = input.filename.trim();
  const category = input.category.trim();
  const requestId = input.requestId?.trim() || undefined;
  const mimeType = input.mimeType?.trim() || undefined;
  const sizeBytes = Number(input.sizeBytes);

  if (!isDocumentCategory(category) || title.length < 2 || filename.length < 1) {
    return {
      ok: false as const,
      error: "Document upload failed. Check the file type and size, then try again.",
    };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false as const, error: "Choose a file to upload." };
  }
  if (sizeBytes > MAX_DOCUMENT_BYTES) {
    return {
      ok: false as const,
      error: "This file is too large. Please upload a file smaller than 15 MB.",
    };
  }

  return {
    ok: true as const,
    category,
    requestId,
    title,
    filename,
    mimeType,
    sizeBytes,
  };
}

function isDocumentCategory(value: string): value is CustomerDocumentCategory {
  return categories.includes(value as CustomerDocumentCategory);
}
