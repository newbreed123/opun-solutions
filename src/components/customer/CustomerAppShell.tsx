import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, ChevronDown, CircleHelp, LogOut, UserCircle } from "lucide-react";
import { logoutAction } from "@/lib/customer-platform/session-actions";
import type { CustomerContext } from "@/lib/customer-platform/types";
import { EntitlementProvider } from "./EntitlementProvider";

const navItems = [
  { href: "/app/onboarding", label: "Onboarding" },
  { href: "/app/settings", label: "Account" },
  { href: "/app/business-profile", label: "Business Profile" },
  { href: "/app/plan-features", label: "Plan & Features" },
  { href: "/app/support", label: "Support" },
];

export default function CustomerAppShell({
  context,
  children,
}: {
  context: CustomerContext;
  children: ReactNode;
}) {
  const displayName =
    context.profile?.preferred_name ||
    context.profile?.first_name ||
    context.user.email.split("@")[0] ||
    "Account";

  return (
    <EntitlementProvider entitlements={context.entitlements}>
      <div className="min-h-screen bg-dark text-primary">
        <header className="sticky top-0 z-40 border-b border-dark-border bg-dark/92 backdrop-blur-xl">
          <div className="container-wide flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
              <Link
                href="/app/onboarding"
                className="shrink-0 text-lg font-extrabold tracking-[0.18em] text-primary"
              >
                OPZIX
              </Link>
              <div className="min-w-0 border-l border-dark-border pl-4">
                <p className="truncate text-sm font-semibold text-primary">
                  {context.organization.name}
                </p>
                <p className="text-xs text-secondary">
                  {context.plan ? `${context.plan.name} Plan` : "Plan pending"}
                </p>
              </div>
            </div>
            <nav
              aria-label="Customer app navigation"
              className="flex gap-2 overflow-x-auto pb-1 text-sm font-semibold text-secondary lg:pb-0"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full border border-dark-border bg-white/[0.035] px-4 py-2 hover:border-brand-cyan/60 hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href="/app/support"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dark-border bg-white/[0.035] px-3 text-sm font-semibold text-secondary hover:border-brand-cyan/60 hover:text-primary"
              >
                <CircleHelp className="h-4 w-4" />
                Help
              </Link>
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-dark-border bg-white/[0.035] text-secondary"
                disabled
              >
                <Bell className="h-4 w-4" />
              </button>
              <details className="group relative">
                <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-dark-border bg-white/[0.035] px-3 text-sm font-semibold text-primary hover:border-brand-cyan/60">
                  <UserCircle className="h-4 w-4 text-brand-cyan" />
                  <span className="max-w-[8rem] truncate">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-secondary transition group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-dark-border bg-dark-card p-3 shadow-2xl">
                  <p className="truncate text-sm font-semibold text-primary">
                    {displayName}
                  </p>
                  <p className="mt-1 truncate text-xs text-secondary">
                    {context.user.email}
                  </p>
                  <form action={logoutAction} className="mt-3 border-t border-dark-border pt-3">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-secondary hover:bg-white/[0.045] hover:text-primary"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>
        <main className="container-wide py-6 md:py-10">{children}</main>
      </div>
    </EntitlementProvider>
  );
}
