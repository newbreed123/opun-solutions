import type { ReactNode } from "react";
import CustomerAppShell from "@/components/customer/CustomerAppShell";
import { requireCustomerContext } from "@/lib/customer-platform/store";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const context = await requireCustomerContext();

  return <CustomerAppShell context={context}>{children}</CustomerAppShell>;
}
