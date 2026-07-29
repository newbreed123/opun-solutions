"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import OpzixAIAssistant from "@/components/OpzixAIAssistant";
import StrategyCallBookingTracker from "@/components/StrategyCallBookingTracker";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCustomerApp = pathname?.startsWith("/app") ?? false;

  if (isCustomerApp) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <OpzixAIAssistant />
      <StrategyCallBookingTracker />
    </>
  );
}
