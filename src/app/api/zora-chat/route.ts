import { NextRequest, NextResponse } from "next/server";
import {
  buildZoraResponse,
  ZoraLeadProfile,
  ZoraResponse,
} from "@/lib/zora-assistant";
import { logZoraConversation } from "@/lib/zora-conversation-log";

type ZoraChatRequest = {
  message?: unknown;
  leadProfile?: ZoraLeadProfile;
  sessionId?: unknown;
  sourcePath?: unknown;
};

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

function sanitizeAssistantReply(reply: string) {
  return reply
    .replace(/\s+/g, " ")
    .replace(/\bguarantee(?:d|s)?\b/gi, "support")
    .replace(/\bpromise(?:d|s)?\b/gi, "estimate")
    .trim()
    .slice(0, 720);
}

async function buildGptReply(
  message: string,
  fallback: ZoraResponse,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const model = process.env.ZORA_OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "You are Zora, Opzix's AI Growth Consultant. You are not a generic chatbot or FAQ widget. Priority order: recommendation roadmap, consultant explanation, qualification, FAQ, out-of-scope. Treat currentMessageAnalysis as the source of truth for the current reply; do not reuse stale platform, revenue, business type, or challenge values from prior leadProfile unless they are present in currentMessageAnalysis or confirmed in accumulatedLeadProfile. If recommendationRoadmap exists and the visitor asks why, cost, timeline, or what comes next, reference that roadmap instead of making a new answer. Use Opzix methodology: diagnose conversion gaps, UX friction, tracking gaps, and operational bottlenecks; prioritize recommendations, effort, timeline, and business impact; then build websites, ecommerce systems, AI assistants, CRM/booking flows, tracking, dashboards, integrations, and workflows. For cost, explain platform, implementation, and business impact before numbers. For ads, use Traffic -> Conversion -> Follow-up -> Operations and do not recommend more traffic when conversion leaks are likely. For rebuild questions, compare cost to improve versus cost to replace and default to fixing first unless platform limits or technical debt are severe. If the visitor gives no business context, ask one clarifying question. Do not claim you reviewed a website unless the scanner ran or the visitor provided details. Do not promise results. Do not mention private lead scoring.",
        },
        {
          role: "user",
          content: JSON.stringify({
            visitorMessage: message,
            currentMessageAnalysis: fallback.currentMessageAnalysis,
            accumulatedLeadProfile: fallback.leadProfile,
            recommendationRoadmap: fallback.leadProfile.recommendationRoadmap,
            leadProfileChanges: fallback.profileChanges,
            fallbackReply: fallback.reply,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => ({}))) as OpenAiChatResponse;
  const reply = payload.choices?.[0]?.message?.content;

  if (!reply) {
    return null;
  }

  return sanitizeAssistantReply(reply);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ZoraChatRequest;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const sourcePath = typeof body.sourcePath === "string" ? body.sourcePath.trim() : "";

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required.",
        },
        { status: 400 },
      );
    }

    const fallback = buildZoraResponse(message, body.leadProfile);
    if (process.env.NODE_ENV !== "production") {
      console.info("Zora qualification decision:", {
        currentMessage: message,
        detectedIntent: fallback.responseMode,
        detectedBusinessType: fallback.currentMessageAnalysis.businessType,
        detectedChallenge: fallback.currentMessageAnalysis.challenge,
        detectedRecommendationSetup: fallback.currentMessageAnalysis.recommendationSetup,
        detectedLeadDestination: fallback.currentMessageAnalysis.leadDestination,
        detectedNotificationChannel: fallback.currentMessageAnalysis.notificationChannel,
        confidenceScore: fallback.confidenceScore,
        leadProfileBefore: body.leadProfile || {},
        leadProfileAfter: fallback.leadProfile,
        leadProfileChanges: fallback.profileChanges,
        selectedResponseStrategy: fallback.responseMode,
      });
    }

    const gptReply =
      fallback.responseMode === "diagnosis"
        ? await buildGptReply(message, fallback).catch((error) => {
            console.warn("Zora GPT reply failed:", error);
            return null;
          })
        : null;

    const finalReply = gptReply || fallback.reply;

    void logZoraConversation(fallback.leadProfile, message, finalReply, {
      sessionId,
      sourcePath,
      userAgent: request.headers.get("user-agent"),
      currentStep: fallback.responseMode,
      eventType:
        fallback.responseMode === "audit_request"
          ? "audit_requested"
          : fallback.responseMode === "booking_request"
            ? "booking_requested"
            : fallback.responseMode === "recommendation"
              ? "recommendation_requested"
              : fallback.responseMode === "consultant"
                ? "consultant_question"
            : fallback.responseMode === "pricing" || fallback.responseMode === "next_step"
              ? "cost_or_fix_requested"
              : fallback.responseMode,
    });

    return NextResponse.json(
      {
        ...fallback,
        reply: finalReply,
        poweredBy: gptReply ? "openai" : "local-diagnosis",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Zora chat error:", error);
    return NextResponse.json(
      {
        error: "Zora could not process that message right now.",
      },
      { status: 500 },
    );
  }
}
