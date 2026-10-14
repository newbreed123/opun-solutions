"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  completeActivationWithCodeAction,
  requestActivationLinkAction,
  sendActivationCodeAction,
  type ActivationCodeState,
  type ActivationCompletionState,
} from "@/lib/customer-platform/session-actions";

type ActivationTokenState =
  | { status: "checking" }
  | { status: "ready"; token: string }
  | { status: "missing" };

export function ActivationInvitationFlow() {
  const [tokenState, setTokenState] = useState<ActivationTokenState>({
    status: "checking",
  });
  const [codeState, sendCodeAction, codePending] = useActionState<
    ActivationCodeState,
    FormData
  >(sendActivationCodeAction, {});
  const [completionState, completeAction, completionPending] = useActionState<
    ActivationCompletionState,
    FormData
  >(completeActivationWithCodeAction, {});

  useEffect(() => {
    const fragment = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(fragment);
    const token = params.get("activation_token") || "";
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("activation_token");
    searchParams.delete("otp_sent");
    searchParams.delete("challenge_id");

    if (window.location.hash || searchParams.toString() !== window.location.search.replace(/^\?/, "")) {
      const cleanedSearch = searchParams.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${cleanedSearch ? `?${cleanedSearch}` : ""}`,
      );
    }

    setTokenState(token ? { status: "ready", token } : { status: "missing" });
  }, []);

  const invitationId = useMemo(
    () => completionState.invitationId || codeState.invitationId || "",
    [codeState.invitationId, completionState.invitationId],
  );

  if (tokenState.status === "checking") {
    return (
      <div className="mt-5 rounded-xl border border-dark-border bg-white/[0.035] p-3 text-sm text-secondary">
        Preparing your secure activation form.
      </div>
    );
  }

  if (tokenState.status === "missing") {
    return (
      <div className="mt-5 rounded-xl border border-dark-border bg-white/[0.035] p-3 text-sm text-secondary">
        Open this page using the secure link in your Opzix invitation email. If
        the link has expired, request a fresh activation link.
      </div>
    );
  }

  return (
    <>
      {codeState.error || completionState.error ? (
        <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-400/10 p-3 text-sm text-amber-100">
          {completionState.error || codeState.error}
        </div>
      ) : null}

      {codeState.sent && codeState.challengeId ? (
        <form action={completeAction} className="mt-6 grid gap-4">
          <input
            type="hidden"
            name="activation_token"
            value={tokenState.token}
          />
          <input
            type="hidden"
            name="challenge_id"
            value={codeState.challengeId}
          />
          <div className="rounded-xl border border-dark-border bg-white/[0.035] p-3 text-sm text-secondary">
            Enter the verification code sent to the invited email address.
          </div>
          <label className="text-sm font-semibold text-secondary">
            Verification code
            <input
              name="verification_code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
            />
          </label>
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
            disabled={completionPending}
          >
            {completionPending ? "Activating Account" : "Activate Account"}
          </button>
        </form>
      ) : (
        <form action={sendCodeAction} className="mt-6 grid gap-4">
          <input
            type="hidden"
            name="activation_token"
            value={tokenState.token}
          />
          <div className="rounded-xl border border-dark-border bg-white/[0.035] p-3 text-sm text-secondary">
            We will send a short-lived verification code to the invited email
            address.
          </div>
          <button
            type="submit"
            className="btn btn-primary min-h-12 w-full"
            disabled={codePending}
          >
            {codePending ? "Sending Code" : "Send Verification Code"}
          </button>
        </form>
      )}

      {invitationId ? (
        <form action={requestActivationLinkAction} className="mt-5 grid gap-4">
          <input type="hidden" name="invitation_id" value={invitationId} />
          <label className="text-sm font-semibold text-secondary">
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
            />
          </label>
          <button type="submit" className="btn btn-primary min-h-12 w-full">
            Request New Activation Link
          </button>
        </form>
      ) : null}
    </>
  );
}
