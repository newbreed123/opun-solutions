import {
  buildOpzixOfferAnswer,
  buildOpzixProductLineAnswer,
  detectOpzixOfferIntent,
} from "@/lib/detect-opzix-offer";
import type { OpzixOfferKey } from "@/lib/opzix-offers";
import { buildSolutionFrameworkAnswer } from "./build-solution-framework-answer";
import {
  buildZoraResponse,
  type ZoraLeadProfile,
  type ZoraResponse,
} from "@/lib/zora-assistant";
import {
  buildZoraIntelligenceContext,
  type ZoraAuditContext,
  type ZoraConversationHistoryItem,
  type ZoraIntelligenceContext,
} from "./context-builder";
import { detectSolutionFrameworkIntent } from "./detect-solution-framework";
import type { ZoraResponseIntent, ZoraStructuredResponse } from "./response-types";
import {
  getZoraSolutionFramework,
  isZoraSolutionFrameworkKey,
} from "./solution-frameworks";

export const ZORA_CANONICAL_FALLBACK =
  "I may not have enough context to answer that confidently yet, but I can still help narrow it down. Are you asking about something Opzix builds, a business problem you want to solve, or a website/ecommerce system you want reviewed?";

const COMMON_IN_SCOPE_TERMS =
  /\b(dashboards?|lead capture|landing pages?|bottlenecks?|tracking|crm|google ads|ai assistants?|chatbots?|automation|ecommerce|shopify|netsuite|booking|support tickets?|conversion)\b/i;

const DASHBOARD_AUDIENCE_QUESTION =
  "Who is the dashboard for: internal staff, managers, clients, customers, or a mix?";

export type ZoraOrchestratorInput = {
  userMessage: string;
  leadProfile?: ZoraLeadProfile;
  conversationHistory?: ZoraConversationHistoryItem[];
  auditContext?: ZoraAuditContext;
  baseResponse?: ZoraResponse;
};

