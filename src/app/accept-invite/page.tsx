import type { Metadata } from "next";
import Link from "next/link";
import { acceptInviteAction } from "@/lib/customer-platform/session-actions";
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
  const error = stringParam(params.error);
  const isRecoveryMode = stringParam(params.mode) === "recovery";

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
          {!isRecoveryMode && !tokenHash ? (
            <div className="mt-5 rounded-xl border border-dark-border bg-white/[0.035] p-3 text-sm text-secondary">
              Open this page using the secure link in your Opzix invitation
              email. If the link has expired, ask your Opzix contact to resend
              the invitation.
            </div>
          ) : null}
          {error && !isRecoveryMode ? (
            <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-400/10 p-3 text-sm text-amber-100">
              {decodeURIComponent(error)}
            </div>
          ) : null}
          {isRecoveryMode ? (
            <RecoveryPasswordForm />
          ) : (
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
