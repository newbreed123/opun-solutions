"use client";

import { useEffect, useRef, useState } from "react";
import { STRATEGY_CALL_URL } from "@/lib/booking";
import {
  initStrategyCallInlineWidget,
  installCalendlyBookingListener,
  rememberStrategyCallContext,
  type StrategyCallPayload,
} from "@/lib/booking/openStrategyCall";

type StrategyCallInlineCalendlyProps = {
  context?: Partial<StrategyCallPayload>;
};

export default function StrategyCallInlineCalendly({
  context,
}: StrategyCallInlineCalendlyProps) {
  const calendlyRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    installCalendlyBookingListener();

    if (context?.source) {
      rememberStrategyCallContext({
        source: context.source,
        businessType: context.businessType,
        challenge: context.challenge,
        websiteUrl: context.websiteUrl,
        leadScore: context.leadScore,
        leadTemperature: context.leadTemperature,
      });
    }

    if (!calendlyRef.current) {
      return;
    }

    initStrategyCallInlineWidget(calendlyRef.current).catch(() => {
      setFailed(true);
    });
  }, [context]);

  return (
    <div>
      <div
        ref={calendlyRef}
        className="h-[900px] min-h-[900px] overflow-hidden rounded-xl border border-white/15 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.24)]"
      />
      {failed ? (
        <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          Calendly could not load inside this page. Open the booking page directly,
          then make sure Calendly is configured to redirect after booking to
          /strategy-call-confirmed.
          <a
            href={STRATEGY_CALL_URL}
            className="ml-2 font-semibold text-primary underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Open Calendly
          </a>
        </div>
      ) : null}
    </div>
  );
}
