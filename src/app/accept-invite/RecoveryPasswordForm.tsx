"use client";

import { useActionState, useEffect, useState } from "react";
import {
  resetRecoveredPasswordAction,
  type PasswordRecoveryState,
} from "@/lib/customer-platform/session-actions";

type RecoveryTokens = {
  accessToken: string;
};

export function RecoveryPasswordForm() {
  const [tokens, setTokens] = useState<RecoveryTokens | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [state, formAction, pending] = useActionState<
    PasswordRecoveryState,
    FormData
  >(resetRecoveredPasswordAction, {});

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token") || "";
    const type = params.get("type") || "";

    if (accessToken && type === "recovery") {
      setTokens({ accessToken });
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      return;
    }

    setTokenError(
      "Open this page using the secure password reset link in your email. If the link has expired, request a fresh reset email.",
    );
  }, []);

  return (
    <>
      {tokenError ? (
        <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-400/10 p-3 text-sm text-amber-100">
          {tokenError}
        </div>
      ) : null}
      {state.error ? (
        <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-400/10 p-3 text-sm text-amber-100">
          {state.error}
        </div>
      ) : null}
      <form action={formAction} className="mt-6 grid gap-4">
        <input
          type="hidden"
          name="access_token"
          value={tokens?.accessToken ?? ""}
        />
        <label className="text-sm font-semibold text-secondary">
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          Confirm password
          <input
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary min-h-12 w-full"
          disabled={!tokens || pending}
        >
          {pending ? "Resetting Password" : "Reset Password"}
        </button>
      </form>
    </>
  );
}
