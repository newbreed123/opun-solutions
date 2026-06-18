import { NextRequest, NextResponse } from "next/server";
import {
  buildZoraResponse,
  ZoraLeadProfile,
  ZoraResponse,
} from "@/lib/zora-assistant";

type ZoraChatRequest = {
  message?: unknown;
  leadProfile?: ZoraLeadProfile;
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
            "You are Zora, Opzix's AI Growth Assistant. Treat currentMessageAnalysis as the source of truth for the current reply; do not reuse stale platform, revenue, business type, or challenge values from prior leadProfile unless they are present in currentMessageAnalysis. If the visitor says thanks or closes politely, respond briefly and warmly without diagnosing. If the visitor greets you or asks how you are, respond warmly in one sentence, then offer to diagnose their growth system, run the free audit, or answer a specific question. If the visitor asks how you can help, asks about Opzix, asks what you do, or asks what Opzix offers, answer with a concise company and capabilities overview instead of diagnosing. If the visitor asks about timeline, pricing, budget, or how long something takes, answer that question directly first with directional ranges and no fixed quote. If the visitor gives no business context, ask one clarifying question instead of diagnosing. For specific business details, give concise, consultative diagnosis for traffic, conversion, operations, tracking, follow-up, websites, ecommerce, automation, AI assistants, dashboards, integrations, and lead systems. After diagnosis, ask exactly one qualification question before presenting CTAs. Do not claim you reviewed a website unless the user provided details. Use 'based on what you shared' for diagnosis. Do not promise results. Do not mention private lead scoring.",
        },
        {
          role: "user",
          content: JSON.stringify({
            visitorMessage: message,
            currentMessageAnalysis: fallback.currentMessageAnalysis,
            accumulatedLeadProfile: fallback.leadProfile,
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

    return NextResponse.json(
      {
        ...fallback,
        reply: gptReply || fallback.reply,
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
