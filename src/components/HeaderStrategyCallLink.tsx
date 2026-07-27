"use client";

import Link from "next/link";
import { type MouseEvent } from "react";
import { strategyCallBookingHref } from "@/lib/booking";
import { openStrategyCall } from "@/lib/booking/openStrategyCall";

type HeaderStrategyCallLinkProps = {
  className: string;
  onNavigate?: () => void;
};

export default function HeaderStrategyCallLink({
  className,
  onNavigate,
}: HeaderStrategyCallLinkProps) {
  const headerStrategyCallHref = strategyCallBookingHref({ source: "header" });

  function trackHeaderStrategyCall(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    openStrategyCall({
      source: "header",
    });
    onNavigate?.();
  }

  return (
    <Link
      href={headerStrategyCallHref}
      className={className}
      onClick={trackHeaderStrategyCall}
    >
      Book Strategy Call
    </Link>
  );
}
