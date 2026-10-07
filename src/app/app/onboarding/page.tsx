import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Circle,
  Clock,
  Lock,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import OnboardingAssetUploadForm from "@/components/customer/OnboardingAssetUploadForm";
import OnboardingFormActions from "@/components/customer/OnboardingFormActions";
import { customerGreeting } from "@/lib/customer-platform/greeting";
import {
  nextOnboardingStep,
  normalizeOnboardingStep,
  onboardingDataForStep,
  onboardingSteps,
} from "@/lib/customer-platform/onboarding";
import {
  fieldGroupsForStep,
  type OnboardingFieldConfig,
} from "@/lib/customer-platform/onboarding-schema";
import {
  isPreviewableImage,
  listSignedOnboardingAssets,
  removeOnboardingAsset,
  uploadOnboardingAsset,
  type SignedOnboardingAsset,
} from "@/lib/customer-platform/onboarding-assets";
import {
  isOnboardingAssetType,
  type OnboardingAssetType,
} from "@/lib/customer-platform/onboarding-asset-policy";
import {
  listOpenOnboardingInformationRequests,
  requireCustomerContext,
  saveOnboardingSection,
} from "@/lib/customer-platform/store";
import { supabaseAdminFetch } from "@/lib/supabase-admin";
import type {
  OnboardingDataRow,
  OnboardingStepCode,
  OnboardingStatus,
} from "@/lib/customer-platform/types";

export const dynamic = "force-dynamic";

type OnboardingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const context = await requireCustomerContext();
  const params = (await searchParams) ?? {};
  const selectedStep = normalizeOnboardingStep(
    stringParam(params.step) ?? context.onboarding?.current_step,
  );
  const step = onboardingSteps.find((item) => item.code === selectedStep);
  const data = onboardingDataForStep(context.onboardingData, selectedStep);
  const preferredName =
    context.profile?.preferred_name ||
    context.profile?.first_name ||
    context.user.email.split("@")[0];
  const timezone = context.profile?.timezone || context.organization.timezone;
  const greeting = preferredName
    ? customerGreeting({ preferredName, timezone })
    : "Welcome back.";
  const completion = context.onboarding?.completion_percent ?? 0;
  const stepStates = buildStepStates({
    currentStep: selectedStep,
    storedCurrentStep: context.onboarding?.current_step,
    onboardingStatus: context.onboarding?.status,
    completionPercent: completion,
    onboardingData: context.onboardingData,
  });
  const currentStepState = stepStates.find((item) => item.code === selectedStep);
  const feedback = feedbackFromParams(params);
  const assetUploadFeedback = assetUploadFeedbackFromParams(params);
  const mlsData = onboardingDataForStep(context.onboardingData, "mls_idx");
  const connectionData = onboardingDataForStep(context.onboardingData, "connections");
  const informationRequests = await listOpenOnboardingInformationRequests(
    context.organization.id,
  );
  const assets =
    selectedStep === "brand"
      ? await listSignedOnboardingAssets(context.organization.id)
      : [];

  return (
    <div className="grid gap-6 lg:gap-8">
      <section className="rounded-xl border border-dark-border bg-dark-card p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Guided Onboarding
            </p>
            <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
              {greeting}
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-secondary">
              Let&apos;s get your Opzix platform ready for launch.
            </p>
            <p className="mt-2 max-w-3xl leading-7 text-secondary">
              Complete the remaining details so our team can configure your brand,
              IDX experience, integrations, and growth tools.
            </p>
          </div>
          <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              Onboarding Progress
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-extrabold text-primary">
                {completion}%
              </span>
              <span className="pb-1 text-sm text-secondary">
                {statusLabel(currentStepState?.status ?? "not_started")}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-dark-deep">
              <div
                className="h-full rounded-full bg-brand-cyan"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard
          title="Next Required Action"
          value={nextActionForStep(selectedStep)}
          detail="Tell us about your brokerage, market, current tools, and growth goals."
          icon="clock"
        />
        <StatusCard
          title="MLS & IDX"
          value={mlsStatusCopy(mlsData)}
          detail="IDX activation depends on MLS, brokerage, attribution, display, and licensing approval."
          icon="shield"
        />
        <StatusCard
          title="Connections"
          value={connectionsStatusCopy(connectionData)}
          detail="Your calendar, email, domain, and other tools have not been connected yet."
          icon="check"
        />
      </section>

      {informationRequests.length ? (
        <section className="rounded-xl border border-amber-300/35 bg-amber-400/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
            Action Needed
          </p>
          <h2 className="mt-2 text-xl font-bold text-primary">
            Opzix needs a little more information to continue your launch.
          </h2>
          <div className="mt-4 grid gap-3">
            {informationRequests.map((request) => {
              const items = requestedItems(request.requested_items);
              const targetStep = items[0]?.section ?? selectedStep;
              return (
                <div
                  key={request.id}
                  className="rounded-xl border border-amber-300/25 bg-dark-card/60 p-4"
                >
                  {request.message ? (
                    <p className="text-sm leading-6 text-amber-50">
                      {request.message}
                    </p>
                  ) : null}
                  {items.length ? (
                    <ul className="mt-3 grid gap-2 text-sm text-secondary">
                      {items.map((item, index) => (
                        <li key={`${request.id}-${index}`}>
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Link
                    href={`/app/onboarding?step=${targetStep}`}
                    className="mt-4 inline-flex text-sm font-semibold text-brand-cyan"
                  >
                    Update requested information
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="rounded-xl border border-dark-border bg-dark-card p-5 xl:sticky xl:top-32 xl:self-start">
          <h2 className="text-lg font-bold text-primary">Steps</h2>
          <div className="mt-5 grid gap-2">
            {stepStates.map((item) => {
              const isActive = item.code === selectedStep;
              const Icon = stepStatusIcon(item.status);

              return (
                <a
                  key={item.code}
                  href={`/app/onboarding?step=${item.code}`}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    isActive
                      ? "border-brand-cyan bg-brand-cyan/10 text-primary"
                      : "border-dark-border bg-white/[0.025] text-secondary hover:border-brand-cyan/50 hover:text-primary"
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 ${stepStatusColor(item.status)}`} />
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.shortTitle}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {statusLabel(item.status)}
                      </span>
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </aside>

        <article className="min-w-0 overflow-hidden rounded-xl border border-dark-border bg-dark-card p-6 md:p-8">
          {feedback === "error" ? (
            <div className="mb-6 rounded-lg border border-red-300/30 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
              We could not save this section. Please try again.
            </div>
          ) : null}
          {feedback === "saved" ? (
            <div className="mb-6 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 p-4 text-sm leading-6 text-brand-cyan">
              Your onboarding details have been saved.
            </div>
          ) : null}
          {feedback === "submitted" ? (
            <div className="mb-6 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 p-4 text-sm leading-6 text-brand-cyan">
              <p className="font-bold text-primary">Onboarding submitted</p>
              <p className="mt-1">
                Opzix has received your information and will review it. Your
                website launch progress and any next steps will appear here.
              </p>
            </div>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            {step?.shortTitle}
          </p>
          <h2 className="mt-3 text-2xl font-extrabold text-primary">
            {step?.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-secondary">
            {step?.description}
          </p>
          <OnboardingStepForm
            stepCode={selectedStep}
            data={data}
            feedback={feedback}
            assetUploadFeedback={assetUploadFeedback}
            assets={assets.filter((asset) => asset.section === selectedStep)}
          />
        </article>
      </section>

      <LaunchSupportCard />
    </div>
  );
}

function StatusCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: "clock" | "shield" | "check";
}) {
  const Icon = icon === "clock" ? Clock : icon === "shield" ? ShieldCheck : Check;

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-5">
      <Icon className="h-5 w-5 text-brand-cyan" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
        {title}
      </p>
      <h3 className="mt-2 text-xl font-bold text-primary">{value}</h3>
      <p className="mt-2 text-sm leading-6 text-secondary">{detail}</p>
    </div>
  );
}

function OnboardingStepForm({
  stepCode,
  data,
  feedback,
  assetUploadFeedback,
  assets,
}: {
  stepCode: OnboardingStepCode;
  data: Record<string, unknown>;
  feedback?: "saved" | "submitted" | "error";
  assetUploadFeedback: AssetUploadFeedback | null;
  assets: SignedOnboardingAsset[];
}) {
  return (
    <div className="mt-8 grid gap-8">
      {stepCode === "brand" ? (
        <BrandAssetUploads assets={assets} uploadFeedback={assetUploadFeedback} />
      ) : null}
      <form action={saveStepAction} className="grid gap-8">
        <input type="hidden" name="section" value={stepCode} />
        {fieldGroupsForStep(stepCode).map((group) => (
          <section key={group.title} className="grid gap-5">
            <div>
              <h3 className="text-lg font-bold text-primary">{group.title}</h3>
              <p className="mt-1 text-sm leading-6 text-secondary">
                {group.helper}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {group.fields.map((field) => (
                <FormField key={field.name} field={field} data={data} />
              ))}
            </div>
          </section>
        ))}
        {stepCode === "mls_idx" ? (
          <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            IDX activation is subject to applicable MLS, brokerage, attribution,
            display, and licensing approval. Submitting onboarding does not
            guarantee MLS approval.
          </div>
        ) : null}
        {stepCode === "review" ? (
          <input type="hidden" name="submit_onboarding" value="1" />
        ) : null}
        <OnboardingFormActions isReviewStep={stepCode === "review"} feedback={feedback} />
      </form>
    </div>
  );
}

type AssetUploadFeedback = {
  assetType: OnboardingAssetType;
  message: string;
};

function BrandAssetUploads({
  assets,
  uploadFeedback,
}: {
  assets: SignedOnboardingAsset[];
  uploadFeedback: AssetUploadFeedback | null;
}) {
  const logo = assets.find((asset) => asset.asset_type === "logo");
  const headshot = assets.find((asset) => asset.asset_type === "headshot");
  const photos = assets.filter((asset) => asset.asset_type === "brand_photo");
  const errorFor = (assetType: OnboardingAssetType) =>
    uploadFeedback?.assetType === assetType ? uploadFeedback.message : null;

  return (
    <section className="grid gap-5">
      <div>
        <h3 className="text-lg font-bold text-primary">Brand Assets</h3>
        <p className="mt-1 text-sm leading-6 text-secondary">
          Upload your logo, professional headshot, and additional brand photos
          directly. Files are stored privately for your Opzix launch team.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AssetUploadCard
          title="Logo"
          helper="PNG, JPG, WEBP, or SVG. Replace anytime."
          assetType="logo"
          asset={logo}
          uploadError={errorFor("logo")}
        />
        <AssetUploadCard
          title="Professional Headshot"
          helper="Use a clear photo suitable for your website and profile."
          assetType="headshot"
          asset={headshot}
          uploadError={errorFor("headshot")}
        />
      </div>
      <div className="rounded-xl border border-dark-border bg-white/[0.025] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h4 className="font-bold text-primary">Additional Brand Photos</h4>
            <p className="mt-1 text-sm leading-6 text-secondary">
              Add website hero candidates, about imagery, community photos, or
              marketing imagery.
            </p>
          </div>
          <OnboardingAssetUploadForm
            action={uploadBrandAssetAction}
            assetType="brand_photo"
            buttonLabel="Upload Photo"
            className="grid gap-2 md:w-72"
            serverError={errorFor("brand_photo")}
          />
        </div>
        {photos.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map((asset) => (
              <AssetPreview key={asset.id} asset={asset} compact />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No additional photos uploaded yet.</p>
        )}
      </div>
    </section>
  );
}

function AssetUploadCard({
  title,
  helper,
  assetType,
  asset,
  uploadError,
}: {
  title: string;
  helper: string;
  assetType: OnboardingAssetType;
  asset?: SignedOnboardingAsset;
  uploadError: string | null;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-white/[0.025] p-4">
      <h4 className="font-bold text-primary">{title}</h4>
      <p className="mt-1 text-sm leading-6 text-secondary">{helper}</p>
      {asset ? <AssetPreview asset={asset} /> : null}
      <OnboardingAssetUploadForm
        action={uploadBrandAssetAction}
        assetType={assetType}
        buttonLabel={asset ? "Replace" : "Upload"}
        serverError={uploadError}
      />
    </div>
  );
}

function AssetPreview({
  asset,
  compact = false,
}: {
  asset: SignedOnboardingAsset;
  compact?: boolean;
}) {
  return (
    <div className="mt-3 rounded-lg border border-dark-border bg-dark-deep p-3">
      {asset.viewUrl && isPreviewableImage(asset.mime_type) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.viewUrl}
          alt=""
          className={`w-full rounded-md border border-dark-border object-contain ${
            compact ? "max-h-32" : "max-h-48"
          }`}
        />
      ) : null}
      <p className="mt-2 truncate text-sm font-semibold text-primary">
        {asset.filename ?? "Uploaded file"}
      </p>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        {asset.viewUrl ? (
          <a href={asset.viewUrl} target="_blank" className="font-semibold text-brand-cyan">
            View
          </a>
        ) : null}
        {asset.downloadUrl ? (
          <a href={asset.downloadUrl} className="font-semibold text-brand-cyan">
            Download
          </a>
        ) : null}
        <form action={removeBrandAssetAction}>
          <input type="hidden" name="asset_id" value={asset.id} />
          <button type="submit" className="font-semibold text-amber-100">
            Remove
          </button>
        </form>
      </div>
    </div>
  );
}

function FormField({
  field,
  data,
}: {
  field: OnboardingFieldConfig;
  data: Record<string, unknown>;
}) {
  const className =
    "mt-2 w-full rounded-lg border border-dark-border bg-dark-deep px-4 text-primary outline-none placeholder:text-muted focus:border-brand-cyan";

  return (
    <label
      className={`text-sm font-semibold text-secondary ${
        field.type === "textarea" ? "md:col-span-2" : ""
      }`}
    >
      {field.label}
      {field.type === "textarea" ? (
        <textarea
          name={field.name}
          defaultValue={customerFacingStringValue(data[field.name])}
          rows={5}
          className={`${className} min-h-32 py-3 leading-6`}
        />
      ) : (
        <input
          name={field.name}
          type={field.type}
          defaultValue={customerFacingStringValue(data[field.name])}
          className={`${className} min-h-12`}
        />
      )}
    </label>
  );
}

async function saveStepAction(formData: FormData) {
  "use server";

  const context = await requireCustomerContext();
  const section = normalizeOnboardingStep(stringField(formData, "section"));
  const data: Record<string, string | string[]> = {};

  for (const [key, value] of formData.entries()) {
    if (key === "section" || key === "submit_onboarding" || key === "save_intent") {
      continue;
    }
    if (typeof value !== "string") continue;
    data[key] = value.trim();
  }

  const saveIntent = stringField(formData, "save_intent");
  const saveForLater = saveIntent === "later";
  const submit = stringField(formData, "submit_onboarding") === "1" && !saveForLater;
  const result = await saveOnboardingSection({
    organizationId: context.organization.id,
    submittedByUserId: context.user.id,
    section,
    data,
    submit,
  });

  if (!result.ok) {
    redirect(`/app/onboarding?step=${section}&error=${encodeURIComponent(result.error)}`);
  }

  if (section === "account") {
    await saveAccountProfileFields({
      userId: context.user.id,
      organizationId: context.organization.id,
      data,
    });
  }

  if (saveForLater) {
    redirect(`/app/onboarding?step=${section}&saved=1`);
  }

  redirect(
    submit
      ? "/app/onboarding?step=review&submitted=1"
      : `/app/onboarding?step=${nextOnboardingStep(section)}&saved=1`,
  );
}

async function uploadBrandAssetAction(formData: FormData) {
  "use server";

  const context = await requireCustomerContext();
  const assetType = stringField(formData, "asset_type");
  const file = formData.get("asset_file");

  if (!isOnboardingAssetType(assetType)) {
    redirect(
      `/app/onboarding?step=brand&error=${encodeURIComponent(
        "Choose a supported image file.",
      )}`,
    );
  }

  if (!(file instanceof File)) {
    redirectAssetUploadError(assetType, "Choose a file to upload.");
  }

  const result = await uploadOnboardingAsset({
    organizationId: context.organization.id,
    userId: context.user.id,
    assetType,
    file,
  });

  if (!result.ok) {
    redirectAssetUploadError(assetType, customerAssetUploadError(result.error));
  }

  redirect("/app/onboarding?step=brand&saved=1");
}

async function removeBrandAssetAction(formData: FormData) {
  "use server";

  const context = await requireCustomerContext();
  const assetId = stringField(formData, "asset_id");
  if (!isUuid(assetId)) {
    redirect("/app/onboarding?step=brand&error=asset");
  }

  const result = await removeOnboardingAsset({
    organizationId: context.organization.id,
    assetId,
  });
  if (!result.ok) {
    redirect(
      `/app/onboarding?step=brand&error=${encodeURIComponent(result.error)}`,
    );
  }

  redirect("/app/onboarding?step=brand&saved=1");
}

async function saveAccountProfileFields({
  userId,
  organizationId,
  data,
}: {
  userId: string;
  organizationId: string;
  data: Record<string, string | string[]>;
}) {
  const preferredName = stringRecordValue(data.preferred_name);
  const timezone = stringRecordValue(data.timezone);
  const phone = stringRecordValue(data.phone);
  const updatedAt = new Date().toISOString();

  await supabaseAdminFetch<null>("profiles", {
    method: "POST",
    query: { on_conflict: "user_id" },
    body: {
      user_id: userId,
      preferred_name: preferredName || null,
      timezone: timezone || null,
      phone: phone || null,
      updated_at: updatedAt,
    },
    prefer: "resolution=merge-duplicates,returning=minimal",
  });

  if (timezone) {
    await supabaseAdminFetch<null>("organizations", {
      method: "PATCH",
      query: { id: `eq.${organizationId}` },
      body: {
        timezone,
        updated_at: updatedAt,
      },
      prefer: "returning=minimal",
    });
  }
}

type StepStatus =
  | "completed"
  | "in_progress"
  | "not_started"
  | "needs_review"
  | "waiting_on_opzix";

type StepState = {
  code: OnboardingStepCode;
  shortTitle: string;
  status: StepStatus;
};

function buildStepStates({
  currentStep,
  storedCurrentStep,
  onboardingStatus,
  completionPercent,
  onboardingData,
}: {
  currentStep: OnboardingStepCode;
  storedCurrentStep?: OnboardingStepCode;
  onboardingStatus?: OnboardingStatus;
  completionPercent: number;
  onboardingData: OnboardingDataRow[];
}): StepState[] {
  const sourceStep = storedCurrentStep ?? currentStep;
  const currentIndex = Math.max(
    0,
    onboardingSteps.findIndex((step) => step.code === sourceStep),
  );
  const mlsData = onboardingDataForStep(onboardingData, "mls_idx");

  return onboardingSteps.map((step, index) => {
    let status: StepStatus = "not_started";

    if (onboardingStatus === "reviewed") {
      status = "completed";
    } else if (onboardingStatus === "submitted") {
      status = step.code === "review" ? "needs_review" : "completed";
    } else if (index < currentIndex) {
      status = "completed";
    } else if (index === currentIndex) {
      status = "in_progress";
    } else {
      status = "not_started";
    }

    if (
      step.code === "mls_idx" &&
      status === "in_progress" &&
      isWaitingOnOpzix(mlsData, completionPercent)
    ) {
      status = "waiting_on_opzix";
    }

    return {
      code: step.code,
      shortTitle: step.shortTitle,
      status,
    };
  });
}

function isWaitingOnOpzix(
  mlsData: Record<string, unknown>,
  completionPercent: number,
) {
  const approval = stringValue(mlsData.approval_status).toLowerCase();
  return (
    completionPercent >= 60 &&
    ["approval", "queued", "review", "waiting"].some((word) =>
      approval.includes(word),
    )
  );
}

function stepStatusIcon(status: StepStatus) {
  switch (status) {
    case "completed":
      return Check;
    case "in_progress":
      return Clock;
    case "needs_review":
      return Clock;
    case "waiting_on_opzix":
      return Lock;
    case "not_started":
      return Circle;
  }
}

function stepStatusColor(status: StepStatus) {
  switch (status) {
    case "completed":
      return "text-brand-cyan";
    case "in_progress":
      return "text-brand-cyan";
    case "needs_review":
      return "text-amber-200";
    case "waiting_on_opzix":
      return "text-amber-200";
    case "not_started":
      return "text-muted";
  }
}

function statusLabel(status: StepStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    case "needs_review":
      return "Needs review";
    case "waiting_on_opzix":
      return "Waiting on Opzix";
    case "not_started":
      return "Not started";
  }
}

function nextActionForStep(stepCode: OnboardingStepCode) {
  switch (stepCode) {
    case "account":
      return "Confirm your account details";
    case "business":
      return "Complete your business profile";
    case "brand":
      return "Share your brand details";
    case "connections":
      return "Review your connected tools";
    case "mls_idx":
      return "Prepare MLS & IDX details";
    case "growth_goals":
      return "Prioritize your growth goals";
    case "review":
      return "Review your launch details";
  }
}

function mlsStatusCopy(data: Record<string, unknown>) {
  const approval = stringValue(data.approval_status).toLowerCase();
  if (["queued", "approval", "review", "waiting"].some((word) => approval.includes(word))) {
    return "We are preparing this for launch-team review.";
  }
  return "We are collecting the information needed to begin approval and configuration.";
}

function connectionsStatusCopy(data: Record<string, unknown>) {
  const values = [
    data.google_calendar_status,
    data.email_provider_status,
    data.crm_status,
    data.domain_provider,
  ]
    .map(stringValue)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (["connected", "ready", "requested"].some((word) => values.includes(word))) {
    return "We are reviewing the tools you want connected for launch.";
  }
  return "Your calendar, email, domain, and other tools have not been connected yet.";
}

function feedbackFromParams(
  params: Record<string, string | string[] | undefined>,
): "saved" | "submitted" | "error" | undefined {
  if (stringParam(params.error)) return "error";
  if (stringParam(params.submitted) === "1") return "submitted";
  if (stringParam(params.saved) === "1") return "saved";
  return undefined;
}

function assetUploadFeedbackFromParams(
  params: Record<string, string | string[] | undefined>,
): AssetUploadFeedback | null {
  const assetType = stringParam(params.asset_type);
  const message = stringParam(params.asset_error);
  if (!assetType || !message || !isOnboardingAssetType(assetType)) {
    return null;
  }
  return {
    assetType,
    message: customerAssetUploadError(message),
  };
}

function redirectAssetUploadError(
  assetType: OnboardingAssetType,
  message: string,
): never {
  redirect(
    `/app/onboarding?step=brand&asset_type=${assetType}&asset_error=${encodeURIComponent(
      customerAssetUploadError(message),
    )}`,
  );
}

function customerAssetUploadError(message: string) {
  if (
    message.startsWith("This image is too large.") ||
    message.startsWith("This file type isn't supported.") ||
    message.startsWith("Choose a file")
  ) {
    return message;
  }
  return "Upload failed. We couldn't upload this image. Please try again.";
}

function LaunchSupportCard() {
  return (
    <section className="rounded-xl border border-dark-border bg-dark-card p-6 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-brand-cyan" />
            <h2 className="text-xl font-bold text-primary">Need help?</h2>
          </div>
          <p className="mt-3 leading-7 text-secondary">
            Your Opzix launch team can help you complete onboarding and answer
            questions about your plan, IDX setup, or integrations.
          </p>
        </div>
        <Link href="/app/support" className="btn btn-secondary min-h-12 w-full md:w-auto">
          Contact Launch Support
        </Link>
      </div>
    </section>
  );
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function customerFacingStringValue(value: unknown) {
  const text = stringValue(value);
  if (
    /\bqa\b/i.test(text) ||
    /prd-016/i.test(text) ||
    /placeholder/i.test(text)
  ) {
    return "";
  }
  return text;
}

function stringRecordValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function requestedItems(value: unknown): Array<{
  label: string;
  section: OnboardingStepCode;
}> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") {
        return { label: item, section: "review" as const };
      }
      if (typeof item !== "object" || item === null) return null;
      const record = item as Record<string, unknown>;
      const label = typeof record.label === "string" ? record.label : "";
      const section = normalizeOnboardingStep(
        typeof record.section === "string" ? record.section : "review",
      );
      return label ? { label, section } : null;
    })
    .filter(
      (item): item is { label: string; section: OnboardingStepCode } =>
        item !== null,
    );
}
