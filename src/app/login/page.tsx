import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "@/lib/customer-platform/session-actions";

export const metadata: Metadata = {
  title: "Customer Login | Opzix",
  description: "Sign in to the Opzix customer app.",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = stringParam(params.error);

  return (
    <main className="min-h-screen bg-dark py-16 text-primary">
      <div className="container-wide mx-auto max-w-md">
        <Link href="/" className="text-sm font-bold tracking-[0.24em] text-brand-cyan">
          OPZIX
        </Link>
        <section className="mt-8 rounded-2xl border border-dark-border bg-dark-card p-6 shadow-glow md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Customer Account
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">Sign in to Opzix.</h1>
          <p className="mt-3 text-sm leading-6 text-secondary">
            Access your onboarding, plan, features, and account profile.
          </p>
          {error ? (
            <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-400/10 p-3 text-sm text-amber-100">
              {loginErrorMessage(error)}
            </div>
          ) : null}
          <form action={loginAction} className="mt-6 grid gap-4">
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
            <label className="text-sm font-semibold text-secondary">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
              />
            </label>
            <button type="submit" className="btn btn-primary mt-2 min-h-12 w-full">
              Sign In
            </button>
          </form>
          <div className="mt-6 flex flex-col gap-2 text-sm text-secondary">
            <Link href="/forgot-password" className="font-semibold text-brand-cyan">
              Forgot password?
            </Link>
            <Link href="/accept-invite" className="font-semibold text-brand-cyan">
              Accept an invitation
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function loginErrorMessage(error: string) {
  if (error === "missing-fields") return "Enter your email and password.";
  if (error === "no-organization") {
    return "Your account is active, but no organization membership was found yet.";
  }
  return decodeURIComponent(error);
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
