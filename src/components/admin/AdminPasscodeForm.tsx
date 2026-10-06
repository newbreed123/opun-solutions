"use client";

import { useActionState } from "react";
import { submitAdminPasscode } from "@/lib/admin-auth";

const initialState = {
  ok: false,
  error: "",
};

export function AdminPasscodeForm({
  title = "Internal Passcode",
  description = "Enter the internal passcode to view customer accounts.",
  submitLabel = "Continue",
}: {
  title?: string;
  description?: string;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    submitAdminPasscode,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {description ? <p className="text-sm leading-6 text-secondary">{description}</p> : null}
      <label className="block text-sm font-semibold text-secondary">
        {title}
        <input
          type="password"
          name="passcode"
          autoComplete="current-password"
          required
          disabled={isPending}
          className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none placeholder:text-muted focus:border-brand-cyan disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="Enter passcode"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-300">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-brand-cyan px-4 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Checking..." : submitLabel}
      </button>
    </form>
  );
}
