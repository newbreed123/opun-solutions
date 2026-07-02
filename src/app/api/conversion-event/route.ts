import { NextRequest, NextResponse } from "next/server";
import { logConversionEvent } from "@/lib/conversion-event-log";
import type { ConversionEventName } from "@/lib/analytics/trackConversion";

type ConversionEventRequest = {
  eventName?: unknown;
  payload?: unknown;
};

const allowedEvents = new Set<ConversionEventName>([
  "zora_conversation_started",
  "zora_qualified_lead",
  "audit_started",
  "audit_completed",
  "strategy_call_clicked",
  "strategy_call_booked",
  "contact_form_submitted",
  "ask_question_clicked",
  "roadmap_downloaded",
]);

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ConversionEventRequest;
  const eventName = typeof body.eventName === "string" ? body.eventName.trim() : "";
  const payload = isRecord(body.payload) ? body.payload : {};

  if (!allowedEvents.has(eventName as ConversionEventName)) {
    return NextResponse.json(
      { ok: false, error: "Invalid conversion event." },
      { status: 400 },
    );
  }

  const result = await logConversionEvent({
    eventName,
    payload,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json(
    {
      ok: result.ok,
      skipped: result.skipped,
      error: result.ok ? undefined : result.error,
    },
    { status: 200 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
