import type { ReactNode } from "react";
import { logoutAdminAction } from "@/lib/admin-auth";

export function AdminShell({
  children,
  showLogout = true,
}: {
  children: ReactNode;
  showLogout?: boolean;
}) {
  return (
    <main className="min-h-screen bg-dark px-4 py-6 text-primary">
      <header className="mx-auto mb-6 flex max-w-7xl items-center justify-between rounded-2xl border border-dark-border bg-dark-card px-5 py-4">
        <div>
          <p className="text-lg font-black tracking-[0.22em] text-primary">OPZIX</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-cyan">
            Admin
          </p>
        </div>
        {showLogout ? (
          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="rounded-full border border-dark-border bg-white/[0.04] px-3 py-2 text-sm font-semibold text-secondary transition hover:border-brand-cyan hover:text-primary"
            >
              Logout
            </button>
          </form>
        ) : null}
      </header>
      {children}
    </main>
  );
}
