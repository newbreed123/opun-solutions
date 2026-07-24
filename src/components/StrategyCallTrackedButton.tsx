"use client";

import type { ReactNode } from "react";
import { trackEvent, type AnalyticsPayload } from "@/lib/analytics";
import { strategyCallBookingHref } from "@/lib/booking";
import {
  openStrategyCall,
  type StrategyCallSource,
} from "@/lib/booking/openStrategyCall";

type StrategyCallTrackedButtonProps = {
  children: ReactNode;
  source: StrategyCallSource;
  serviceRequested: string;
  industry?: string;
  eventName?: string;
  eventPayload?: AnalyticsPayload;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  className?: string;
};

export default function StrategyCallTrackedButton({
  children,
  source,
  serviceRequested,
  industry,
  eventName,
  eventPayload = {},
  variant = "primary",
  size = "lg",
  className = "",
}: StrategyCallTrackedButtonProps) {
  const payload = {
    source,
    serviceRequested,
    industry,
  };
  const href = strategyCallBookingHref(payload);
  const variantClass = variant === "primary" ? "btn-primary" : "btn-secondary";
  const sizeClass =
    size === "lg"
      ? "sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg"
      : "px-6 py-3 text-base";

  return (
    <a
      href={href}
      className={`btn ${variantClass} ${sizeClass} w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none ${className}`}
      onClick={(event) => {
        event.preventDefault();

        if (eventName) {
          trackEvent(eventName, {
            page_path: window.location.pathname,
            cta_location: eventPayload.cta_location || "primary",
            ...eventPayload,
          });
        }

        openStrategyCall(payload);
      }}
    >
      {children}
    </a>
  );
}
