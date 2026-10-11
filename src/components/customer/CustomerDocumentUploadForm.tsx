"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import {
  createCustomerDocumentUploadIntent,
  finalizeCustomerDocumentUpload,
} from "@/lib/customer-platform/document-upload-actions";
import {
  DOCUMENT_ACCEPT,
  MAX_DOCUMENT_MB,
  documentCategoryLabel,
  validateDocumentFileForBrowser,
} from "@/lib/customer-platform/document-policy";
import type { CustomerDocumentCategory } from "@/lib/customer-platform/documents";

type DocumentRequestOption = {
  id: string;
  title: string;
};

type CustomerDocumentUploadFormProps = {
  categories: CustomerDocumentCategory[];
  requests: DocumentRequestOption[];
  serverError?: string | null;
};

export default function CustomerDocumentUploadForm({
  categories,
  requests,
  serverError = null,
}: CustomerDocumentUploadFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(serverError);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setError(serverError);
  }, [serverError]);

  function validateSelectedFile() {
    const file = fileInputRef.current?.files?.[0] ?? null;
    const validation = validateDocumentFileForBrowser(file);
    setError(validation.ok ? null : validation.error);
    return validation.ok ? file : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const file = validateSelectedFile();
    if (!file) return;

    const formData = new FormData(event.currentTarget);
    const title = stringField(formData, "title");
    const category = stringField(formData, "category");
    const requestId = stringField(formData, "request_id");
    if (title.length < 2) {
      setError("Enter a title for this document.");
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const intent = await createCustomerDocumentUploadIntent({
        category,
        requestId,
        title,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      if (!intent.ok) {
        setError(intent.error);
        return;
      }

      const upload = await uploadToSignedUrl(intent.signedUploadUrl, file);
      if (!upload.ok) {
        setError(upload.error);
        return;
      }

      const finalized = await finalizeCustomerDocumentUpload({
        category,
        requestId,
        title,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        bucket: intent.bucket,
        objectPath: intent.objectPath,
      });
      if (!finalized.ok) {
        setError(finalized.error);
        return;
      }

      formRef.current?.reset();
      setSuccess("Document uploaded.");
      router.refresh();
    } catch {
      setError("Upload failed. Check your connection, then try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="mt-5 grid min-w-0 gap-4"
      onSubmit={handleSubmit}
    >
      <label className="min-w-0 text-sm font-semibold text-secondary">
        Document request
        <select
          name="request_id"
          className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
        >
          <option value="">General upload</option>
          {requests.map((request) => (
            <option key={request.id} value={request.id}>
              {request.title}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 text-sm font-semibold text-secondary">
        Category
        <select
          name="category"
          defaultValue="business_documents"
          className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {documentCategoryLabel(category)}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 text-sm font-semibold text-secondary">
        Title
        <input
          name="title"
          required
          className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
          placeholder="Broker authorization, W-9, logo file..."
        />
      </label>
      <label className="min-w-0 text-sm font-semibold text-secondary">
        File
        <input
          ref={fileInputRef}
          name="file"
          type="file"
          accept={DOCUMENT_ACCEPT}
          required
          onChange={() => {
            const file = fileInputRef.current?.files?.[0] ?? null;
            if (!file) {
              setError(null);
              setSuccess(null);
              return;
            }
            const validation = validateDocumentFileForBrowser(file);
            setError(validation.ok ? null : validation.error);
            setSuccess(null);
          }}
          className="mt-2 block w-full min-w-0 max-w-full rounded-xl border border-dark-border bg-dark-deep px-3 py-3 text-sm text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-brand-cyan file:px-3 file:py-2 file:font-semibold file:text-slate-950"
        />
      </label>
      <p className="text-xs text-muted">
        PDF, PNG, JPEG, WebP, or text. Max {MAX_DOCUMENT_MB} MB.
      </p>
      {error ? (
        <p className="rounded-lg border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          {success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary min-h-11 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Upload className="h-4 w-4" />
        {pending ? "Uploading..." : "Upload Document"}
      </button>
    </form>
  );
}

async function uploadToSignedUrl(signedUploadUrl: string, file: File) {
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);

  const response = await fetch(signedUploadUrl, {
    method: "PUT",
    headers: { "x-upsert": "false" },
    body,
  }).catch(() => null);
  if (!response) {
    return {
      ok: false as const,
      error: "Network interruption. Check your connection, then try again.",
    };
  }
  if (!response.ok) {
    return {
      ok: false as const,
      error: "Upload failed. Check your connection, then try again.",
    };
  }
  return { ok: true as const };
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
