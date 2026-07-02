"use client";

import { useEffect } from "react";
import {
  installCalendlyBookingListener,
  preloadCalendlyWidget,
} from "@/lib/booking/openStrategyCall";

export default function StrategyCallBookingTracker() {
  useEffect(() => {
    installCalendlyBookingListener();
    preloadCalendlyWidget();
  }, []);

  return null;
}
