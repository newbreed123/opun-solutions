import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminPasscodeForm } from "@/components/admin/AdminPasscodeForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getCustomerAdminOnboardingReview,
  type OnboardingReviewState,
  type SignedOnboardingAsset,
} from "@/lib/customer-platform/admin-onboarding";
import {
  flattenedOnboardingFields,
  mlsReadinessRequirements,
  onboardingSectionSchema,
} from "@/lib/customer-platform/onboarding-schema";
import { onboardingDataForStep } from "@/lib/customer-platform/onboarding";
import { supabaseAdminFetch } from "@/lib/supabase-admin";
import type { OnboardingDataRow, OnboardingStepCode } from "@/lib/customer-platform/types";

export const dynamic = "force-dynamic";

type AdminOnboardingPageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const REVIEW_STATES: OnboardingReviewState[] = [
  "submitted",
  "under_review",
  "information_requested",
  "ready_for_implementation",
  "approved_for_launch_work",
];

export default async function AdminOnboardingPage({
  params,
  searchParams,
}: AdminOnboardingPageProps) {
  const { organizationId } = await params;
  const query = (await searchParams) ?? {};
  const configuredPasscode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const authenticated = await isAdminAuthenticated();

  if (!configuredPasscode || !authenticated) {
    return (
      <AdminShell showLogout={false}>
        <div className="mx-auto max-w-xl rounded-2xl border border-dark-border bg-dark-card p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            OPZIX ADMIN
          </p>
          <h1 className="mt-3 text-3xl font-bold text-primary">
            Customer Onboarding
          </h1>
          <p className="mt-3 text-secondary">
            Enter the internal passcode to view onboarding submissions.
          </p>
          <AdminPasscodeForm
            title="Internal Passcode"
            description="Enter the internal passcode to view onboarding submissions."
            submitLabel="Continue"
          />
        </div>
      </AdminShell>
    );
  }

  if (!isUuid(organizationId)) notFound();
  const review = await getCustomerAdminOnboardingReview(organizationId);
  if (!review) notFound();

  const saved = stringParam(query.saved);
  const dataRows = review.onboardingData;
  const readiness = buildMlsReadiness(dataRows);
  const openRequests = review.requests.filter((request) => request.status === "open");
  const reviewStatus =
    review.review?.review_status ??
    (review.customer.onboarding?.status === "submitted" ? "submitted" : null);

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/opzix-admin/customers/${organizationId}`}
          className="text-sm font-semibold text-brand-cyan hover:underline"
        >
          Back to Customer Hub
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
              Onboarding Review
            </p>
            <h1 className="mt-2 text-3xl font-bold text-primary">
              {review.customer.organization.name}
            </h1>
            <p className="mt-2 text-secondary">
              {review.customer.customerName} · {review.customer.invitation?.email ?? "No email"}
            </p>
          </div>
          <div className="rounded-xl border border-dark-border bg-dark-card p-4 text-sm text-secondary">
            <p>
              Original submission:{" "}
              <span className="font-semibold text-primary">
                {formatOptionalDateTime(
                  review.review?.original_submitted_at ??
                    review.customer.onboarding?.submitted_at,
                )}
              </span>
            </p>
            <p className="mt-1">
              Last customer update:{" "}
              <span className="font-semibold text-primary">
                {formatOptionalDateTime(
                  review.review?.last_customer_update_at ??
                    review.customer.onboarding?.updated_at,
                )}
              </span>
            </p>
            <p className="mt-1">
              Current review status:{" "}
              <span className="font-semibold text-primary">
                {reviewStatus ? reviewStatus.replaceAll("_", " ") : "not started"}
              </span>
            </p>
          </div>
        </div>

        {saved ? (
          <p className="mt-6 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            Onboarding review update saved.
          </p>
        ) : null}

        {review.missingTables.length ? (
          <div className="mt-6 rounded-xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            Apply the PRD-016D admin review migration before using notes,
            request-information, or uploaded-asset review. Missing:{" "}
            {review.missingTables.join(", ")}.
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Onboarding"
            value={`${review.customer.onboarding?.completion_percent ?? 0}%`}
            detail={`${review.customer.onboarding?.status ?? "not_started"} · ${review.customer.onboarding?.current_step ?? "account"}`}
          />
          <SummaryCard
            title="MLS / IDX Application"
            value={`${readiness.received} of ${readiness.total} received`}
            detail={readiness.ready ? "Ready to Submit" : "Not Ready"}
          />
          <SummaryCard
            title="Action Requests"
            value={String(openRequests.length)}
            detail="Open requests shown to this customer only."
          />
        </section>

        <section className="mt-8 rounded-2xl border border-dark-border bg-dark-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-primary">
                MLS / IDX Application Readiness
              </h2>
              <p className="mt-2 text-sm text-secondary">
                Readiness means Opzix has the information needed to begin or
                continue the application process. This is not MLS approval.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                readiness.ready
                  ? "bg-emerald-400/10 text-emerald-100"
                  : "bg-amber-400/10 text-amber-100"
              }`}
            >
              {readiness.ready ? "Ready to Submit" : "Not Ready"}
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {readiness.items.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-dark-border bg-white/[0.025] p-3 text-sm"
              >
                <span className={item.present ? "text-emerald-100" : "text-amber-100"}>
                  {item.present ? "✓" : "⚠"} {item.label}
                </span>
                {!item.present ? (
                  <Link
                    href={`/app/onboarding?step=${item.section}`}
                    className="ml-2 text-xs font-semibold text-brand-cyan"
                  >
                    {item.source === "customer_optional"
                      ? "optional if known"
                      : "customer section"}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-6">
            {onboardingSectionSchema.map((section) => (
              <OnboardingSection
                key={section.code}
                section={section}
                data={onboardingDataForStep(dataRows, section.code)}
                assets={review.assets.filter((asset) => asset.section === section.code)}
              />
            ))}
          </div>

          <aside className="grid gap-6 self-start xl:sticky xl:top-24">
            <section className="rounded-2xl border border-dark-border bg-dark-card p-5">
              <h2 className="text-lg font-bold text-primary">Review State</h2>
              <form action={saveReviewStateAction} className="mt-4 grid gap-3">
                <input type="hidden" name="organization_id" value={organizationId} />
                <select
                  name="review_status"
                  defaultValue={reviewStatus ?? "submitted"}
                  className="min-h-11 rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
                >
                  {REVIEW_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary min-h-11">
                  Save Review State
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-dark-border bg-dark-card p-5">
              <h2 className="text-lg font-bold text-primary">Internal Notes</h2>
              <form action={addInternalNoteAction} className="mt-4 grid gap-3">
                <input type="hidden" name="organization_id" value={organizationId} />
                <textarea
                  name="note"
                  rows={4}
                  placeholder="Need broker signature."
                  className="rounded-xl border border-dark-border bg-dark-deep px-3 py-2 text-primary outline-none placeholder:text-muted focus:border-brand-cyan"
                  required
                />
                <button type="submit" className="btn btn-primary min-h-11">
                  Add Note
                </button>
              </form>
              {review.notes.length ? (
                <ul className="mt-5 grid gap-3">
                  {review.notes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-xl border border-dark-border bg-white/[0.025] p-3 text-sm"
                    >
                      <p className="whitespace-pre-wrap text-secondary">{note.note}</p>
                      <time className="mt-2 block text-xs text-muted">
                        {formatDateTime(note.created_at)}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">No internal notes yet.</p>
              )}
            </section>

            <section className="rounded-2xl border border-dark-border bg-dark-card p-5">
              <h2 className="text-lg font-bold text-primary">
                Request Information
              </h2>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Open requests appear in the customer dashboard and link back to
                the relevant onboarding section.
              </p>
              <form action={requestInformationAction} className="mt-4 grid gap-3">
                <input type="hidden" name="organization_id" value={organizationId} />
                <div className="grid gap-2">
                  {readiness.items
                    .filter((item) => !item.present)
                    .map((item) => (
                      <label
                        key={item.label}
                        className="flex gap-2 rounded-lg border border-dark-border bg-white/[0.025] p-2 text-sm text-secondary"
                      >
                        <input
                          type="checkbox"
                          name="requested_item"
                          value={`${item.section}|${item.label}`}
                          className="mt-1 accent-cyan-400"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                </div>
                <textarea
                  name="custom_request"
                  rows={3}
                  placeholder="Or write what else is missing."
                  className="rounded-xl border border-dark-border bg-dark-deep px-3 py-2 text-primary outline-none placeholder:text-muted focus:border-brand-cyan"
                />
                <button type="submit" className="btn btn-primary min-h-11">
                  Request Information
                </button>
              </form>
              {openRequests.length ? (
                <ul className="mt-5 grid gap-3">
                  {openRequests.map((request) => (
                    <li
                      key={request.id}
                      className="rounded-xl border border-amber-300/25 bg-amber-400/[0.06] p-3 text-sm"
                    >
                      <p className="font-semibold text-amber-100">Open request</p>
                      {request.message ? (
                        <p className="mt-1 text-secondary">{request.message}</p>
                      ) : null}
                      <time className="mt-2 block text-xs text-muted">
                        {formatDateTime(request.created_at)}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </aside>
        </div>

        <details className="mb-10 mt-8 rounded-2xl border border-dark-border bg-dark-card p-5">
          <summary className="cursor-pointer text-sm font-bold text-primary">
            Technical field map and raw values
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 pr-4">Onboarding Step</th>
                  <th className="py-2 pr-4">UI field</th>
                  <th className="py-2 pr-4">Database table</th>
                  <th className="py-2 pr-4">Column / JSON key</th>
                  <th className="py-2 pr-4">Required</th>
                  <th className="py-2 pr-4">Admin-visible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border text-secondary">
                {flattenedOnboardingFields().map((field) => (
                  <tr key={`${field.section}-${field.name}`}>
                    <td className="py-2 pr-4">{field.step}</td>
                    <td className="py-2 pr-4">{field.label}</td>
                    <td className="py-2 pr-4">organization_onboarding_data</td>
                    <td className="py-2 pr-4">data_json.{field.name}</td>
                    <td className="py-2 pr-4">{field.required ? "required" : "optional"}</td>
                    <td className="py-2 pr-4">{field.adminVisible ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </AdminShell>
  );
}

function OnboardingSection({
  section,
  data,
  assets,
}: {
  section: (typeof onboardingSectionSchema)[number];
  data: Record<string, unknown>;
  assets: SignedOnboardingAsset[];
}) {
  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card p-5">
      <h2 className="text-xl font-bold text-primary">{section.adminTitle}</h2>
      <div className="mt-5 grid gap-5">
        {section.groups.map((group) => (
          <div key={group.title}>
            <h3 className="font-semibold text-primary">{group.title}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {group.fields.map((field) => (
                <div
                  key={field.name}
                  className={field.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    {field.label}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg border border-dark-border bg-dark-deep p-3 text-sm leading-6 text-secondary">
                    {displayValue(data[field.name])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {assets.length || section.code === "brand" || section.code === "mls_idx" ? (
        <AssetSection sectionCode={section.code} assets={assets} />
      ) : null}
    </section>
  );
}

function AssetSection({
  sectionCode,
  assets,
}: {
  sectionCode: OnboardingStepCode;
  assets: SignedOnboardingAsset[];
}) {
  const title =
    sectionCode === "brand"
      ? "Uploaded Brand Assets"
      : sectionCode === "mls_idx"
        ? "MLS / Brokerage Documents"
        : "Uploaded Files";

  return (
    <div className="mt-6 border-t border-dark-border pt-5">
      <h3 className="font-semibold text-primary">{title}</h3>
      {assets.length ? (
        <div className="mt-3 grid gap-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-dark-border bg-white/[0.025] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">
                    {asset.filename || asset.asset_type}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {asset.asset_type} · {asset.mime_type ?? "unknown type"} ·{" "}
                    {formatOptionalDateTime(asset.uploaded_at ?? asset.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {asset.viewUrl ? (
                    <a className="text-brand-cyan" href={asset.viewUrl} target="_blank">
                      View
                    </a>
                  ) : null}
                  {asset.downloadUrl ? (
                    <a className="text-brand-cyan" href={asset.downloadUrl}>
                      Download
                    </a>
                  ) : null}
                </div>
              </div>
              {asset.viewUrl && isPreviewableImage(asset.mime_type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.viewUrl}
                  alt=""
                  className="mt-3 max-h-48 rounded-lg border border-dark-border object-contain"
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          No uploaded files have been recorded for this section yet.
        </p>
      )}
    </div>
  );
}

async function saveReviewStateAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const organizationId = stringField(formData, "organization_id");
  const reviewStatus = stringField(formData, "review_status") as OnboardingReviewState;
  if (!isUuid(organizationId) || !REVIEW_STATES.includes(reviewStatus)) {
    throw new Error("Invalid onboarding review update.");
  }
  const now = new Date().toISOString();
  const result = await supabaseAdminFetch<null>(
    "organization_onboarding_reviews",
    {
      method: "POST",
      query: { on_conflict: "organization_id" },
      body: {
        organization_id: organizationId,
        review_status: reviewStatus,
        updated_at: now,
      },
      prefer: "resolution=merge-duplicates,returning=minimal",
    },
  );
  if (!result.ok) throw new Error(result.error);
  await recordAdminOnboardingEvent(organizationId, "onboarding_review_status_updated", {
    reviewStatus,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}/onboarding`);
  redirect(`/opzix-admin/customers/${organizationId}/onboarding?saved=review`);
}

async function addInternalNoteAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const organizationId = stringField(formData, "organization_id");
  const note = stringField(formData, "note");
  if (!isUuid(organizationId) || !note) {
    throw new Error("Invalid onboarding note.");
  }
  const result = await supabaseAdminFetch<null>(
    "organization_onboarding_internal_notes",
    {
      method: "POST",
      body: {
        organization_id: organizationId,
        note,
        created_by: "opzix-admin-session",
      },
      prefer: "returning=minimal",
    },
  );
  if (!result.ok) throw new Error(result.error);
  await recordAdminOnboardingEvent(organizationId, "onboarding_internal_note_added");
  revalidatePath(`/opzix-admin/customers/${organizationId}/onboarding`);
  redirect(`/opzix-admin/customers/${organizationId}/onboarding?saved=note`);
}

async function requestInformationAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const organizationId = stringField(formData, "organization_id");
  if (!isUuid(organizationId)) {
    throw new Error("Invalid onboarding information request.");
  }
  const selectedItems = formData
    .getAll("requested_item")
    .filter((value): value is string => typeof value === "string")
    .map((value) => {
      const [section, label] = value.split("|");
      return {
        section,
        label,
      };
    })
    .filter((item) => item.label && isOnboardingStep(item.section));
  const customRequest = stringField(formData, "custom_request");
  const requestedItems = [
    ...selectedItems,
    ...(customRequest
      ? [{ section: "review", label: customRequest }]
      : []),
  ];
  if (!requestedItems.length) {
    throw new Error("Select or write at least one requested item.");
  }

  const result = await supabaseAdminFetch<null>(
    "organization_onboarding_information_requests",
    {
      method: "POST",
      body: {
        organization_id: organizationId,
        requested_items: requestedItems,
        message:
          "Opzix needs a little more information to continue your launch.",
        created_by: "opzix-admin-session",
      },
      prefer: "returning=minimal",
    },
  );
  if (!result.ok) throw new Error(result.error);

  await supabaseAdminFetch<null>("organization_onboarding_reviews", {
    method: "POST",
    query: { on_conflict: "organization_id" },
    body: {
      organization_id: organizationId,
      review_status: "information_requested",
      updated_at: new Date().toISOString(),
    },
    prefer: "resolution=merge-duplicates,returning=minimal",
  });
  await recordAdminOnboardingEvent(organizationId, "onboarding_information_requested", {
    requestedCount: String(requestedItems.length),
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}/onboarding`);
  revalidatePath(`/app/onboarding`);
  redirect(`/opzix-admin/customers/${organizationId}/onboarding?saved=request`);
}

function buildMlsReadiness(rows: OnboardingDataRow[]) {
  const items = mlsReadinessRequirements.map((requirement) => {
    const sectionData = onboardingDataForStep(rows, requirement.section);
    const present = requirement.keys.some((key) =>
      hasMeaningfulValue(sectionData[key]),
    );
    return { ...requirement, present };
  });
  const requiredItems = items.filter(
    (item) => item.source === "customer_required",
  );
  const received = requiredItems.filter((item) => item.present).length;
  return {
    items,
    received,
    total: requiredItems.length,
    ready: received === requiredItems.length,
  };
}

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-cyan">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
      <p className="mt-2 text-sm text-secondary">{detail}</p>
    </div>
  );
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized onboarding admin action.");
  }
}

async function recordAdminOnboardingEvent(
  organizationId: string,
  eventName: string,
  metadata: Record<string, string> = {},
) {
  const result = await supabaseAdminFetch<null>(
    "customer_account_audit_events",
    {
      method: "POST",
      body: {
        organization_id: organizationId,
        event_name: eventName,
        target_type: "organization_onboarding",
        metadata: { ...metadata, actor: "opzix-admin-session" },
      },
      prefer: "returning=minimal",
    },
  );
  if (!result.ok) throw new Error(result.error);
}

function displayValue(value: unknown) {
  if (!hasMeaningfulValue(value)) return "Not provided";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return "Structured value recorded";
  return String(value);
}

function hasMeaningfulValue(value: unknown) {
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(hasMeaningfulValue);
  }
  return false;
}

function isPreviewableImage(mimeType: string | null) {
  return Boolean(mimeType && /^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(mimeType));
}

function formatOptionalDateTime(value: string | null | undefined) {
  return value ? formatDateTime(value) : "Not recorded";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isOnboardingStep(value: string): value is OnboardingStepCode {
  return onboardingSectionSchema.some((section) => section.code === value);
}
