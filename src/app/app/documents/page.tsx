import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FileDown, FileText, Upload } from "lucide-react";
import {
  DOCUMENT_ACCEPT,
  archiveCustomerDocument,
  documentCategoryLabel,
  listCustomerDocuments,
  listDocumentRequests,
  type CustomerDocumentCategory,
  uploadCustomerDocument,
} from "@/lib/customer-platform/documents";
import { requireCustomerContext } from "@/lib/customer-platform/store";

export const dynamic = "force-dynamic";

const categories: CustomerDocumentCategory[] = [
  "agreements",
  "invoices",
  "receipts",
  "brand_assets",
  "mls_brokerage",
  "business_documents",
  "other",
];

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCustomerContext();
  const query = (await searchParams) ?? {};
  const [documents, requests] = await Promise.all([
    listCustomerDocuments({ organizationId: context.organization.id }),
    listDocumentRequests(context.organization.id),
  ]);
  const openRequests = requests.filter((request) => request.status === "open");
  const uploadNotice = stringParam(query.upload);

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-dark-border bg-dark-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
          Documents
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-primary">
          Documents for {context.organization.name}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Download agreements, receipts, invoices, and shared launch documents.
          You can also upload requested business documents directly to Opzix.
        </p>
        {uploadNotice === "saved" ? (
          <p className="mt-5 rounded-lg border border-emerald-300/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
            Document uploaded.
          </p>
        ) : uploadNotice === "failed" ? (
          <p className="mt-5 rounded-lg border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
            Document upload failed. Check the file type and size, then try again.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-dark-border bg-dark-card p-5">
          <h2 className="text-xl font-bold text-primary">Upload Document</h2>
          <form action={uploadDocumentAction} className="mt-5 grid gap-4">
            <label className="text-sm font-semibold text-secondary">
              Document request
              <select
                name="request_id"
                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
              >
                <option value="">General upload</option>
                {openRequests.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-secondary">
              Category
              <select
                name="category"
                defaultValue="business_documents"
                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {documentCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-secondary">
              Title
              <input
                name="title"
                required
                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
                placeholder="Broker authorization, W-9, logo file..."
              />
            </label>
            <label className="text-sm font-semibold text-secondary">
              File
              <input
                name="file"
                type="file"
                accept={DOCUMENT_ACCEPT}
                required
                className="mt-2 block w-full rounded-xl border border-dark-border bg-dark-deep px-3 py-3 text-sm text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-brand-cyan file:px-3 file:py-2 file:font-semibold file:text-slate-950"
              />
            </label>
            <button type="submit" className="btn btn-primary min-h-11">
              <Upload className="h-4 w-4" />
              Upload Document
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-card p-5">
          <h2 className="text-xl font-bold text-primary">Requested Documents</h2>
          {openRequests.length ? (
            <div className="mt-4 grid gap-3">
              {openRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-amber-300/25 bg-amber-400/[0.06] p-4"
                >
                  <p className="font-bold text-primary">{request.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-amber-100">
                    {documentCategoryLabel(request.category)}
                  </p>
                  {request.message ? (
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      {request.message}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Opzix does not need any additional documents from you right now.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-dark-border bg-dark-card p-5">
        <h2 className="text-xl font-bold text-primary">Shared Documents</h2>
        {documents.ok && documents.data.length ? (
          <div className="mt-4 grid gap-3">
            {documents.data.map((document) => (
              <div
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dark-border bg-white/[0.025] p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-brand-cyan" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-primary">
                      {document.title}
                    </p>
                    <p className="text-xs text-secondary">
                      {documentCategoryLabel(document.category)} ·{" "}
                      {formatDate(document.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {document.viewUrl ? (
                    <a
                      href={document.viewUrl}
                      className="text-sm font-semibold text-brand-cyan"
                    >
                      View
                    </a>
                  ) : null}
                  {document.downloadUrl ? (
                    <a
                      href={document.downloadUrl}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan"
                    >
                      <FileDown className="h-4 w-4" />
                      Download
                    </a>
                  ) : null}
                  {document.source === "customer" ? (
                    <form action={archiveDocumentAction}>
                      <input type="hidden" name="document_id" value={document.id} />
                      <button
                        type="submit"
                        className="text-sm font-semibold text-amber-100"
                      >
                        Archive
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No documents have been shared yet.
          </p>
        )}
      </section>
    </div>
  );
}

async function uploadDocumentAction(formData: FormData) {
  "use server";

  const context = await requireCustomerContext();
  const category = stringField(formData, "category");
  const requestId = stringField(formData, "request_id");
  const title = stringField(formData, "title");
  const file = formData.get("file");
  if (!isDocumentCategory(category) || title.length < 2 || !(file instanceof File)) {
    redirect("/app/documents?upload=failed");
  }

  const uploaded = await uploadCustomerDocument({
    organizationId: context.organization.id,
    userId: context.user.id,
    source: "customer",
    title,
    category,
    visibility: "customer_visible",
    file,
    requestId: requestId || undefined,
  });
  revalidatePath("/app/documents");
  redirect(`/app/documents?upload=${uploaded.ok ? "saved" : "failed"}`);
}

async function archiveDocumentAction(formData: FormData) {
  "use server";

  const context = await requireCustomerContext();
  const documentId = stringField(formData, "document_id");
  if (!isUuid(documentId)) redirect("/app/documents?upload=failed");

  const archived = await archiveCustomerDocument({
    organizationId: context.organization.id,
    documentId,
    source: "customer",
  });
  revalidatePath("/app/documents");
  redirect(`/app/documents?upload=${archived.ok ? "saved" : "failed"}`);
}

function isDocumentCategory(value: string): value is CustomerDocumentCategory {
  return categories.includes(value as CustomerDocumentCategory);
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not dated";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}
