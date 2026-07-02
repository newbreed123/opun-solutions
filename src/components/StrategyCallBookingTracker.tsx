"use client";

import { useEffect } from "react";
import { installCalendlyBookingListener } from "@/lib/booking/openStrategyCall";

export default function StrategyCallBookingTracker() {
  useEffect(() => {
    installCalendlyBookingListener();
  }, []);

  return null;
}
