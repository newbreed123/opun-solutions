export type OnboardingAssetType = "logo" | "headshot" | "brand_photo";

type FileLike = {
  name: string;
  type: string;
  size: number;
};

const MB = 1024 * 1024;

export const ONBOARDING_ASSET_LIMITS: Record<OnboardingAssetType, number> = {
  logo: 5 * MB,
  headshot: 10 * MB,
  brand_photo: 10 * MB,
};

export const ONBOARDING_ASSET_ACCEPT: Record<OnboardingAssetType, string> = {
  logo: "image/png,image/jpeg,image/webp,image/svg+xml",
  headshot: "image/png,image/jpeg,image/webp",
  brand_photo: "image/png,image/jpeg,image/webp",
};

const ASSET_TYPE_LABELS: Record<OnboardingAssetType, string> = {
  logo: "logo",
  headshot: "headshot",
  brand_photo: "brand photo",
};

const ALLOWED_MIME_TYPES: Record<OnboardingAssetType, Set<string>> = {
  logo: new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
  headshot: new Set(["image/png", "image/jpeg", "image/webp"]),
  brand_photo: new Set(["image/png", "image/jpeg", "image/webp"]),
};

const ALLOWED_EXTENSIONS: Record<OnboardingAssetType, Set<string>> = {
  logo: new Set(["png", "jpg", "jpeg", "webp", "svg"]),
  headshot: new Set(["png", "jpg", "jpeg", "webp"]),
  brand_photo: new Set(["png", "jpg", "jpeg", "webp"]),
};

export function isOnboardingAssetType(value: string): value is OnboardingAssetType {
  return value === "logo" || value === "headshot" || value === "brand_photo";
}

export function onboardingAssetLimitLabel(assetType: OnboardingAssetType) {
  return `${Math.floor(ONBOARDING_ASSET_LIMITS[assetType] / MB)} MB`;
}

export function validateOnboardingAssetFile(
  assetType: OnboardingAssetType,
  file: FileLike | null | undefined,
) {
  if (!file || file.size <= 0) {
    return { ok: false as const, error: "Choose a file to upload." };
  }

  if (file.size > ONBOARDING_ASSET_LIMITS[assetType]) {
    return {
      ok: false as const,
      error: `This image is too large. Please upload a ${ASSET_TYPE_LABELS[assetType]} under ${onboardingAssetLimitLabel(assetType)}.`,
    };
  }

  const extension = extensionFromFilename(file.name);
  if (
    !ALLOWED_EXTENSIONS[assetType].has(extension) ||
    !ALLOWED_MIME_TYPES[assetType].has(file.type)
  ) {
    return {
      ok: false as const,
      error:
        assetType === "logo"
          ? "This file type isn't supported. Use JPG, PNG, WEBP, or SVG."
          : "This file type isn't supported. Use JPG, PNG, or WEBP.",
    };
  }

  return { ok: true as const };
}

export function extensionFromFilename(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  return extension === "jpeg" ? "jpg" : extension;
}
