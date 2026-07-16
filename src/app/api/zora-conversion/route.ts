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

const ZORA_PROMPT_VERSION =
  process.env.ZORA_PROMPT_VERSION?.trim() || "zora-founder-intelligence-2026-07-16";
const ZORA_CONVERSATION_FLOW_VERSION =
  process.env.ZORA_CONVERSATION_FLOW_VERSION?.trim() || "guided-qualification-v1";

function attributionFromSourcePath(sourcePath: string) {
  const url = new URL(sourcePath || "/", "https://opzix.local");

  return {
    pageUrl: `${url.pathname}${url.search}`,
    landingPage: `${url.pathname}${url.search}`,
    source: url.searchParams.get("utm_source") || undefined,
    medium: url.searchParams.get("utm_medium") || undefined,
    campaign: url.searchParams.get("utm_campaign") || undefined,
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ZoraConversionRequest;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  const sourcePath = typeof body.sourcePath === "string" ? body.sourcePath.trim() : "";
  const attribution = attributionFromSourcePath(sourcePath);

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
      visitorSessionId: sessionId,
      landingPage: attribution.landingPage,
      pageUrl: attribution.pageUrl,
      referrer: request.headers.get("referer"),
      source: attribution.source || "zora",
      medium: attribution.medium,
      campaign: attribution.campaign,
      promptVersion: ZORA_PROMPT_VERSION,
      conversationFlowVersion: ZORA_CONVERSATION_FLOW_VERSION,
      modelVersion: process.env.ZORA_OPENAI_MODEL?.trim() || "local-diagnosis",
      experimentId: process.env.ZORA_EXPERIMENT_ID?.trim() || null,
      claritySessionId: request.headers.get("x-clarity-session-id"),
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
