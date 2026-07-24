"use client";

import { useEffect } from "react";
import { trackEvent, type AnalyticsPayload } from "@/lib/analytics";

type PageViewTrackerProps = {
  eventName: string;
  payload?: AnalyticsPayload;
};

export default function PageViewTracker({
  eventName,
  payload = {},
}: PageViewTrackerProps) {
  useEffect(() => {
    trackEvent(eventName, {
      page_path: window.location.pathname,
      ...payload,
    });
  }, [eventName, payload]);

  return null;
}
