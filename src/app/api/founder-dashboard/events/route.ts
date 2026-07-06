import { NextRequest, NextResponse } from "next/server";
import {
  getFounderDashboardMetrics,
  isFounderDashboardEventName,
  recordFounderEvent,
} from "@/lib/founder-dashboard/events";
import type {
  FounderDashboardEventInput,
  FounderDashboardEventQuery,
} from "@/lib/founder-dashboard/events";

type FounderEventRequest = {
  eventName?: unknown;
  source?: unknown;
  websiteUrl?: unknown;
  scanId?: unknown;
  businessType?: unknown;
  challenge?: unknown;
  industry?: unknown;
  createdAt?: unknown;
};

export async function GET(request: NextRequest) {
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const providedPasscode =
    request.nextUrl.searchParams.get("passcode") ||
    request.headers.get("x-opzix-admin-passcode") ||
    "";

  if (passcode && providedPasscode !== passcode) {
    return NextResponse.json(
      { ok: false, error: "Passcode required." },
      { status: 401 },
    );
  }

  const query: FounderDashboardEventQuery = {
    from: request.nextUrl.searchParams.get("from") || undefined,
    to: request.nextUrl.searchParams.get("to") || undefined,
  };
  const result = await getFounderDashboardMetrics(query);

  return NextResponse.json(
    {
      ok: result.ok,
      data: result.data,
      error: result.ok ? undefined : result.error,
    },
    { status: result.ok ? 200 : 200 },
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as FounderEventRequest;
  const eventName = typeof body.eventName === "string" ? body.eventName.trim() : "";

  if (!isFounderDashboardEventName(eventName)) {
    return NextResponse.json(
      { ok: false, error: "Invalid founder dashboard event." },
      { status: 400 },
    );
  }

  const event: FounderDashboardEventInput = {
    eventName,
    source: stringValue(body.source),
    websiteUrl: stringValue(body.websiteUrl),
    scanId: stringValue(body.scanId),
    businessType: stringValue(body.businessType),
    challenge: stringValue(body.challenge),
    industry: stringValue(body.industry),
    createdAt: stringValue(body.createdAt),
  };
  const result = await recordFounderEvent(event);

  return NextResponse.json(
    {
      ok: result.ok,
      skipped: "skipped" in result ? result.skipped : false,
      error: result.ok ? undefined : result.error,
    },
    { status: 200 },
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
