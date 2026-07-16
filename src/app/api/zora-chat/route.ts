import { NextRequest, NextResponse } from "next/server";
import {
  buildZoraResponse,
  ZoraLeadProfile,
  ZoraResponse,
} from "@/lib/zora-assistant";
import {
  buildZoraContext,
  contextInputFromProfile,
  zoraContextPromptBlock,
  type ZoraContextEngineInput,
  type ZoraContextMessage,
} from "@/lib/zora/context-engine";
import { logZoraConversation } from "@/lib/zora-conversation-log";
import {
  actionsForZoraPlaybook,
  adaptZoraPlaybookResponse,
  normalizeZoraLearningIntent,
  selectZoraPlaybook,
} from "@/lib/zora-learning";
import {
  resolveZoraResponse,
  type ZoraStructuredResponse,
} from "@/lib/zora-intelligence";
import { recordFounderEvent } from "@/lib/founder-dashboard/events";
import { summarizeZoraQuestion } from "@/lib/founder-dashboard/sanitize";

type ZoraChatRequest = {
  message?: unknown;
  messages?: ZoraContextMessage[];
  leadProfile?: ZoraLeadProfile;
  hasWebsite?: unknown;
  websiteUrl?: unknown;
  businessType?: unknown;
  challenge?: unknown;
  industry?: unknown;
  confirmedIndustry?: unknown;
  industryStatus?: unknown;
  currentStep?: unknown;
  conversationStage?: unknown;
  currentTopic?: unknown;
  currentSubtopic?: unknown;
  recentTalkingPoints?: unknown;
  auditContext?: unknown;
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
const ZORA_PROMPT_VERSION =
  process.env.ZORA_PROMPT_VERSION?.trim() || "zora-founder-intelligence-2026-07-16";
const ZORA_CONVERSATION_FLOW_VERSION =
  process.env.ZORA_CONVERSATION_FLOW_VERSION?.trim() || "guided-qualification-v1";

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArrayValue(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : undefined;
}

function attributionFromSourcePath(sourcePath: string) {
  const path = sourcePath || "/";
  const url = new URL(path, "https://opzix.local");

  return {
    pageUrl: `${url.pathname}${url.search}`,
    landingPage: `${url.pathname}${url.search}`,
    source: url.searchParams.get("utm_source") || undefined,
    medium: url.searchParams.get("utm_medium") || undefined,
    campaign: url.searchParams.get("utm_campaign") || undefined,
  };
}

function auditContextValue(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const context = value as Record<string, unknown>;

  return {
    source: stringValue(context.source),
    action: stringValue(context.action),
    scanId: stringValue(context.scanId),
    websiteUrl: stringValue(context.websiteUrl),
    recommendationId: stringValue(context.recommendationId),
    recommendationTitle: stringValue(context.recommendationTitle),
    category: stringValue(context.category),
    severity: stringValue(context.severity),
    businessExplanation: stringValue(context.businessExplanation),
    technicalExplanation: stringValue(context.technicalExplanation),
    recommendedFix: stringValue(context.recommendedFix),
    suggestedQuestion: stringValue(context.suggestedQuestion),
    overallScore:
      typeof context.overallScore === "number" ? context.overallScore : undefined,
    overallStatus: stringValue(context.overallStatus),
    primaryConcern: stringValue(context.primaryConcern),
  };
}

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

function actionsFromStructuredButtons(
  buttons?: ZoraStructuredResponse["buttons"],
): ZoraResponse["recommendedActions"] | undefined {
  if (!buttons?.length) return undefined;

  const actions = buttons
    .map((button) => {
      if (button.action === "strategy_call") return "strategy_call";
      if (button.action === "free_audit") return "free_audit";
      if (button.action === "diagnose") return "diagnose";
      if (button.action === "ask_question") return "ask_question";
      return null;
    })
    .filter((action): action is ZoraResponse["recommendedActions"][number] => Boolean(action));

  const uniqueActions = Array.from(new Set(actions)) as ZoraResponse["recommendedActions"];
  return uniqueActions.length ? uniqueActions : undefined;
}

function isDirectAuditCostQuestion(message: string) {
  return (
    /\b(is it|is this|is the audit|audit is|audit's|audits?)\b.+\bfree\b/i.test(message) ||
    /\bfree\b.+\b(audit|scan|scanner|website review)\b/i.test(message) ||
    /\b(how much|cost|price|pricing)\b.+\b(audit|scan|scanner|website review)\b/i.test(message)
  );
}

function isCostBeforeBookingQuestion(message: string) {
  const text = message.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const hasCostLanguage = /\b(cost|costs|pricing|price|prices|budget|estimate|range|quote|investment|cost analysis)\b/.test(
    text,
  );
  const hasBookingLanguage = /\b(book|booking|schedule|strategy call|consultation|meeting|call)\b/.test(
    text,
  );
  const asksBeforeBooking =
    /\bbefore\b.*\b(book|booking|schedule|strategy call|consultation|meeting|call)\b/.test(
      text,
    ) ||
    /\b(book|booking|schedule|strategy call|consultation|meeting|call)\b.*\bbefore\b/.test(
      text,
    );

  return hasCostLanguage && hasBookingLanguage && asksBeforeBooking;
}

function shouldUseConsultantGeneration(message: string, fallback: ZoraResponse) {
  if (
    fallback.action ||
    fallback.navigationHref ||
    fallback.responseMode === "action_request" ||
    fallback.responseMode === "offer_catalog" ||
    isDirectAuditCostQuestion(message) ||
    isCostBeforeBookingQuestion(message)
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
  context: ReturnType<typeof buildZoraContext>,
  auditContext: ReturnType<typeof auditContextValue>,
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
            "Direct question override: if the user asks why, what, how, whether they need, what is included, what happens, whether it is worth it, or asks you to explain a service, audit, strategy call, implementation, pricing, findings, recommendations, or Opzix itself, answer the question first as a consultant. Explain why it matters and the business impact before mentioning any optional next step.",
            "Never redirect immediately to a booking page or say you are opening a booking page when the user is asking about the value of a strategy call rather than asking to book one.",
            "Treat recentTalkingPoints as topics to avoid repeating. Do not reuse stale facts unless present in accumulatedLeadProfile.",
            "Do not claim you reviewed a website unless a scanner payload exists. Do not promise results or mention private lead scoring.",
            "",
            zoraContextPromptBlock(context),
            "",
            "[CRITICAL: BACK-TO-BACK REPETITION BAN]",
            "- Look at the last assistant message implied by the current thread and fallback context. You are strictly forbidden from reusing the same sentences, sentence order, or bulleted lists back-to-back.",
            "- If a user gives a short, neutral response like 'ok', 'okay', 'nice', 'got it', or 'sounds good', do not repeat your previous explanation. Advance the conversation by asking a deeper diagnostic question or guiding them to the next logical step.",
            "- If the same concept must be revisited, explain it from a deeper layer: operational impact, patient/business impact, implementation detail, or next-step validation.",
            "",
            "[CRITICAL OVERRIDE: DEFINITION REQUEST]",
            "- If the user asks what you mean by a business term, answer the definition directly in the first two sentences before continuing.",
            "- If the term is DTC, explain that DTC stands for Direct-to-Consumer: selling directly to the end shopper through an owned storefront or customer path rather than only through a middleman distributor.",
            "- Connect the definition to the user's provided website. For stores.dsw.com, explain that DSW carries third-party footwear brands, but the digital experience still uses direct-to-shopper retail mechanics such as category browsing, size/style filtering, availability cues, and cart or checkout friction.",
            "- You are strictly forbidden from repeating the multi-line DTC checklist in a definition response. Move to one consultative diagnostic question.",
            "",
            "[STRICT INDUSTRY ALIGNMENT]",
            "- Anchor to accumulatedLeadProfile.businessType, accumulatedLeadProfile.industryProfile.industry, inferredIndustry, and inferredBusinessModel before answering.",
            "- Priority rule: confirmedIndustry beats user correction, and user correction beats inferredIndustry. If confirmedIndustry exists, ignore inferredIndustry entirely.",
            "- If accumulatedLeadProfile.industryStatus is 'needs_clarification', do not use prior industry checklists or old DTC/real-estate language. Ask the user to clarify the business model.",
            "- If confirmedIndustry is 'domain_registrar', discuss domain registration, DNS setup, hosting/email add-ons, customer onboarding, account management, renewals, transfers, and support. Do not mention product discovery, checkout, shipping, or ecommerce unless the user reintroduces ecommerce explicitly.",
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
            "[CRITICAL INSTRUCTION: USER CALL-OUTS & SKEPTICISM]",
            "- If the user asks whether your reply is copy-and-paste, generic, canned, scripted, templated, or not tailored, stop all script templates immediately.",
            "- Be candid that any prior recommendation was a high-level structural framework unless a completed scanner payload or internal analytics are present.",
            "- Then make the response specific to the provided URL and business context. For Dick's Sporting Goods, reference enterprise retail details such as sporting category navigation, mobile size filtering, local in-store pickup availability, rewards/account login friction, checkout flow, and tracking visibility.",
            "- Do not repeat the prior Growth System Diagnosis block after a skepticism call-out.",
            "",
            "[ANTI-BOT / SCRAPER PROTECTION ERROR HANDLING]",
            "- If the user mentions anti-bot protection, bot protection, blocked pages, CAPTCHA, Cloudflare, Akamai, firewall, access denied, 403, or forbidden, assume the automated scanner cannot read that domain cleanly.",
            "- You are strictly forbidden from offering Run Free Audit or saying the scanner can check the live page for that domain in the same conversation.",
            "- Shift to manual expert review and make Book Strategy Call the primary next step.",
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
            "[POST-RECOMMENDATION ACKNOWLEDGEMENT GUARDRAIL]",
            "- If the user has already received a multi-point recommendation and responds with 'okay', 'ok', 'cool', 'sounds good', 'nice', 'makes sense', or 'got it', do not repeat the recommendation.",
            "- Move to the next action in no more than 2 sentences.",
            "- Do not use a repeated checklist and do not add a new diagnosis unless the user explicitly asks for deeper explanation.",
            "",
            "[CRITICAL NO-WEBSITE STATE]",
            `- User Has Website: ${fallback.leadProfile.hasNoWebsite ? "FALSE (the user explicitly said they do not have a live website yet)" : fallback.leadProfile.hasWebsiteOrLandingPage || fallback.leadProfile.websiteUrl ? "TRUE" : "UNKNOWN"}.`,
            "- If User Has Website is FALSE, do not ask for a website URL, do not offer an audit or scanner path, and do not use audit/scanner language.",
            "- If User Has Website is FALSE, switch completely into pre-launch growth strategy: landing page architecture, core offer, lead capture, follow-up, tracking, and launch timeline.",
            "- If User Has Website is FALSE and the user says 'okay', 'nice', or 'sounds good', move toward the strategy call path instead of repeating the previous paragraph.",
            "",
            "[AUDIT REPORT CONTEXT]",
            "- If auditReportContext is present, answer follow-up questions against that audit context.",
            "- If auditReportContext is present, the scanner has already been run. Do not offer Run Free Audit, do not suggest running the scanner again, and do not ask whether the user wants a more detailed scanner roadmap.",
            "- Do not claim a human reviewed the website. Say the context came from the audit report.",
            "- Explain recommendations in plain business language first, then mention what Opzix would validate or scope next.",
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
            contextEngine: context,
            auditReportContext: auditContext,
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
    const attribution = attributionFromSourcePath(sourcePath);
    const hasWebsite = typeof body.hasWebsite === "boolean" ? body.hasWebsite : undefined;
    const structuredMessages = Array.isArray(body.messages) ? body.messages : undefined;
    const structuredRecentTalkingPoints = stringArrayValue(body.recentTalkingPoints);
    const auditContext = auditContextValue(body.auditContext);

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
      ...(auditContext
        ? {
            auditReportAvailable: true,
            auditScanId: auditContext.scanId,
            auditWebsiteUrl: auditContext.websiteUrl,
            auditRecommendationTitle: auditContext.recommendationTitle,
            auditRecommendedFix: auditContext.recommendedFix,
            auditPrimaryConcern: auditContext.primaryConcern,
            auditOverallScore: auditContext.overallScore,
            auditOverallStatus: auditContext.overallStatus,
          }
        : {}),
      ...(stringValue(body.websiteUrl) ? { websiteUrl: stringValue(body.websiteUrl) } : {}),
      ...(stringValue(body.businessType) ? { businessType: stringValue(body.businessType) as ZoraLeadProfile["businessType"] } : {}),
      ...(stringValue(body.challenge) ? { challenge: stringValue(body.challenge) as ZoraLeadProfile["challenge"] } : {}),
      ...(stringValue(body.industry) ? { industry: stringValue(body.industry) } : {}),
      ...(stringValue(body.confirmedIndustry) ? { confirmedIndustry: stringValue(body.confirmedIndustry) } : {}),
      ...(stringValue(body.industryStatus) ? { industryStatus: stringValue(body.industryStatus) as ZoraLeadProfile["industryStatus"] } : {}),
      ...(stringValue(body.conversationStage)
        ? { conversationStage: stringValue(body.conversationStage) as ZoraLeadProfile["conversationStage"] }
        : {}),
      ...(stringValue(body.currentTopic) ? { currentTopic: stringValue(body.currentTopic) as ZoraLeadProfile["currentTopic"] } : {}),
      ...(stringValue(body.currentSubtopic) ? { currentSubtopic: stringValue(body.currentSubtopic) } : {}),
      ...(structuredRecentTalkingPoints ? { recentTalkingPoints: structuredRecentTalkingPoints as ZoraLeadProfile["recentTalkingPoints"] } : {}),
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
    const orchestrated = resolveZoraResponse({
      userMessage: message,
      leadProfile: incomingLeadProfile,
      conversationHistory: structuredMessages,
      auditContext,
      baseResponse: fallback,
    });
    const resolvedLeadProfile = {
      ...fallback.leadProfile,
      ...(orchestrated.updatedState || {}),
    } as ZoraLeadProfile;
    const contextInput: ZoraContextEngineInput = contextInputFromProfile(resolvedLeadProfile, {
      messages: structuredMessages || [message],
      hasWebsite:
        hasWebsite ??
        (resolvedLeadProfile.hasNoWebsite
          ? false
          : resolvedLeadProfile.hasWebsiteOrLandingPage || resolvedLeadProfile.websiteUrl
            ? true
            : null),
      currentStep: stringValue(body.currentStep),
      conversationStage: stringValue(body.conversationStage) || resolvedLeadProfile.conversationStage,
      currentTopic: stringValue(body.currentTopic) || resolvedLeadProfile.currentTopic,
      currentSubtopic: stringValue(body.currentSubtopic) || resolvedLeadProfile.currentSubtopic,
      confirmedIndustry: stringValue(body.confirmedIndustry) || resolvedLeadProfile.confirmedIndustry,
      industryStatus: stringValue(body.industryStatus) || resolvedLeadProfile.industryStatus,
      inferredIndustry: stringValue(body.industry) || resolvedLeadProfile.inferredIndustry || String(resolvedLeadProfile.industry || ""),
      recentTalkingPoints: structuredRecentTalkingPoints || resolvedLeadProfile.recentTalkingPoints,
    });
    const contextEngine = buildZoraContext(contextInput);
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
        leadProfileAfter: resolvedLeadProfile,
        leadProfileChanges: fallback.profileChanges,
        selectedResponseStrategy: fallback.responseMode,
        selectedIntelligenceIntent: orchestrated.intent,
        contextEngine,
      });
    }

    const playbook = auditContext ||
      fallback.leadProfile.hasNoWebsite ||
      fallback.leadProfile.scannerBlocked ||
      fallback.action ||
      fallback.navigationHref ||
      fallback.responseMode === "scanner_execute" ||
      fallback.responseMode === "scanner_failure" ||
      fallback.responseMode === "trust_skepticism" ||
      fallback.responseMode === "action_request" ||
      fallback.responseMode === "pricing" ||
      isCostBeforeBookingQuestion(message) ||
      fallback.responseMode === "offer_catalog" ||
      fallback.responseMode === "consulting_concept"
      ? undefined
      : selectZoraPlaybook(message, fallback);
    const playbookReply = adaptZoraPlaybookResponse(playbook, fallback);

    const gptReply =
      !playbookReply && shouldUseConsultantGeneration(message, fallback)
        ? await buildGptReply(message, fallback, contextEngine, auditContext).catch((error) => {
            console.warn("Zora GPT reply failed:", error);
            return null;
          })
        : null;

    const rawFinalReply = playbookReply || gptReply || orchestrated.message;
    const finalReply =
      fallback.leadProfile.hasNoWebsite &&
      fallback.responseMode !== "company_background" &&
      fallback.responseMode !== "scanner_execute"
      ? sanitizeNoWebsiteReply(rawFinalReply)
      : rawFinalReply;
    const learningIntent = normalizeZoraLearningIntent(message, fallback.responseMode);
    const rawRecommendedActions =
      actionsForZoraPlaybook(playbook) ||
      actionsFromStructuredButtons(orchestrated.buttons) ||
      fallback.recommendedActions;
    const finalRecommendedActions = auditContext
      ? rawRecommendedActions.filter((action) => action !== "free_audit")
      : rawRecommendedActions;

    const finalAction = orchestrated.action
      ? ({
          type: orchestrated.action.type,
          ...(orchestrated.action.url ? { url: orchestrated.action.url } : {}),
        } as ZoraResponse["action"])
      : fallback.action;

    recordFounderZoraInsights({
      message,
      sourcePath,
      fallback,
      orchestrated,
      resolvedLeadProfile,
      playbookId: playbook?.id,
    });

    const conversationLog = await logZoraConversation(resolvedLeadProfile, message, finalReply, {
      sessionId,
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
      currentStep: stringValue(body.currentStep) || fallback.responseMode,
      intent: learningIntent,
      conversationStage: resolvedLeadProfile.conversationStage,
      currentTopic: resolvedLeadProfile.currentTopic,
      currentSubtopic:
        resolvedLeadProfile.currentSubtopic ||
        (fallback.responseMode === "company_background"
          ? fallback.currentMessageAnalysis.companyBackgroundSubtype
          : fallback.recentTalkingPoint),
      detectedConcept: resolvedLeadProfile.detectedConcept,
      conceptConfidence: resolvedLeadProfile.conceptConfidence,
      recentTalkingPoint: orchestrated.recentTalkingPoint || fallback.recentTalkingPoint,
      profileBefore: incomingLeadProfile,
      action: finalAction,
      recommendedActions: finalRecommendedActions,
      contextEngine,
      eventType:
        fallback.responseMode === "audit_request"
          ? "audit_requested"
          : fallback.responseMode === "company_background"
            ? "company_background"
          : fallback.responseMode === "booking_request"
            ? "booking_requested"
            : fallback.responseMode === "recommendation"
              ? "recommendation_requested"
              : fallback.responseMode === "offer_catalog"
                ? "offer_question"
              : fallback.responseMode === "consultant"
                ? "consultant_question"
              : fallback.responseMode === "review_request"
                ? "review_requested"
            : fallback.responseMode === "pricing" || fallback.responseMode === "next_step"
              ? "cost_or_fix_requested"
              : fallback.responseMode,
    });

    if (!conversationLog.ok) {
      console.error("Zora conversation persistence failed:", {
        sessionId,
        skipped: conversationLog.skipped,
        error: conversationLog.error,
      });
    }

    return NextResponse.json(
      {
        ...fallback,
        leadProfile: resolvedLeadProfile,
        reply: finalReply,
        action: finalAction,
        recommendedActions: finalRecommendedActions,
        contextEngine,
        intelligenceIntent: orchestrated.intent,
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

function recordFounderZoraInsights({
  message,
  sourcePath,
  fallback,
  orchestrated,
  resolvedLeadProfile,
  playbookId,
}: {
  message: string;
  sourcePath: string;
  fallback: ZoraResponse;
  orchestrated: ZoraStructuredResponse;
  resolvedLeadProfile: ZoraLeadProfile;
  playbookId?: string;
}) {
  const analysis = fallback.currentMessageAnalysis;
  const common = {
    source: "zora",
    websiteUrl: resolvedLeadProfile.websiteUrl || resolvedLeadProfile.auditWebsiteUrl,
    businessType: resolvedLeadProfile.businessType,
    challenge: resolvedLeadProfile.challenge,
    industry: stringValue(
      resolvedLeadProfile.confirmedIndustry ||
      resolvedLeadProfile.industry ||
      resolvedLeadProfile.inferredIndustry,
    ),
    scanId: resolvedLeadProfile.auditScanId,
  };
  const confidence = fallback.confidenceScore;
  const summary = summarizeZoraQuestion(message);
  const detectedConcept =
    resolvedLeadProfile.detectedConcept ||
    analysis.consultingConcept ||
    (orchestrated.intent === "explainer"
      ? stringValue(orchestrated.recentTalkingPoint) ||
        stringValue(orchestrated.updatedState?.currentTopic)
      : undefined);
  const detectedOffer =
    analysis.offerKey || resolvedLeadProfile.lastMentionedOffer || undefined;
  const detectedFramework =
    orchestrated.intent === "solution_framework"
      ? stringValue(orchestrated.recentTalkingPoint) ||
        stringValue(resolvedLeadProfile.currentTopic)
      : undefined;

  try {
    void Promise.all([
      recordFounderEvent({
        eventName: "zora_message_received",
        ...common,
        sanitizedQuestionSummary: summary,
        messageCategory: categoryForSummary(summary),
        confidence,
      }),
      recordFounderEvent({
        eventName: "zora_intent_detected",
        ...common,
        detectedIntent: founderIntentForZora(orchestrated.intent),
        confidence,
      }),
      detectedConcept
        ? recordFounderEvent({
            eventName: "zora_concept_detected",
            ...common,
            detectedConcept,
            confidence: confidenceForConcept(resolvedLeadProfile.conceptConfidence),
          })
        : Promise.resolve(),
      detectedOffer
        ? recordFounderEvent({
            eventName: "zora_offer_detected",
            ...common,
            detectedOffer,
            confidence,
          })
        : Promise.resolve(),
      detectedFramework
        ? recordFounderEvent({
            eventName: "zora_solution_framework_used",
            ...common,
            detectedFramework,
            confidence,
          })
        : Promise.resolve(),
      playbookId
        ? recordFounderEvent({
            eventName: "zora_playbook_used",
            ...common,
            detectedPlaybook: playbookId,
            confidence,
          })
        : Promise.resolve(),
      orchestrated.intent === "fallback" || fallback.responseMode === "out_of_scope"
        ? recordFounderEvent({
            eventName: "zora_low_confidence_fallback",
            ...common,
            sanitizedQuestionSummary: summary,
            messageCategory: categoryForSummary(summary),
            confidence,
          })
        : Promise.resolve(),
      hasCompletedProfile(resolvedLeadProfile)
        ? recordFounderEvent({
            eventName: "zora_lead_profile_completed",
            ...common,
            confidence,
          })
        : Promise.resolve(),
    ]).catch(() => undefined);
  } catch {
    // Founder intelligence should never block Zora responses.
  }

  void sourcePath;
}

function hasCompletedProfile(profile: ZoraLeadProfile) {
  return Boolean(profile.businessType && profile.challenge && profile.websiteUrl);
}

function confidenceForConcept(confidence: ZoraLeadProfile["conceptConfidence"]) {
  if (confidence === "High") return 0.9;
  if (confidence === "Moderate") return 0.7;
  if (confidence === "Low") return 0.35;
  return undefined;
}

function categoryForSummary(summary: string) {
  const text = summary.toLowerCase();

  if (text.includes("traffic")) return "traffic";
  if (text.includes("chatbot")) return "ai_assistant";
  if (text.includes("tracking")) return "tracking";
  if (text.includes("pricing")) return "pricing";
  if (text.includes("audit")) return "audit";
  if (text.includes("converting")) return "conversion";
  if (text.includes("follow-up")) return "follow_up";

  return "uncategorized";
}

function founderIntentForZora(intent: ZoraStructuredResponse["intent"]) {
  if (intent === "explainer") return "brain_concept";
  return intent;
}
