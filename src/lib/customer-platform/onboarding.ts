import type { OnboardingStepCode } from "./types";

export type OnboardingStep = {
  code: OnboardingStepCode;
  title: string;
  shortTitle: string;
  description: string;
};

export const onboardingSteps: OnboardingStep[] = [
  {
    code: "account",
    title: "Account",
    shortTitle: "Account",
    description: "Confirm the account owner and timezone for the platform.",
  },
  {
    code: "business",
    title: "Business",
    shortTitle: "Business",
    description: "Capture business structure, market, CRM, website, and goals.",
  },
  {
    code: "brand",
    title: "Brand",
    shortTitle: "Brand",
    description: "Collect brand details, public contact information, and domain notes.",
  },
  {
    code: "connections",
    title: "Connections",
    shortTitle: "Connections",
    description: "Track requested integrations and provider statuses.",
  },
  {
    code: "mls_idx",
    title: "MLS and IDX",
    shortTitle: "MLS/IDX",
    description: "Collect MLS, brokerage, and approval information for review.",
  },
  {
    code: "growth_goals",
    title: "Growth Goals",
    shortTitle: "Goals",
    description: "Understand the outcomes that should shape dashboard priorities.",
  },
  {
    code: "review",
    title: "Review",
    shortTitle: "Review",
    description: "Confirm enabled capabilities, missing fields, and next steps.",
  },
];

export const defaultOnboardingStep = onboardingSteps[0].code;

export function normalizeOnboardingStep(
  value: string | null | undefined,
): OnboardingStepCode {
  return onboardingSteps.some((step) => step.code === value)
    ? (value as OnboardingStepCode)
    : defaultOnboardingStep;
}

export function onboardingCompletionPercent(stepCode: OnboardingStepCode) {
  const index = onboardingSteps.findIndex((step) => step.code === stepCode);
  if (index < 0) return 0;
  return Math.round(((index + 1) / onboardingSteps.length) * 100);
}

export function nextOnboardingStep(stepCode: OnboardingStepCode) {
  const index = onboardingSteps.findIndex((step) => step.code === stepCode);
  return onboardingSteps[Math.min(index + 1, onboardingSteps.length - 1)].code;
}

export function previousOnboardingStep(stepCode: OnboardingStepCode) {
  const index = onboardingSteps.findIndex((step) => step.code === stepCode);
  return onboardingSteps[Math.max(index - 1, 0)].code;
}

export function onboardingDataForStep(
  rows: Array<{ section: string; data_json: Record<string, unknown> | null }>,
  stepCode: OnboardingStepCode,
) {
  return rows.find((row) => row.section === stepCode)?.data_json ?? {};
}
