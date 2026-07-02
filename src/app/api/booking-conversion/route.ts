import { NextRequest, NextResponse } from "next/server";
import {
  hasSupabaseAdminConfig,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";

type BookingConversionRequest = {
  eventName?: unknown;
  payload?: unknown;
  calendlyPayload?: unknown;
};

const allowedEvents = new Set([
  "strategy_call_clicked",
  "strategy_call_booked",
]);

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as BookingConversionRequest;
  const eventName = typeof body.eventName === "string" ? body.eventName.trim() : "";
  const payload = isRecord(body.payload) ? body.payload : {};
  const calendlyPayload = isRecord(body.calendlyPayload) ? body.calendlyPayload : null;

  if (!allowedEvents.has(eventName)) {
    return NextResponse.json(
      { ok: false, error: "Invalid booking conversion event." },
      { status: 400 },
    );
  }

  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json(
      { ok: false, skipped: true, error: "Supabase admin config missing." },
      { status: 200 },
    );
  }

  const result = await supabaseAdminFetch<null>("conversion_events", {
    method: "POST",
    body: {
      event_name: eventName,
      source: stringValue(payload.source),
      website_url: stringValue(payload.websiteUrl),
      business_type: stringValue(payload.businessType),
      challenge: stringValue(payload.challenge),
      lead_score: numberValue(payload.leadScore),
      lead_temperature: stringValue(payload.leadTemperature),
      page_path: stringValue(payload.pagePath),
      payload,
      calendly_payload: calendlyPayload,
      user_agent: request.headers.get("user-agent"),
    },
    prefer: "returning=minimal",
  });

  return NextResponse.json(
    {
      ok: result.ok,
      skipped: false,
      error: result.ok ? undefined : result.error,
    },
    { status: 200 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
