"use client";

import { useFormStatus } from "react-dom";

export default function OnboardingFormActions({
  isReviewStep,
  feedback,
}: {
  isReviewStep: boolean;
  feedback?: "saved" | "submitted" | "error";
}) {
  const { pending, data } = useFormStatus();
  const intent = data?.get("save_intent");
  const savingForLater = pending && intent === "later";
  const savingContinue = pending && intent !== "later";

  return (
    <div className="sticky bottom-0 z-20 -mx-6 border-t border-dark-border bg-dark-card/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-5 text-sm text-secondary">
          {pending ? (
            <span>{savingForLater ? "Saving for later..." : "Saving..."}</span>
          ) : feedback === "saved" ? (
            <span className="text-brand-cyan">Saved.</span>
          ) : feedback === "submitted" ? (
            <span className="text-brand-cyan">Saved and submitted for review.</span>
          ) : feedback === "error" ? (
            <span className="text-red-300">We could not save this yet. Review the message above and try again.</span>
          ) : (
            <span>Your changes are saved when you use one of these actions.</span>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            name="save_intent"
            value="later"
            disabled={pending}
            className="btn btn-secondary min-h-12 w-full px-5 text-sm sm:w-auto"
          >
            {savingForLater ? "Saving..." : "Save for Later"}
          </button>
          <button
            type="submit"
            name="save_intent"
            value="continue"
            disabled={pending}
            className="btn btn-primary min-h-12 w-full px-5 text-sm sm:w-auto"
          >
            {savingContinue
              ? "Saving..."
              : isReviewStep
                ? "Submit For Review"
                : "Save and Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
