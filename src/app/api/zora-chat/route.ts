import { NextRequest, NextResponse } from "next/server";
import {
  buildZoraResponse,
  ZoraLeadProfile,
  ZoraResponse,
} from "@/lib/zora-assistant";
import { logZoraConversation } from "@/lib/zora-conversation-log";
import {
  actionsForZoraPlaybook,
  adaptZoraPlaybookResponse,
  normalizeZoraLearningIntent,
  selectZoraPlaybook,
} from "@/lib/zora-learning";

type ZoraChatRequest = {
  message?: unknown;
  leadProfile?: ZoraLeadProfile;
  hasWebsite?: unknown;
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

function sanitizeNoWebsiteReply(reply: string) {
  return reply
    .replace(/\bwebsite URL\b/gi, "live link")
    .replace(/\bfree audit scanner\b/gi, "pre-launch review")
    .replace(/\baudit scanner\b/gi, "review tool")
    .replace(/\bscanner\b/gi, "review tool")
    .replace(/\baudit\b/gi, "review")
    .replace(/\bscan\b/gi, "review");
}

function isDirectAuditCostQuestion(message: string) {
  return (
    /\b(is it|is this|is the audit|audit is|audit's|audits?)\b.+\bfree\b/i.test(message) ||
    /\bfree\b.+\b(audit|scan|scanner|website review)\b/i.test(message) ||
    /\b(how much|cost|price|pricing)\b.+\b(audit|scan|scanner|website review)\b/i.test(message)
  );
}

function shouldUseConsultantGeneration(message: string, fallback: ZoraResponse) {
  if (
    fallback.action ||
    fallback.navigationHref ||
    fallback.leadProfile.hasNoWebsite ||
    isDirectAuditCostQuestion(message)
  ) {
    return false;
  }

  return (
    fallback.responseMode === "consultant" ||
    fallback.responseMode === "pricing" ||
    fallback.responseMode === "audit_request" ||
    fallback.responseMode === "recommendation" ||
    fallback.responseMode === "next_step"
  );
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
          content: [
            "You are Zora, Opzix's AI Growth Consultant. You are not a generic chatbot or FAQ widget.",
            "Use optional generation only as a trusted consultant layer for cost analysis, audit process explanation, ads-vs-website questions, ROI, rebuild, and implementation strategy.",
            "Keep deterministic qualification, buttons, routing, scanner handoff, industry awareness, and topic persistence intact.",
            "Answer direct pricing/free-audit questions in the first sentence. Do not include button-speak, do not force a CTA, and do not route users from text.",
            "Treat recentTalkingPoints as topics to avoid repeating. Do not reuse stale facts unless present in accumulatedLeadProfile.",
            "Do not claim you reviewed a website unless a scanner payload exists. Do not promise results or mention private lead scoring.",
            "",
            "[CRITICAL: BACK-TO-BACK REPETITION BAN]",
            "- Look at the last assistant message implied by the current thread and fallback context. You are strictly forbidden from reusing the same sentences, sentence order, or bulleted lists back-to-back.",
            "- If a user gives a short, neutral response like 'ok', 'okay', 'nice', 'got it', or 'sounds good', do not repeat your previous explanation. Advance the conversation by asking a deeper diagnostic question or guiding them to the next logical step.",
            "- If the same concept must be revisited, explain it from a deeper layer: operational impact, patient/business impact, implementation detail, or next-step validation.",
            "",
            "[STRICT INDUSTRY ALIGNMENT]",
            "- Anchor to accumulatedLeadProfile.businessType, accumulatedLeadProfile.industryProfile.industry, inferredIndustry, and inferredBusinessModel before answering.",
            "- If the chosen industry is Healthcare/Care, Medical, or Hospital Networks, talk strictly about patients, appointment booking flows, medical compliance, location-based practitioner routing, care intake, provider directory navigation, patient coordination, and response-time latency.",
            "- If Healthcare/Care is selected, you are strictly forbidden from talking about retail catalogs, store inventory, e-commerce, carts, checkout, shipping, pickup, delivery, or merchandising.",
            "- If the chosen industry or URL is an organization, church, non-profit, faith-based community, ministry, or community organization, talk strictly about digital-to-physical pathing, local campus connection, sermons, small groups, serving, giving, community care, volunteer routing, and localized follow-up.",
            "- If Non-Profit, Faith-Based, Ministry, Church, or Community is selected or inferred, you are strictly forbidden from using commercial words like project, build, sales, leads, or sprint.",
            "- If the selected industry conflicts with a URL clue, acknowledge uncertainty and ask a clarification question instead of switching industries silently.",
            "",
            "[CRITICAL: USER CORRECTION OVERRIDE]",
            "- If the user explicitly corrects your classification, disagrees with your business-model assumption, or says phrases like 'it's not DTC', 'not a DTC company', 'no, we are a platform', or 'we are a different model', immediately accept the correction.",
            "- Do not repeat the previous diagnostic checklist after a correction. Do not reuse DTC ecommerce language if the user rejected the DTC label.",
            "- If the corrected model is a B2B supply network, dropshipping platform, turnkey ecosystem, or ecommerce infrastructure platform, pivot to merchant acquisition, onboarding speed, integration clarity, vendor dashboard clarity, API/plugin stability, supplier logistics visibility, and enterprise lead capture.",
            "- Start with a brief apology or acknowledgement, then ask one deeper diagnostic question about the corrected model.",
            "",
            "[STRICT SCANNER EXECUTION RULE]",
            "- If the user types 'run audit', 'run the audit', 'start audit', 'scan my site', or 'diagnose my growth system', they expect a tool to load.",
            "- You are strictly forbidden from repeating the B2B platform checklist or asking where visitors are dropping off in response to those commands.",
            "- Your only allowed response text for scanner execution is: 'Initiating the technical architecture scan for your domain now. Standby for the roadmap.'",
            "",
            "[STRICT CONTEXT RESPONSIVENESS OVERRIDE]",
            "- If a user writes a detailed message explaining how they get traffic, which tools they use, or what system they want to build, you are strictly forbidden from outputting generic capabilities lists or saying 'My role is to understand...'.",
            "- You must read their exact words, apply the matching industry matrix, and explain how you would architect that specific system before suggesting the next step.",
            "- If the user mentions real estate, Zillow, Trulia, Redfin, organic leads, or a lead-generating system, apply the Real Estate & Automated Lead Gen Matrix.",
            "",
            "[REAL ESTATE & AUTOMATED LEAD GEN MATRIX]",
            "- Use only for Real Estate, Property Management, brokerage networks, or mentions of Zillow, Trulia, or Redfin. Never use ecommerce terms like cart, checkout, shipping, or product discovery.",
            "- Level 1: For real estate businesses balancing organic growth and platforms like Zillow, the bottleneck is not a pretty website; it is automated lead capture, validation, and instantaneous nurture.",
            "- Level 2: The key leak is response latency. Buyers and sellers from Zillow or organic search expect fast answers. If follow-up is delayed, they often move to another agent.",
            "- Level 3: The system should bridge traffic sources and forms into a CRM such as HubSpot, KVCore, Follow Up Boss, or a similar pipeline, then trigger SMS/email follow-up quickly enough to qualify intent and book serious prospects.",
            "",
            "[STRICT CHOICE STATE TRACKING]",
            "- If you ask a binary question such as 'Would you like to run the audit or review the strategy manually?' and the user selects 'manually', 'manual review', 'recommendation', or 'review strategy', immediately render that exact path.",
            "- You are strictly forbidden from repeating the binary question or repeating the preceding paragraph. Acknowledge their choice, provide the requested information, and move the conversation to the next logical step.",
            "",
            "[CRITICAL NO-WEBSITE STATE]",
            `- User Has Website: ${fallback.leadProfile.hasNoWebsite ? "FALSE (the user explicitly said they do not have a live website yet)" : fallback.leadProfile.hasWebsiteOrLandingPage || fallback.leadProfile.websiteUrl ? "TRUE" : "UNKNOWN"}.`,
            "- If User Has Website is FALSE, do not ask for a website URL, do not offer an audit or scanner path, and do not use audit/scanner language.",
            "- If User Has Website is FALSE, switch completely into pre-launch growth strategy: landing page architecture, core offer, lead capture, follow-up, tracking, and launch timeline.",
            "- If User Has Website is FALSE and the user says 'okay', 'nice', or 'sounds good', move toward the strategy call path instead of repeating the previous paragraph.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({
            visitorMessage: message,
            currentMessageAnalysis: fallback.currentMessageAnalysis,
            accumulatedLeadProfile: fallback.leadProfile,
            recommendationRoadmap: fallback.leadProfile.recommendationRoadmap,
            recentTalkingPoints: fallback.leadProfile.recentTalkingPoints,
            recentTalkingPoint: fallback.recentTalkingPoint,
            adContext: {
              trafficIntentCategory: fallback.leadProfile.trafficIntentCategory,
              trafficIntentText: fallback.leadProfile.trafficIntentText,
              ...fallback.leadProfile.adContext,
            },
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
    const hasWebsite = typeof body.hasWebsite === "boolean" ? body.hasWebsite : undefined;

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required.",
        },
        { status: 400 },
      );
    }

    const incomingLeadProfile: ZoraLeadProfile = {
      ...(body.leadProfile || {}),
      ...(hasWebsite === false
        ? {
            hasNoWebsite: true,
            hasWebsiteOrLandingPage: false,
            websiteUrl: undefined,
          }
        : hasWebsite === true
          ? {
              hasWebsiteOrLandingPage: true,
              hasNoWebsite: false,
            }
          : {}),
    };
    const fallback = buildZoraResponse(message, incomingLeadProfile);
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
        leadProfileBefore: incomingLeadProfile,
        leadProfileAfter: fallback.leadProfile,
        leadProfileChanges: fallback.profileChanges,
        selectedResponseStrategy: fallback.responseMode,
      });
    }

    const playbook = fallback.leadProfile.hasNoWebsite ||
      fallback.action ||
      fallback.navigationHref ||
      fallback.responseMode === "scanner_execute"
      ? undefined
      : selectZoraPlaybook(message, fallback);
    const playbookReply = adaptZoraPlaybookResponse(playbook, fallback);

    const gptReply =
      !playbookReply && shouldUseConsultantGeneration(message, fallback)
        ? await buildGptReply(message, fallback).catch((error) => {
            console.warn("Zora GPT reply failed:", error);
            return null;
          })
        : null;

    const rawFinalReply = playbookReply || gptReply || fallback.reply;
    const finalReply =
      fallback.leadProfile.hasNoWebsite && fallback.responseMode !== "company_background"
      ? sanitizeNoWebsiteReply(rawFinalReply)
      : rawFinalReply;
    const learningIntent = normalizeZoraLearningIntent(message, fallback.responseMode);
    const finalRecommendedActions =
      actionsForZoraPlaybook(playbook) || fallback.recommendedActions;

    void logZoraConversation(fallback.leadProfile, message, finalReply, {
      sessionId,
      sourcePath,
      userAgent: request.headers.get("user-agent"),
      currentStep: fallback.responseMode,
      intent: learningIntent,
      conversationStage: fallback.leadProfile.conversationStage,
      currentTopic: fallback.leadProfile.currentTopic,
      currentSubtopic:
        fallback.responseMode === "company_background"
          ? fallback.currentMessageAnalysis.companyBackgroundSubtype
          : fallback.recentTalkingPoint,
      profileBefore: incomingLeadProfile,
      action: fallback.action,
      recommendedActions: finalRecommendedActions,
      eventType:
        fallback.responseMode === "audit_request"
          ? "audit_requested"
          : fallback.responseMode === "company_background"
            ? "company_background"
          : fallback.responseMode === "booking_request"
            ? "booking_requested"
            : fallback.responseMode === "recommendation"
              ? "recommendation_requested"
              : fallback.responseMode === "consultant"
                ? "consultant_question"
              : fallback.responseMode === "review_request"
                ? "review_requested"
            : fallback.responseMode === "pricing" || fallback.responseMode === "next_step"
              ? "cost_or_fix_requested"
              : fallback.responseMode,
    });

    return NextResponse.json(
      {
        ...fallback,
        reply: finalReply,
        recommendedActions: finalRecommendedActions,
        playbookId: playbook?.id,
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
