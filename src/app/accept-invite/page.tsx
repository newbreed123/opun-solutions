import type { Metadata } from "next";
import Link from "next/link";
import {
  acceptInviteAction,
  requestActivationLinkAction,
} from "@/lib/customer-platform/session-actions";
import { ActivationInvitationFlow } from "./ActivationInvitationFlow";
import { RecoveryPasswordForm } from "./RecoveryPasswordForm";

export const metadata: Metadata = {
  title: "Accept Invitation | Opzix",
};

type AcceptInvitePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const params = (await searchParams) ?? {};
  const tokenHash = stringParam(params.token_hash);
  const invitationId = resolveInvitationId(
    stringParam(params.invitation_id),
    stringParam(params.organization_invitation_id),
  );
  const verificationType = stringParam(params.type);
  const activationError = stringParam(params.activation_error);
  const legacyError = stringParam(params.error);
  const recoveryRequested = stringParam(params.recovery_requested) === "1";
  const isRecoveryMode = stringParam(params.mode) === "recovery";
  const recoveryInvitationId = invitationId;
  const canRequestRecovery =
    !isRecoveryMode && isUuid(recoveryInvitationId) && !recoveryRequested;
  const shouldShowActivationForm =
    !isRecoveryMode &&
    Boolean(tokenHash) &&
    !activationError &&
    !legacyError;

  return (
    <main className="min-h-screen bg-dark py-16 text-primary">
      <div className="container-wide mx-auto max-w-md">
        <Link href="/" className="text-sm font-bold tracking-[0.24em] text-brand-cyan">
          OPZIX
        </Link>
        <section className="mt-8 rounded-2xl border border-dark-border bg-dark-card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            {isRecoveryMode ? "Password Recovery" : "Customer Invitation"}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">
            {isRecoveryMode ? "Reset your password." : "Activate your account."}
          </h1>
          <p className="mt-3 text-sm leading-6 text-secondary">
            {isRecoveryMode
              ? "Enter a new password for your Opzix account."
              : "Set your password to finish invitation acceptance and enter guided onboarding."}
          </p>
          {(activationError || legacyError) && !isRecoveryMode ? (
            <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-400/10 p-3 text-sm text-amber-100">
              This activation link is no longer valid. Request a fresh link, or
              sign in if your account is already active.
            </div>
          ) : null}
          {recoveryRequested ? (
            <div className="mt-5 rounded-xl border border-brand-cyan/35 bg-brand-cyan/10 p-3 text-sm text-cyan-50">
              If this invitation is eligible, a fresh activation link will be
              sent to the email address on the account. Already activated?
              Sign in or reset your password.
            </div>
          ) : null}
          {isRecoveryMode ? (
            <RecoveryPasswordForm />
          ) : shouldShowActivationForm ? (
            <form action={acceptInviteAction} className="mt-6 grid gap-4">
              <input type="hidden" name="token_hash" value={tokenHash ?? ""} />
              <input
                type="hidden"
                name="invitation_id"
                value={invitationId ?? ""}
              />
              <input
                type="hidden"
                name="verification_type"
                value={verificationType}
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
              <button
                type="submit"
                className="btn btn-primary min-h-12 w-full"
                disabled={!tokenHash}
              >
                Activate Account
              </button>
            </form>
          ) : canRequestRecovery ? (
            <form action={requestActivationLinkAction} className="mt-6 grid gap-4">
              <input
                type="hidden"
                name="invitation_id"
                value={recoveryInvitationId ?? ""}
              />
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
          ) : (
            <ActivationInvitationFlow />
          )}
          <Link
            href="/login"
            className="mt-5 inline-flex text-sm font-semibold text-brand-cyan"
          >
            {isRecoveryMode ? "Back to sign in" : "Already activated? Sign in"}
          </Link>
        </section>
      </div>
    </main>
  );
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveInvitationId(
  invitationId: string | undefined,
  organizationInvitationId: string | undefined,
) {
  if (
    invitationId &&
    organizationInvitationId &&
    invitationId !== organizationInvitationId
  ) {
    return "";
  }
  return invitationId || organizationInvitationId || "";
}

function isUuid(value: string | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}
