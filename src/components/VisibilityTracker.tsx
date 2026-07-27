"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type AnalyticsPayload } from "@/lib/analytics";

type VisibilityTrackerProps = {
  eventName: string;
  payload?: AnalyticsPayload;
  threshold?: number;
};

export default function VisibilityTracker({
  eventName,
  payload = {},
  threshold = 0.35,
}: VisibilityTrackerProps) {
  const trackerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = trackerRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        trackEvent(eventName, {
          page_path: window.location.pathname,
          ...payload,
        });
        observer.disconnect();
      },
      { threshold },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [eventName, payload, threshold]);

  return (
    <span
      ref={trackerRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-1/2 h-px w-px opacity-0"
    />
  );
}
