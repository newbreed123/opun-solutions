"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { STRATEGY_CALL_CONFIRMED_PATH } from "@/lib/booking";
import { trackStrategyCallBookedFromConfirmation } from "@/lib/booking/openStrategyCall";

export default function StrategyCallConfirmedTracker() {
  useEffect(() => {
    trackStrategyCallBookedFromConfirmation();
    trackEvent("strategy_call_confirmed", {
      conversionPath: STRATEGY_CALL_CONFIRMED_PATH,
    });
  }, []);

  return null;
}
