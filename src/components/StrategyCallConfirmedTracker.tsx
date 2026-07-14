"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { trackConversion } from "@/lib/analytics/trackConversion";
import { STRATEGY_CALL_CONFIRMED_PATH } from "@/lib/booking";

const BOOKING_SESSION_PREFIX = "opzix-confirmed-booking:";

export default function StrategyCallConfirmedTracker({
  appointmentId,
}: {
  appointmentId?: string;
}) {
  useEffect(() => {
    if (appointmentId) {
      try {
        const key = `${BOOKING_SESSION_PREFIX}${appointmentId}`;
        const raw = window.sessionStorage.getItem(key);

        if (raw) {
          const payload = JSON.parse(raw) as Record<string, string | number | boolean>;
          trackConversion("strategy_call_booked", payload);
          window.sessionStorage.removeItem(key);
        }
      } catch {
        // Confirmation tracking should never interrupt the page.
      }
    }

    trackEvent("strategy_call_confirmed", {
      conversionPath: STRATEGY_CALL_CONFIRMED_PATH,
    });
  }, [appointmentId]);

  return null;
}

