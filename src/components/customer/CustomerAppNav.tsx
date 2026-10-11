"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/app", label: "Home" },
  { href: "/app/onboarding", label: "Onboarding" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/documents", label: "Documents" },
  { href: "/app/settings", label: "Account" },
  { href: "/app/business-profile", label: "Business Profile" },
  { href: "/app/plan-features", label: "Plan & Features" },
  { href: "/app/support", label: "Support" },
];

export default function CustomerAppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Customer app navigation"
      className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1 text-sm font-semibold text-secondary lg:w-auto lg:pb-0"
    >
      <div className="flex min-w-max gap-2 lg:min-w-0">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/app" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 hover:border-brand-cyan/60 hover:text-primary ${
                active
                  ? "border-brand-cyan/70 bg-brand-cyan/10 text-primary"
                  : "border-dark-border bg-white/[0.035]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
