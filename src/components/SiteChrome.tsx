"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import OpzixAIAssistant from "@/components/OpzixAIAssistant";
import StrategyCallBookingTracker from "@/components/StrategyCallBookingTracker";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isInternalApp =
    pathname?.startsWith("/app") ||
    pathname?.startsWith("/opzix-admin") ||
    pathname?.startsWith("/admin") ||
    false;

  if (isInternalApp) {
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
