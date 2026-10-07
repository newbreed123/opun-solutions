"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ONBOARDING_ASSET_ACCEPT,
  type OnboardingAssetType,
  onboardingAssetLimitLabel,
  validateOnboardingAssetFile,
} from "@/lib/customer-platform/onboarding-asset-policy";

type OnboardingAssetUploadFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  assetType: OnboardingAssetType;
  buttonLabel: string;
  className?: string;
  serverError?: string | null;
};

export default function OnboardingAssetUploadForm({
  action,
  assetType,
  buttonLabel,
  className = "mt-4 grid gap-2",
  serverError = null,
}: OnboardingAssetUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(serverError);

  useEffect(() => {
    setError(serverError);
  }, [serverError]);

  function validateSelectedFile() {
    const file = fileInputRef.current?.files?.[0] ?? null;
    const validation = validateOnboardingAssetFile(assetType, file);
    setError(validation.ok ? null : validation.error);
    return validation.ok;
  }

  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!validateSelectedFile()) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="asset_type" value={assetType} />
      <input
        ref={fileInputRef}
        name="asset_file"
        type="file"
        accept={ONBOARDING_ASSET_ACCEPT[assetType]}
        required
        onChange={() => {
          const file = fileInputRef.current?.files?.[0];
          if (!file) {
            setError(null);
            return;
          }
          const validation = validateOnboardingAssetFile(assetType, file);
          setError(validation.ok ? null : validation.error);
        }}
        className="text-sm text-secondary file:mr-3 file:rounded-full file:border-0 file:bg-brand-cyan file:px-4 file:py-2 file:text-sm file:font-semibold file:text-dark"
      />
      <p className="text-xs text-muted">
        Max {onboardingAssetLimitLabel(assetType)}.
      </p>
      {error ? (
        <p className="rounded-md border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : null}
      <SubmitButton label={buttonLabel} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-secondary min-h-10 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Uploading..." : label}
    </button>
  );
}
