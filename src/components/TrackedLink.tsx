"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent, type AnalyticsPayload } from "@/lib/analytics";

type TrackedLinkProps = {
  href: string;
  eventName: string;
  payload?: AnalyticsPayload;
  className?: string;
  children: ReactNode;
  target?: "_blank" | "_self";
  rel?: string;
};

export default function TrackedLink({
  href,
  eventName,
  payload = {},
  className,
  children,
  target,
  rel,
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => {
        trackEvent(eventName, {
          page_path: window.location.pathname,
          ...payload,
        });
      }}
    >
      {children}
    </Link>
  );
}
