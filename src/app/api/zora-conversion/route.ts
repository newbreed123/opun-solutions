import { NextRequest, NextResponse } from "next/server";
import { updateZoraConversion } from "@/lib/zora-conversation-log";
import type { ZoraLeadProfile } from "@/lib/zora-assistant";

type ZoraConversionRequest = {
  sessionId?: unknown;
  eventType?: unknown;
  leadProfile?: ZoraLeadProfile;
  sourcePath?: unknown;
};

const allowedEvents = new Set([
  "conversation_started",
  "audit_clicked",
  "strategy_call_clicked",
  "ask_question_clicked",
  "faq_opened",
  "contact_requested",
  "live_agent_requested",
  "qualification_completed",
  "email_submitted",
]);

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ZoraConversionRequest;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  const sourcePath = typeof body.sourcePath === "string" ? body.sourcePath.trim() : "";

  if (!sessionId || !allowedEvents.has(eventType)) {
    return NextResponse.json(
      { ok: false, error: "Invalid Zora conversion event." },
      { status: 400 },
    );
  }

  const result = await updateZoraConversion(
    sessionId,
    eventType,
    body.leadProfile || {},
    {
      sourcePath,
      userAgent: request.headers.get("user-agent"),
    },
  );

  return NextResponse.json(
    {
      ok: result.ok,
      skipped: result.skipped,
      error: result.ok ? undefined : result.error,
    },
    { status: 200 },
  );
}
