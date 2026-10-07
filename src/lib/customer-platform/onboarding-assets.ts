import { getSupabaseAdminConfig, supabaseAdminFetch } from "@/lib/supabase-admin";
import {
  extensionFromFilename,
  type OnboardingAssetType,
  validateOnboardingAssetFile,
} from "./onboarding-asset-policy";
import type { OnboardingStepCode } from "./types";

export const CUSTOMER_ASSETS_BUCKET = "customer-assets";

export type OnboardingAssetRow = {
  id: string;
  organization_id: string;
  section: OnboardingStepCode;
  asset_type: OnboardingAssetType | string;
  bucket: string;
  object_path: string;
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  created_at: string;
};

export type SignedOnboardingAsset = OnboardingAssetRow & {
  viewUrl: string | null;
  downloadUrl: string | null;
};

export async function listSignedOnboardingAssets(organizationId: string) {
  const result = await supabaseAdminFetch<OnboardingAssetRow[]>(
    "organization_onboarding_assets",
    {
      query: {
        select:
          "id,organization_id,section,asset_type,bucket,object_path,filename,mime_type,size_bytes,uploaded_by,uploaded_at,created_at",
        organization_id: `eq.${organizationId}`,
        order: "created_at.desc",
        limit: 100,
      },
    },
  );
  if (!result.ok) return [];

  return Promise.all(result.data.map(signAssetUrls));
}

export async function uploadOnboardingAsset({
  organizationId,
  userId,
  assetType,
  file,
}: {
  organizationId: string;
  userId: string;
  assetType: OnboardingAssetType;
  file: File;
}) {
  const validation = validateOnboardingAssetFile(assetType, file);
  if (!validation.ok) return validation;

  const config = getSupabaseAdminConfig();
  if (!config) {
    return {
      ok: false as const,
      error: "Supabase storage is not configured.",
    };
  }

  if (assetType === "logo" || assetType === "headshot") {
    await removeExistingAssetsForType({ organizationId, assetType });
  }

  const now = new Date();
  const extension = extensionFromFile(file);
  const objectPath = [
    organizationId,
    "brand",
    assetDirectory(assetType),
    `${now.getTime()}-${crypto.randomUUID()}.${extension}`,
  ].join("/");

  console.info("onboarding_asset_upload_attempt", {
    assetType,
    fileSizeBytes: file.size,
    mimeType: file.type || "unknown",
    pathPattern: `<organization-id>/brand/${assetDirectory(assetType)}/<generated-file>`,
  });

  const upload = await uploadStorageObject({
    url: config.url,
    serviceRoleKey: config.serviceRoleKey,
    bucket: CUSTOMER_ASSETS_BUCKET,
    objectPath,
    file,
  });
  if (!upload.ok) {
    console.warn("onboarding_asset_storage_upload_failed", {
      assetType,
      fileSizeBytes: file.size,
      mimeType: file.type || "unknown",
      error: upload.error,
    });
    return upload;
  }

  const inserted = await supabaseAdminFetch<null>(
    "organization_onboarding_assets",
    {
      method: "POST",
      body: {
        organization_id: organizationId,
        section: "brand",
        asset_type: assetType,
        bucket: CUSTOMER_ASSETS_BUCKET,
        object_path: objectPath,
        filename: safeFilename(file.name),
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: userId,
        uploaded_at: now.toISOString(),
      },
      prefer: "returning=minimal",
    },
  );
  if (!inserted.ok) {
    console.warn("onboarding_asset_metadata_insert_failed", {
      assetType,
      fileSizeBytes: file.size,
      mimeType: file.type || "unknown",
      error: inserted.error,
    });
    return inserted;
  }

  return { ok: true as const };
}

export async function removeOnboardingAsset({
  organizationId,
  assetId,
}: {
  organizationId: string;
  assetId: string;
}) {
  const existing = await supabaseAdminFetch<OnboardingAssetRow[]>(
    "organization_onboarding_assets",
    {
      query: {
        select:
          "id,organization_id,section,asset_type,bucket,object_path,filename,mime_type,size_bytes,uploaded_by,uploaded_at,created_at",
        id: `eq.${assetId}`,
        organization_id: `eq.${organizationId}`,
        limit: 1,
      },
    },
  );
  if (!existing.ok) return existing;
  const asset = existing.data[0];
  if (!asset) {
    return { ok: false as const, error: "Asset not found.", status: 404 };
  }

  await deleteStorageObjects(asset.bucket, [asset.object_path]);
  return supabaseAdminFetch<null>("organization_onboarding_assets", {
    method: "DELETE",
    query: {
      id: `eq.${assetId}`,
      organization_id: `eq.${organizationId}`,
    },
    prefer: "returning=minimal",
  });
}

export async function signAssetUrls(
  asset: OnboardingAssetRow,
): Promise<SignedOnboardingAsset> {
  const signed = await createSignedStorageUrl(asset.bucket, asset.object_path);
  const downloadUrl = signed
    ? `${signed}${signed.includes("?") ? "&" : "?"}download=${encodeURIComponent(
        asset.filename || "download",
      )}`
    : null;

  return {
    ...asset,
    viewUrl: signed,
    downloadUrl,
  };
}

export function isPreviewableImage(mimeType: string | null) {
  return Boolean(mimeType && /^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(mimeType));
}

async function removeExistingAssetsForType({
  organizationId,
  assetType,
}: {
  organizationId: string;
  assetType: OnboardingAssetType;
}) {
  const existing = await supabaseAdminFetch<OnboardingAssetRow[]>(
    "organization_onboarding_assets",
    {
      query: {
        select:
          "id,organization_id,section,asset_type,bucket,object_path,filename,mime_type,size_bytes,uploaded_by,uploaded_at,created_at",
        organization_id: `eq.${organizationId}`,
        section: "eq.brand",
        asset_type: `eq.${assetType}`,
      },
    },
  );
  if (!existing.ok || !existing.data.length) return;
  await deleteStorageObjects(
    CUSTOMER_ASSETS_BUCKET,
    existing.data.map((asset) => asset.object_path),
  );
  await supabaseAdminFetch<null>("organization_onboarding_assets", {
    method: "DELETE",
    query: {
      organization_id: `eq.${organizationId}`,
      section: "eq.brand",
      asset_type: `eq.${assetType}`,
    },
    prefer: "returning=minimal",
  });
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

async function deleteStorageObjects(bucket: string, objectPaths: string[]) {
  const config = getSupabaseAdminConfig();
  if (!config || !objectPaths.length) return;

  await fetch(`${config.url}/storage/v1/object/${encodeURIComponent(bucket)}`, {
    method: "DELETE",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: objectPaths }),
  }).catch(() => null);
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

function assetDirectory(assetType: OnboardingAssetType) {
  switch (assetType) {
    case "logo":
      return "logo";
    case "headshot":
      return "headshots";
    case "brand_photo":
      return "photos";
  }
}

function extensionFromFile(file: File) {
  return extensionFromFilename(file.name);
}

function safeFilename(value: string) {
  const cleaned = value
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 160);
  return cleaned || "upload";
}

function encodeObjectPath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}