function normalizedText(message: string) {
  return message.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function structuredActionButtons(
  actions: ZoraResponse["recommendedActions"] = [],
): ZoraStructuredResponse["buttons"] {
  return actions.map((action) => {
    if (action === "strategy_call") {
      return { label: "Book Strategy Call", action: "strategy_call" };
    }
    if (action === "free_audit") {
      return {
        label: "Run Free Audit",
        action: "free_audit",
        href: "/tools/ecommerce-audit-scanner",
      };
    }
    if (action === "diagnose") {
      return { label: "Diagnose my growth system", action: "diagnose" };
    }
    return { label: "Ask a Question", action: "ask_question" };
  });
}

function intentFromBaseResponse(response: ZoraResponse): ZoraResponseIntent {
  if (response.responseMode === "company_background") return "company_background";
  if (response.responseMode === "pricing" || response.responseMode === "timeline") {
    return "pricing";
  }
  if (
    response.responseMode === "action_request" ||
    response.responseMode === "booking_request" ||
    response.responseMode === "scanner_execute"
  ) {
    return "action";
  }
  if (response.responseMode === "offer_catalog") return "offer";
  if (response.responseMode === "consulting_concept" || response.responseMode === "terminology") {
    return "brain_concept";
  }
  if (response.responseMode === "recommendation" || response.responseMode === "next_step") {
    return "recommendation";
  }
  if (response.responseMode === "diagnosis" || response.responseMode === "business_model_correction") {
    return "industry_diagnosis";
  }
  if (response.responseMode === "clarify") return "qualification";
  if (response.responseMode === "out_of_scope") return "fallback";
  return "faq";
}

function isExplicitOfferTopicSwitch(message: string) {
  const text = normalizedText(message);
  return /\b(tell me about|what is|what are|can you|do you|does opzix|i need|what services|what does opzix build)\b/.test(
    text,
  );
}

function explicitOfferKeyForMessage(message: string): OpzixOfferKey | null {
  const text = normalizedText(message);

  if (/\bgoogle ads?\b/.test(text)) return "google_ads_ad_readiness";
  if (/\b(ai chatbot|chatbot|ai assistant|ai consultant|ai agent)\b/.test(text)) {
    return "ai_assistant_chatbot";
  }
  if (/\bdashboards?\b/.test(text)) return "client_dashboard";
  if (/\blead capture\b/.test(text)) return "crm_email_automation";
  if (/\b(shopify store|build.*shopify|shopify site)\b/.test(text)) {
    return "ecommerce_storefront";
  }
  if (/\b(ga4|google analytics|google tag manager|gtm|conversion tracking)\b/.test(text)) {
    return "analytics_tracking";
  }
  if (/\b(netsuite|erp|bigcommerce.*netsuite|shopify.*netsuite|connect.*netsuite)\b/.test(text)) {
    return "backend_integrations";
  }

  return null;
}

function isClassificationChallenge(message: string) {
  const text = normalizedText(message);
  const challengesClassification =
    /\b(how do you know|why did you|why do you|what makes you|where did you|get that from|why assume|why are you assuming|how can you tell)\b/.test(
      text,
    );
  const mentionsClassification =
    /\b(dtc|direct to consumer|ecommerce|e commerce|store|business model|industry|classification|classified|looks like)\b/.test(
      text,
    );

  return challengesClassification && mentionsClassification;
}

function readableClassificationLabel(value: string | null | undefined) {
  if (!value) return "";

  const labels: Record<string, string> = {
    ecommerce_dtc: "DTC ecommerce",
    ecommerce_b2b_catalog: "B2B catalog ecommerce",
    b2b_supply_platform: "B2B supply platform",
    healthcare_care: "healthcare or care services",
    nonprofit_faith_community: "nonprofit or community organization",
    local_service: "local service business",
  };
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  return labels[normalized] || value.replace(/_/g, " ");
}

function classificationChallengeResponse(
  context: ZoraIntelligenceContext,
): ZoraStructuredResponse | null {
  if (!isClassificationChallenge(context.userMessage)) return null;

  const website = context.websiteUrl || "the URL";
  const inferredModel = context.leadProfile.inferredBusinessModel;
  const inferredIndustry = context.leadProfile.inferredIndustry;
  const confidence =
    typeof context.leadProfile.industryConfidence === "number"
      ? Math.round(context.leadProfile.industryConfidence * 100)
      : undefined;
  const inferenceLabels = Array.from(
    new Set(
      [readableClassificationLabel(inferredModel), readableClassificationLabel(inferredIndustry)]
        .filter(Boolean),
    ),
  );
  const inferenceDetail = inferenceLabels.length
    ? ` The current automated clue was ${inferenceLabels
        .join(" / ")}${confidence ? ` at about ${confidence}% confidence` : ""}, but that is still a clue, not proof.`
    : "";

  return {
    intent: "qualification",
    message: [
      `You are right to challenge that. I do not know for certain that ${website} is a DTC ecommerce store from the chat alone.${inferenceDetail}`,
      "That label should be treated as an unconfirmed classification until the audit or a manual review verifies the actual customer path.",
      "For this URL, I should phrase the next step more carefully: if it is B2B, industrial, catalog-based, distributor-led, or quote-driven, the review should focus less on DTC checkout assumptions and more on catalog discovery, product/spec clarity, request-a-quote or contact paths, account/distributor routing, tracking, and follow-up.",
      "The clean next step is to run the audit or review the public path, then classify whether the conversion problem is DTC checkout friction, B2B catalog friction, lead capture, or routing/tracking.",
    ].join("\n\n"),
    buttons: structuredActionButtons(["free_audit", "strategy_call", "ask_question"]),
    updatedState: {
      industryStatus: "needs_clarification",
      needsBusinessTypeClarification: true,
      lastAssistantIntent: "clarify",
      recentTalkingPoints: [
        "business_model_clarification",
        ...context.recentTalkingPoints.filter((point) => point !== "business_model_clarification"),
      ].slice(0, 5),
    },
    recentTalkingPoint: "business_model_clarification",
  };
}

function explicitOfferResponse(
  context: ZoraIntelligenceContext,
): ZoraStructuredResponse | null {
  const detection = detectOpzixOfferIntent(context.userMessage);
  const isDefinitionQuestion =
    /\b(what is|what are|define|meaning of|explain)\b/i.test(context.userMessage) &&
    !/\b(opzix|services?|offer|do you|can you|build|set up|connect)\b/i.test(context.userMessage);
  if (isDefinitionQuestion) return null;

  const solutionDetection = detectSolutionFrameworkIntent({
    message: context.userMessage,
    activeChallenge: context.activeChallenge,
    businessType: context.businessType,
    currentOfferKey: context.currentOfferKey,
    currentTopic: context.currentTopic,
  });
  const directOfferQuestion =
    /\b(what services do you offer|what does opzix do|what can you build|what does opzix build|do you build|can you build|do you offer|can you set up|can you connect|tell me about)\b/i.test(
      context.userMessage,
    );

  if (solutionDetection.isSolutionQuestion && !directOfferQuestion) {
    return null;
  }

  const explicitOfferKey = explicitOfferKeyForMessage(context.userMessage);
  const offerKey = explicitOfferKey || detection.offerKey;

  if (offerKey && (explicitOfferKey || detection.isOfferQuestion || isExplicitOfferTopicSwitch(context.userMessage))) {
    const answer = buildOpzixOfferAnswer({
      offerKey,
      businessType: context.businessType,
      industry:
        context.leadProfile.confirmedIndustry ||
        context.leadProfile.inferredIndustry ||
        String(context.leadProfile.industry || ""),
      websiteUrl: context.websiteUrl,
      userMessage: context.userMessage,
    });
    const updatedState: Record<string, unknown> = {
      currentOfferKey: offerKey,
      lastMentionedOffer: offerKey,
      currentTopic: offerKey,
      currentSubtopic: offerKey,
      lastAssistantIntent: "offer_catalog",
      recentTalkingPoints: [
        answer.recentTalkingPoint,
        ...context.recentTalkingPoints.filter((point) => point !== answer.recentTalkingPoint),
      ].slice(0, 5),
    };

    if (offerKey === "client_dashboard") {
      updatedState.currentPlaybookKey = "client_dashboard";
      updatedState.currentDiscoveryQuestionKey = "dashboard_audience";
      updatedState.lastZoraQuestion = DASHBOARD_AUDIENCE_QUESTION;
      updatedState.lastExpectedAnswerSet = [
        "internal staff",
        "managers",
        "clients",
        "customers",
        "mix",
      ];
    }

    return {
      intent: "offer",
      message: answer.message,
      buttons: structuredActionButtons(["ask_question"]),
      updatedState,
      recentTalkingPoint: answer.recentTalkingPoint,
    };
  }

  if (detection.isOfferQuestion) {
    const answer = buildOpzixProductLineAnswer();
    return {
      intent: "offer",
      message: answer.message,
      buttons: structuredActionButtons(["ask_question"]),
      recentTalkingPoint: "opzix_product_line",
      updatedState: {
        lastAssistantIntent: "offer_catalog",
        recentTalkingPoints: ["opzix_product_line", ...context.recentTalkingPoints].slice(0, 5),
      },
    };
  }

  return null;
}

function isAuditCommitmentMessage(message: string) {
  return /^(lets do it|let us do it|okay lets do it|ok lets do it|sounds good|yes|go ahead|do it|start|run it|start the audit|run the audit|scan it|scan my site)$/.test(
    normalizedText(message),
  );
}

function actionCommitmentResponse(
  context: ZoraIntelligenceContext,
): ZoraStructuredResponse | null {
  if (context.auditContext || !isAuditCommitmentMessage(context.userMessage)) return null;

  const activeFrameworkKey = isZoraSolutionFrameworkKey(context.currentTopic)
    ? context.currentTopic
    : context.recentTalkingPoints.find(isZoraSolutionFrameworkKey);
  const activeFramework = activeFrameworkKey ? getZoraSolutionFramework(activeFrameworkKey) : null;
  const lastRecommendedFreeAudit =
    activeFramework?.recommendedNextStep === "free_audit" ||
    context.lastAssistantIntent === "solution_framework";

  if (!lastRecommendedFreeAudit) return null;

  if (!context.websiteUrl) {
    return {
      intent: "action",
      message: "Absolutely - what website URL should I use for the audit?",
      buttons: structuredActionButtons(["ask_question"]),
      updatedState: {
        lastAssistantIntent: "action_request",
      },
    };
  }

  return {
    intent: "action",
    message: "Absolutely - I'll send you to the free audit with your website prefilled.",
    buttons: [],
    action: {
      type: "start_audit",
      url: context.websiteUrl,
    },
    updatedState: {
      lastAssistantIntent: "action_request",
      lastUserCommand: "start_audit",
    },
    recentTalkingPoint: activeFrameworkKey || "audit_process",
  };
}

function explainerResponse(context: ZoraIntelligenceContext): ZoraStructuredResponse | null {
  const text = normalizedText(context.userMessage);

  if (/^(what is|what are|define|meaning of|explain) tracking$/.test(text)) {
    return {
      intent: "explainer",
      message: [
        "Tracking means measuring the important actions people take across your website and customer journey, not just counting page visits.",
        "In practice, that can include where visitors came from, which pages they viewed, whether they submitted a form, booked a call, clicked a phone number, started checkout, purchased, or became a qualified lead.",
        "Why it matters: without tracking, growth decisions become guesswork because you cannot confidently separate traffic quality, conversion friction, and follow-up problems.",
        "What are you trying to understand first: where visitors come from, whether they convert, or which channel creates the best leads?",
      ].join("\n\n"),
      buttons: structuredActionButtons(["ask_question"]),
      updatedState: {
        currentTopic: "tracking_visibility",
        currentSubtopic: "tracking_definition",
        lastAssistantIntent: "consulting_concept",
        recentTalkingPoints: [
          "tracking_visibility",
          ...context.recentTalkingPoints.filter((point) => point !== "tracking_visibility"),
        ].slice(0, 5),
      },
      recentTalkingPoint: "tracking_visibility",
    };
  }

  return null;
}

function solutionFollowUpResponse(
  context: ZoraIntelligenceContext,
): ZoraStructuredResponse | null {
  const text = normalizedText(context.userMessage);
  const isConversionThread =
    context.currentTopic === "conversion_improvement" ||
    context.lastAssistantIntent === "solution_framework" ||
    context.recentTalkingPoints.includes("conversion_improvement");
  const answersConversionFollowUp = /^(service page|form|booking|booking step|homepage|home page|follow up|follow-up)$/.test(
    text,
  );

  if (!isConversionThread || !answersConversionFollowUp) return null;

  if (text === "service page") {
    return {
      intent: "solution_framework",
      message: [
        "That helps. If the service page is where people hesitate, I'd focus on three things first: message clarity, trust proof, and the next-step CTA.",
        "The page needs to quickly answer who the service is for, what problem it solves, why the company is credible, and what the visitor should do next.",
        "Do you want me to explain what I'd check on the service page, or run the free audit to inspect the site?",
      ].join("\n\n"),
      buttons: structuredActionButtons(["free_audit", "strategy_call", "ask_question"]),
      updatedState: {
        currentTopic: "conversion_improvement",
        currentSubtopic: "service_page",
        currentDiscoveryQuestionKey: "conversion_service_page_next_step",
        lastZoraQuestion:
          "Do you want me to explain what I'd check on the service page, or run the free audit to inspect the site?",
        lastExpectedAnswerSet: ["explain", "run the free audit"],
        lastAssistantIntent: "solution_framework",
        recentTalkingPoints: [
          "conversion_improvement",
          ...context.recentTalkingPoints.filter((point) => point !== "conversion_improvement"),
        ].slice(0, 5),
      },
      recentTalkingPoint: "conversion_improvement",
    };
  }

  return {
    intent: "solution_framework",
    message: [
      `That helps. If the ${text} is where people hesitate, I'd inspect that part of the path before recommending a broader rebuild.`,
      "The useful question is whether the visitor has enough clarity, trust, and momentum to take the next step, and whether tracking shows where the drop-off happens.",
      "Do you want me to explain what I'd check there, or run the free audit to inspect the site?",
    ].join("\n\n"),
    buttons: structuredActionButtons(["free_audit", "strategy_call", "ask_question"]),
    updatedState: {
      currentTopic: "conversion_improvement",
      currentSubtopic: text,
      lastAssistantIntent: "solution_framework",
      recentTalkingPoints: [
        "conversion_improvement",
        ...context.recentTalkingPoints.filter((point) => point !== "conversion_improvement"),
      ].slice(0, 5),
    },
    recentTalkingPoint: "conversion_improvement",
  };
}

function solutionFrameworkResponse(
  context: ZoraIntelligenceContext,
): ZoraStructuredResponse | null {
  const detection = detectSolutionFrameworkIntent({
    message: context.userMessage,
    activeChallenge: context.activeChallenge,
    businessType: context.businessType,
    currentOfferKey: context.currentOfferKey,
    currentTopic: context.currentTopic,
  });

  if (!detection.isSolutionQuestion || !detection.frameworkKey) return null;

  const answer = buildSolutionFrameworkAnswer({
    frameworkKey: detection.frameworkKey,
    businessType: context.businessType,
    industry:
      context.leadProfile.confirmedIndustry ||
      context.leadProfile.inferredIndustry ||
      String(context.leadProfile.industry || ""),
    websiteUrl: context.websiteUrl,
    activeChallenge: context.activeChallenge,
    userMessage: context.userMessage,
  });
  const actions = answer.suggestedButtons
    .map((button) => {
      if (button === "Run Free Audit") return "free_audit";
      if (button === "Book Strategy Call") return "strategy_call";
      return "ask_question";
    }) as ZoraResponse["recommendedActions"];

  return {
    intent: "solution_framework",
    message: answer.message,
    buttons: structuredActionButtons(actions),
    updatedState: {
      ...answer.updatedState,
      currentTopic: detection.frameworkKey,
      currentSubtopic: detection.frameworkKey,
      lastAssistantIntent: "solution_framework",
      recentTalkingPoints: [
        detection.frameworkKey,
        ...context.recentTalkingPoints.filter((point) => point !== detection.frameworkKey),
      ].slice(0, 5),
    },
    recentTalkingPoint: answer.recentTalkingPoint,
  };
}

function activeDashboardPlaybookResponse(
  context: ZoraIntelligenceContext,
): ZoraStructuredResponse | null {
  const text = normalizedText(context.userMessage);
  const isDashboardThread =
    context.currentPlaybookKey === "client_dashboard" ||
    context.currentOfferKey === "client_dashboard" ||
    /dashboard/i.test(context.lastZoraQuestion || "");
  const answersAudienceQuestion =
    /\b(internal staff|staff|team|employees|operations|managers?|leadership|owners?|clients?|customers?|mix)\b/.test(
      text,
    );

  if (!isDashboardThread || !answersAudienceQuestion) return null;

  const audience = text.includes("client")
    ? "clients"
    : text.includes("customer")
      ? "customers"
      : text.includes("manager") || text.includes("leadership") || text.includes("owner")
        ? "managers"
        : text.includes("mix")
          ? "a mixed audience"
          : "internal staff";

  return {
    intent: "playbook",
    message: [
      `Got it. For ${audience}, I would design the dashboard around the decisions they need to make, not just a wall of charts.`,
      "The useful version usually shows the current state, what changed, what needs attention, and who owns the next action. For internal staff, that might mean leads waiting on follow-up, booked appointments, support issues, audit activity, revenue or campaign movement, and operational handoffs.",
      "What decisions should this dashboard help them make weekly: traffic/source performance, lead follow-up, operations, revenue, or support workload?",
    ].join("\n\n"),
    buttons: structuredActionButtons(["strategy_call", "ask_question"]),
    updatedState: {
      currentOfferKey: "client_dashboard",
      lastMentionedOffer: "client_dashboard",
      currentPlaybookKey: "client_dashboard",
      currentDiscoveryQuestionKey: "dashboard_decision",
      lastZoraQuestion:
        "What decisions should this dashboard help them make weekly: traffic/source performance, lead follow-up, operations, revenue, or support workload?",
      lastExpectedAnswerSet: [
        "traffic/source performance",
        "lead follow-up",
        "operations",
        "revenue",
        "support workload",
      ],
      lastAssistantIntent: "offer_catalog",
      recentTalkingPoints: [
        "client_dashboard",
        ...context.recentTalkingPoints.filter((point) => point !== "client_dashboard"),
      ].slice(0, 5),
    },
    recentTalkingPoint: "client_dashboard",
  };
}

function auditContextResponse(
  context: ZoraIntelligenceContext,
  baseResponse: ZoraResponse,
): ZoraStructuredResponse | null {
  const audit = context.auditContext;
  if (!audit && !context.leadProfile.auditReportAvailable) return null;

  const text = normalizedText(context.userMessage);
  const asksWhatToFix =
    /\b(what|which)\b.*\b(fix|start|priority|first|next)\b/.test(text) ||
    /\bfix first\b/.test(text);
  const asksForNextStep =
    /\b(next step|what next|get the next step|show me the next step|where do we go from here|what should i do now)\b/.test(
      text,
    );
  const asksToExplain = /\b(explain|what does|why|break down|mean|means)\b/.test(text);
  const auditAcknowledgement =
    /^(ok|okay|sounds good|got it|makes sense|that makes sense|great|cool|nice|understood|thanks|thank you)$/.test(
      text,
    );
  const shortAuditFollowUp =
    /^(traffic|conversion|converting visitors|tracking|lead follow up|follow up|operations|website|customer journey|trust|cta|forms?)$/.test(
      text,
    );
  const baseLostAuditContext =
    /run (the )?(free )?audit|scanner|what type of business|what kind of business|website url|live url/i.test(
      baseResponse.reply,
    );

  if (
    !asksWhatToFix &&
    !asksForNextStep &&
    !asksToExplain &&
    !auditAcknowledgement &&
    !shortAuditFollowUp &&
    !baseLostAuditContext
  ) {
    return null;
  }

  const title =
    audit?.recommendationTitle ||
    context.leadProfile.auditRecommendationTitle ||
    "the top audit recommendation";
  const fix =
    audit?.recommendedFix ||
    context.leadProfile.auditRecommendedFix ||
    "validate the highest-friction part of the customer journey first";
  const concern =
    audit?.primaryConcern ||
    context.leadProfile.auditPrimaryConcern ||
    audit?.businessExplanation ||
    "the audit found a visible customer-journey risk that should be confirmed before guessing at a rebuild";
  const website =
    audit?.websiteUrl || context.leadProfile.auditWebsiteUrl || context.websiteUrl || "this site";

  const nextStepMessage = [
    `Next step: use the audit for ${website} as a validation brief, not as a reason to rerun the scanner.`,
    `Start by confirming ${title}: ${fix}`,
    "Then decide whether this is a routing/context issue, a tracking issue, or a broader customer-journey issue that needs a strategy call to scope correctly.",
    "A good strategy call here would clarify the real entry point, the intended visitor action, what data should be tracked, and whether Opzix should fix the public path, the follow-up system, or both.",
  ].join("\n\n");

  const message = auditAcknowledgement || asksForNextStep
    ? nextStepMessage
    : asksWhatToFix || shortAuditFollowUp || baseLostAuditContext
    ? [
        `Since the audit has already been generated for ${website}, I would start with ${title}.`,
        `Why: ${concern}`,
        `First fix to validate: ${fix}`,
        "I would confirm that priority against the actual visitor path before recommending a broader build or campaign change.",
      ].join("\n\n")
    : [
        `I can explain ${title} from the audit for ${website}.`,
        `Why it matters: ${concern}`,
        `What Opzix would validate first: ${fix}`,
        "Want me to break down the business impact or the implementation order?",
      ].join("\n\n");

  return {
    intent: "audit_context",
    message,
    buttons: structuredActionButtons(["strategy_call", "ask_question"]),
    updatedState: {
      auditReportAvailable: true,
      auditWebsiteUrl: website,
      auditRecommendationTitle: title,
      auditRecommendedFix: fix,
      auditPrimaryConcern: concern,
      lastAssistantIntent: "consultant",
    },
    recentTalkingPoint: "audit_context",
  };
}

function shouldUseCanonicalFallback(context: ZoraIntelligenceContext, baseResponse: ZoraResponse) {
  if (baseResponse.responseMode !== "out_of_scope" && baseResponse.responseMode !== "clarify") {
    return false;
  }

  if (COMMON_IN_SCOPE_TERMS.test(context.userMessage)) {
    return false;
  }

  return /may not have enough context|can't help|cannot help|not sure/i.test(baseResponse.reply);
}

function structuredFromBaseResponse(baseResponse: ZoraResponse): ZoraStructuredResponse {
  const action = baseResponse.action
    ? {
        type: baseResponse.action.type,
        url: "url" in baseResponse.action ? baseResponse.action.url : undefined,
      }
    : undefined;

  return {
    intent: intentFromBaseResponse(baseResponse),
    message: baseResponse.reply,
    buttons: structuredActionButtons(baseResponse.recommendedActions),
    action,
    updatedState: baseResponse.leadProfile,
    recentTalkingPoint: baseResponse.recentTalkingPoint,
  };
}

export function resolveZoraResponse(input: ZoraOrchestratorInput): ZoraStructuredResponse {
  const baseResponse =
    input.baseResponse || buildZoraResponse(input.userMessage, input.leadProfile || {});
  const context = buildZoraIntelligenceContext({
    userMessage: input.userMessage,
    conversationHistory: input.conversationHistory,
    leadProfile: input.leadProfile,
    auditContext: input.auditContext,
    baseResponse,
  });

  if (baseResponse.responseMode === "company_background") {
    return structuredFromBaseResponse(baseResponse);
  }

  if (baseResponse.responseMode === "pricing") {
    return structuredFromBaseResponse(baseResponse);
  }

  if (baseResponse.responseMode === "action_request" || baseResponse.responseMode === "booking_request") {
    return structuredFromBaseResponse(baseResponse);
  }

  const actionCommitment = actionCommitmentResponse(context);
  if (actionCommitment) return actionCommitment;

  const auditAnswer = auditContextResponse(context, baseResponse);
  if (auditAnswer) return auditAnswer;

  const playbookAnswer = activeDashboardPlaybookResponse(context);
  if (playbookAnswer) return playbookAnswer;

  const classificationAnswer = classificationChallengeResponse(context);
  if (classificationAnswer) return classificationAnswer;

  const explainerAnswer = explainerResponse(context);
  if (explainerAnswer) return explainerAnswer;

  const explicitOfferAnswer = explicitOfferResponse(context);
  if (explicitOfferAnswer) return explicitOfferAnswer;

  const solutionFollowUpAnswer = solutionFollowUpResponse(context);
  if (solutionFollowUpAnswer) return solutionFollowUpAnswer;

  const solutionAnswer = solutionFrameworkResponse(context);
  if (solutionAnswer) return solutionAnswer;

  if (shouldUseCanonicalFallback(context, baseResponse)) {
    return {
      intent: "fallback",
      message: ZORA_CANONICAL_FALLBACK,
      buttons: structuredActionButtons(["ask_question"]),
      updatedState: {
        ...baseResponse.leadProfile,
        lastAssistantIntent: "clarify",
      },
    };
  }

  return structuredFromBaseResponse(baseResponse);
}
