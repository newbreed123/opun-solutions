import type { Metadata } from "next";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/customer-platform/session-actions";

export const metadata: Metadata = {
  title: "Reset Password | Opzix",
};

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const error = stringParam(params.error);
  const sent = stringParam(params.sent) === "1";

  return (
    <main className="min-h-screen bg-dark py-16 text-primary">
      <div className="container-wide mx-auto max-w-md">
        <Link href="/login" className="text-sm font-semibold text-brand-cyan">
          Back to login
        </Link>
        <section className="mt-6 rounded-2xl border border-dark-border bg-dark-card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Password Reset
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">Reset your password.</h1>
          <p className="mt-3 text-sm leading-6 text-secondary">
            Enter the email tied to your Opzix customer account.
          </p>
          {sent ? (
            <div className="mt-5 rounded-xl border border-emerald-300/35 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              If an account exists, a reset email has been sent.
            </div>
          ) : null}
          {error ? (
            <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-400/10 p-3 text-sm text-amber-100">
              {decodeURIComponent(error)}
            </div>
          ) : null}
          <form action={forgotPasswordAction} className="mt-6 grid gap-4">
            <label className="text-sm font-semibold text-secondary">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
              />
            </label>
            <button type="submit" className="btn btn-primary min-h-12 w-full">
              Send Reset Link
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
