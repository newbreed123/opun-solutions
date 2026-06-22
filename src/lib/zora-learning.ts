import {
  hasSupabaseAdminConfig,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";
import type {
  ZoraBusinessType,
  ZoraChallenge,
  ZoraLeadProfile,
  ZoraResponse,
} from "@/lib/zora-assistant";

export type ZoraCtaEvent =
  | "audit_clicked"
  | "strategy_call_clicked"
  | "ask_question_clicked"
  | "faq_opened"
  | "contact_requested"
  | "live_agent_requested"
  | "qualification_completed"
  | "email_submitted";

export type ZoraConversationOutcome =
  | "qualified"
  | "audit_started"
  | "strategy_call_clicked"
  | "abandoned"
  | "unresolved_question"
  | "out_of_scope"
  | "pricing_question_answered";

export type ZoraFailureReason =
  | "intent_missed"
  | "direct_question_not_answered"
  | "repeated_response"
  | "wrong_industry_context"
  | "premature_cta"
  | "no_next_step"
  | "user_requested_human_not_routed"
  | "pricing_question_failed"
  | "audit_request_not_routed"
  | "audit_execution_not_routed"
  | "post_recommendation_loop"
  | "context_reset"
  | "out_of_scope_mishandled";

export type ZoraLearningIntent =
  | "company_background"
  | "pricing_question"
  | "live_agent_request"
  | "review_request"
  | "audit_request"
  | "out_of_scope"
  | "recommendation_request"
  | "consultant_question"
  | "diagnosis"
  | "next_step"
  | "acknowledgement"
  | "unknown";

export type ZoraPlaybook = {
  id: string;
  intent: ZoraLearningIntent;
  businessType?: ZoraBusinessType;
  challenge?: ZoraChallenge;
  questionPattern: RegExp;
  bestResponse: string;
  responseNotes: string;
  primaryCta: "Run Free Audit" | "Book Strategy Call" | "Ask a Question";
  secondaryCta?: "Run Free Audit" | "Book Strategy Call" | "Ask a Question";
  isActive: boolean;
};

export type ZoraFailureRow = {
  id: string;
  created_at: string;
  session_id: string | null;
  user_message: string | null;
  assistant_response: string | null;
  detected_intent: string | null;
  failure_reason: ZoraFailureReason | string | null;
  business_type: string | null;
  challenge: string | null;
  website_url: string | null;
  lead_temperature: string | null;
  reviewed: boolean;
  notes: string | null;
};

export type ZoraLearningRow = {
  id: string;
  created_at: string;
  intent: string | null;
  business_type: string | null;
  challenge: string | null;
  user_message: string | null;
  assistant_response: string | null;
  cta_clicked: string | null;
  conversion_outcome: string | null;
  audit_clicked: boolean;
  strategy_call_clicked: boolean;
  response_score: number | null;
  notes: string | null;
};

export const zoraPlaybooks: ZoraPlaybook[] = [
  {
    id: "pricing_question_default",
    intent: "pricing_question",
    questionPattern: /\b(how much|cost|price|pricing|free audit|audit cost)\b/i,
    bestResponse:
      "The audit is completely free. We use it to give you a data-backed starting point before discussing implementation. If you already have a live website, the audit is usually the fastest next step.",
    responseNotes: "Answer the cost/free question in the first sentence.",
    primaryCta: "Run Free Audit",
    isActive: true,
  },
  {
    id: "live_agent_request_default",
    intent: "live_agent_request",
    questionPattern: /\b(live agent|human|person|someone|talk to|speak to|contact|call me|representative)\b/i,
    bestResponse:
      "Absolutely. If you'd rather speak with a person, the best next step is a strategy call with Opzix.",
    responseNotes: "Route to a human path without over-explaining.",
    primaryCta: "Book Strategy Call",
    isActive: true,
  },
  {
    id: "review_request_default",
    intent: "review_request",
    questionPattern: /\b(review|take a look|thoughts|what do you think|initial opinion)\b/i,
    bestResponse:
      "I can give you a directional review based on the context you've provided, but I won't claim confirmed findings until the audit runs. Directionally, I would look at [context-specific focus areas].",
    responseNotes: "Keep review distinct from scanner execution.",
    primaryCta: "Run Free Audit",
    secondaryCta: "Book Strategy Call",
    isActive: true,
  },
  {
    id: "audit_request_default",
    intent: "audit_request",
    questionPattern: /\b(run|start|scan|audit)\b/i,
    bestResponse:
      "Yes. If you have a live URL, the free audit can scan the site and generate a starting roadmap.",
    responseNotes: "Prefer scanner route when a website URL exists.",
    primaryCta: "Run Free Audit",
    isActive: true,
  },
  {
    id: "out_of_scope_default",
    intent: "out_of_scope",
    questionPattern: /.*/i,
    bestResponse:
      "I probably can't help with that directly. Opzix focuses on websites, ecommerce systems, AI assistants, automation, tracking, dashboards, integrations, and lead generation systems.",
    responseNotes: "Redirect only to relevant Opzix scope.",
    primaryCta: "Ask a Question",
    isActive: true,
  },
];

export function normalizeZoraLearningIntent(
  message: string,
  responseMode?: string,
): ZoraLearningIntent {
  if (responseMode === "company_background") return "company_background";
  if (isPricingQuestion(message)) return "pricing_question";
  if (isHumanRequest(message)) return "live_agent_request";
  if (responseMode === "review_request") return "review_request";
  if (
    responseMode === "audit_request" ||
    responseMode === "scanner_execute" ||
    responseMode === "scanner_failure" ||
    responseMode === "action_request"
  ) {
    return "audit_request";
  }
  if (responseMode === "out_of_scope") return "out_of_scope";
  if (responseMode === "recommendation") return "recommendation_request";
  if (
    responseMode === "consultant" ||
    responseMode === "consulting_concept" ||
    responseMode === "terminology" ||
    responseMode === "trust_skepticism"
  ) {
    return "consultant_question";
  }
  if (responseMode === "diagnosis") return "diagnosis";
  if (responseMode === "next_step" || responseMode === "handoff") return "next_step";
  if (responseMode === "acknowledgement") return "acknowledgement";
  return "unknown";
}

export function selectZoraPlaybook(
  message: string,
  response: ZoraResponse,
): ZoraPlaybook | undefined {
  const intent = normalizeZoraLearningIntent(message, response.responseMode);

  return zoraPlaybooks.find((playbook) => {
    if (!playbook.isActive || playbook.intent !== intent) return false;
    if (
      playbook.businessType &&
      playbook.businessType !== response.leadProfile.businessType
    ) {
      return false;
    }
    if (playbook.challenge && playbook.challenge !== response.leadProfile.challenge) {
      return false;
    }

    return playbook.questionPattern.test(message);
  });
}

export function adaptZoraPlaybookResponse(
  playbook: ZoraPlaybook | undefined,
  response: ZoraResponse,
) {
  if (!playbook) return "";

  if (playbook.intent === "review_request") {
    return response.reply;
  }

  if (playbook.intent === "audit_request") {
    if (!response.leadProfile.websiteUrl) return response.reply;
    return playbook.bestResponse;
  }

  if (playbook.intent === "pricing_question") {
    return response.leadProfile.websiteUrl
      ? playbook.bestResponse
      : "The audit is completely free. If you have a live URL, I can use it as the starting point for the audit.";
  }

  return playbook.bestResponse;
}

export function actionsForZoraPlaybook(
  playbook: ZoraPlaybook | undefined,
): ZoraResponse["recommendedActions"] | undefined {
  if (!playbook) return undefined;

  const actions: ZoraResponse["recommendedActions"] = [];

  [playbook.primaryCta, playbook.secondaryCta].forEach((cta) => {
    if (cta === "Run Free Audit") actions.push("free_audit");
    if (cta === "Book Strategy Call") actions.push("strategy_call");
    if (cta === "Ask a Question") actions.push("ask_question");
  });

  return actions.length ? actions : undefined;
}

export function conversationOutcomeForEvent(
  eventType: string | undefined,
): ZoraConversationOutcome | undefined {
  if (eventType === "audit_clicked") return "audit_started";
  if (eventType === "strategy_call_clicked") return "strategy_call_clicked";
  if (eventType === "qualification_completed") return "qualified";
  return undefined;
}

export function conversationOutcomeForIntent(
  intent: ZoraLearningIntent,
): ZoraConversationOutcome | undefined {
  if (intent === "pricing_question") return "pricing_question_answered";
  if (intent === "out_of_scope") return "out_of_scope";
  return undefined;
}

export function ctaClickedForEvent(eventType: string | undefined) {
  return isCtaEvent(eventType) ? eventType : undefined;
}

export async function logZoraLearningExample(input: {
  intent: ZoraLearningIntent;
  profile: ZoraLeadProfile;
  userMessage: string;
  assistantResponse: string;
  ctaClicked?: string;
  conversionOutcome?: string;
}) {
  if (!hasSupabaseAdminConfig()) return;

  await supabaseAdminFetch<null>("zora_learning", {
    method: "POST",
    body: {
      intent: input.intent,
      business_type: input.profile.businessType || null,
      challenge: input.profile.challenge || null,
      user_message: input.userMessage.slice(0, 1000),
      assistant_response: input.assistantResponse.slice(0, 1200),
      cta_clicked: input.ctaClicked || null,
      conversion_outcome: input.conversionOutcome || null,
      audit_clicked: input.ctaClicked === "audit_clicked",
      strategy_call_clicked: input.ctaClicked === "strategy_call_clicked",
    },
    prefer: "returning=minimal",
  });
}

export async function logZoraFailure(input: {
  sessionId?: string | null;
  profile: ZoraLeadProfile;
  userMessage: string;
  assistantResponse: string;
  detectedIntent: string;
  failureReason: ZoraFailureReason;
}) {
  if (!hasSupabaseAdminConfig()) return;

  await supabaseAdminFetch<null>("zora_failures", {
    method: "POST",
    body: {
      session_id: input.sessionId || null,
      user_message: input.userMessage.slice(0, 1000),
      assistant_response: input.assistantResponse.slice(0, 1200),
      detected_intent: input.detectedIntent,
      failure_reason: input.failureReason,
      business_type: input.profile.businessType || null,
      challenge: input.profile.challenge || null,
      website_url: input.profile.websiteUrl || null,
      lead_temperature: input.profile.leadTemperature || null,
    },
    prefer: "returning=minimal",
  });
}

export function detectZoraFailureReasons(input: {
  userMessage: string;
  assistantResponse: string;
  detectedIntent: string;
  profileBefore?: ZoraLeadProfile;
  profileAfter: ZoraLeadProfile;
  previousAssistantMessages?: string[];
  action?: ZoraResponse["action"];
  recommendedActions?: ZoraResponse["recommendedActions"];
}): ZoraFailureReason[] {
  const reasons = new Set<ZoraFailureReason>();
  const userMessage = input.userMessage;
  const assistantResponse = input.assistantResponse;

  if (
    input.previousAssistantMessages?.some((previous) =>
      areResponsesSimilar(previous, assistantResponse),
    )
  ) {
    reasons.add("repeated_response");
  }

  if (
    isPricingQuestion(userMessage) &&
    !isAuditExecutionRequest(userMessage) &&
    !hasDirectPricingAnswer(assistantResponse)
  ) {
    reasons.add("direct_question_not_answered");
    reasons.add("pricing_question_failed");
  }

  if (isHumanRequest(userMessage) && !routesToHuman(input)) {
    reasons.add("user_requested_human_not_routed");
  }

  if (isAuditExecutionRequest(userMessage) && !routesToAudit(input)) {
    reasons.add("audit_request_not_routed");
  }

  if (isAuditExecutionRequest(userMessage) && !handlesAuditExecution(input)) {
    reasons.add("audit_execution_not_routed");
  }

  if (isPostRecommendationAcknowledgement(userMessage, input.profileBefore) && repeatsRecommendationAfterAck(assistantResponse)) {
    reasons.add("post_recommendation_loop");
  }

  if (
    input.profileBefore?.businessType &&
    /what type of business|what kind of business/i.test(assistantResponse)
  ) {
    reasons.add("context_reset");
  }

  if (
    input.profileBefore?.industry &&
    input.profileAfter.industry &&
    input.profileBefore.industry !== input.profileAfter.industry &&
    !/actually|change|switch|instead|correction|not/i.test(userMessage)
  ) {
    reasons.add("wrong_industry_context");
  }

  if (input.detectedIntent === "out_of_scope" && /run free audit|book strategy/i.test(assistantResponse)) {
    reasons.add("out_of_scope_mishandled");
  }

  if (!input.recommendedActions?.length && !input.action && /what should|next step|help/i.test(userMessage)) {
    reasons.add("no_next_step");
  }

  return Array.from(reasons);
}

export async function listZoraFailures(limit = 500) {
  if (!hasSupabaseAdminConfig()) {
    return {
      ok: false as const,
      data: [] as ZoraFailureRow[],
      error: "Supabase admin environment variables are not configured.",
    };
  }

  const result = await supabaseAdminFetch<ZoraFailureRow[]>("zora_failures", {
    query: {
      select:
        "id,created_at,session_id,user_message,assistant_response,detected_intent,failure_reason,business_type,challenge,website_url,lead_temperature,reviewed,notes",
      order: "created_at.desc",
      limit,
    },
  });

  if (!result.ok) {
    return { ok: false as const, data: [] as ZoraFailureRow[], error: result.error };
  }

  return { ok: true as const, data: result.data ?? [], error: "" };
}

export async function listZoraLearningRows(limit = 1000) {
  if (!hasSupabaseAdminConfig()) {
    return {
      ok: false as const,
      data: [] as ZoraLearningRow[],
      error: "Supabase admin environment variables are not configured.",
    };
  }

  const result = await supabaseAdminFetch<ZoraLearningRow[]>("zora_learning", {
    query: {
      select:
        "id,created_at,intent,business_type,challenge,user_message,assistant_response,cta_clicked,conversion_outcome,audit_clicked,strategy_call_clicked,response_score,notes",
      order: "created_at.desc",
      limit,
    },
  });

  if (!result.ok) {
    return { ok: false as const, data: [] as ZoraLearningRow[], error: result.error };
  }

  return { ok: true as const, data: result.data ?? [], error: "" };
}

export function buildWeeklyZoraLearningReport(input: {
  conversations: Array<{
    latest_user_message?: string | null;
    intent?: string | null;
    business_type?: string | null;
    challenge?: string | null;
    audit_clicked?: boolean;
    strategy_call_clicked?: boolean;
  }>;
  failures: ZoraFailureRow[];
  learningRows: ZoraLearningRow[];
}) {
  const mostAsked = topCounts(
    input.conversations.map((conversation) => conversation.latest_user_message),
  );
  const intents = topCounts(input.conversations.map((conversation) => conversation.intent));
  const failures = topCounts(input.failures.map((failure) => failure.failure_reason));
  const industries = topCounts(input.conversations.map((conversation) => conversation.business_type));
  const challenges = topCounts(input.conversations.map((conversation) => conversation.challenge));
  const auditClicks = input.learningRows.filter((row) => row.audit_clicked).length;
  const strategyClicks = input.learningRows.filter((row) => row.strategy_call_clicked).length;
  const highestConvertingCta =
    auditClicks >= strategyClicks ? "Run Free Audit" : "Book Strategy Call";
  const worstIntent = failures[0]?.label || "No failure pattern yet";

  return [
    "Zora Weekly Learning Report",
    "",
    "Most Asked:",
    ...mostAsked.slice(0, 3).map((row, index) => `${index + 1}. ${row.label}`),
    "",
    `Highest Converting CTA: ${highestConvertingCta}`,
    `Worst Performing Intent: ${worstIntent}`,
    "",
    "Recommended Fixes:",
    failures.length ? `- Improve ${failures[0].label} handling` : "- Keep collecting learning data",
    intents.length ? `- Add stronger playbook coverage for ${intents[0].label}` : "- Review uncategorized intents",
    challenges.length ? `- Tune follow-ups for ${challenges[0].label}` : "- Watch challenge mix as data grows",
    industries.length ? `- Strengthen examples for ${industries[0].label}` : "- Add industry-specific examples",
  ].join("\n");
}

function isPricingQuestion(message: string) {
  return /\b(how much|cost|price|pricing|free|audit cost|is it free)\b/i.test(message);
}

function isHumanRequest(message: string) {
  return /\b(live agent|human|person|someone|talk to|speak to|contact|representative|book a call|strategy call)\b/i.test(
    message,
  );
}

function normalizeCommandText(message: string) {
  return message
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAuditInformationIntent(message: string) {
  const text = normalizeCommandText(message);

  return /^(what is the audit|how much is the audit|is the audit free|is it free audit|is the free audit actually free|explain the audit|what does the scanner do|should i run the audit)$/.test(
    text,
  );
}

function isAuditExecutionRequest(message: string) {
  const text = normalizeCommandText(message);

  if (!text || isAuditInformationIntent(text)) return false;

  return /^(run (the )?(free )?audit|start (the )?(free )?audit|start (the )?scan|scan (my )?(site|website|store)|scan it|audit (my )?(site|website|store)|audit it|diagnose (my )?(site|website|store)|diagnose it|lets run it|run it|ok run it|okay run it|yes run it|go ahead and run it|launch the audit|begin the audit)$/.test(
    text,
  );
}

function hasDirectPricingAnswer(response: string) {
  return /\b(free|cost|pricing|price|audit is free|does not cost|completely free)\b/i.test(
    response,
  );
}

function routesToHuman(input: {
  action?: ZoraResponse["action"];
  recommendedActions?: ZoraResponse["recommendedActions"];
  assistantResponse: string;
}) {
  return Boolean(
    input.action?.type === "book_strategy_call" ||
      input.recommendedActions?.includes("strategy_call") ||
      /strategy call|book/i.test(input.assistantResponse),
  );
}

function routesToAudit(input: {
  action?: ZoraResponse["action"];
  recommendedActions?: ZoraResponse["recommendedActions"];
  assistantResponse: string;
}) {
  return Boolean(
    input.action?.type === "start_audit" ||
      input.recommendedActions?.includes("free_audit") ||
      /free audit|scanner|scan/i.test(input.assistantResponse),
  );
}

function handlesAuditExecution(input: {
  action?: ZoraResponse["action"];
  assistantResponse: string;
}) {
  return Boolean(
    input.action?.type === "start_audit" ||
      /what website should i scan|what website url|which website/i.test(input.assistantResponse) ||
      /no live site|strategy call|launch blueprint/i.test(input.assistantResponse),
  );
}

function isPostRecommendationAcknowledgement(
  message: string,
  profileBefore?: ZoraLeadProfile,
) {
  return Boolean(
    /^(ok|okay|cool|sounds good|nice|makes sense|that makes sense|got it)[.!?]*$/i.test(
      message.trim(),
    ) &&
      (profileBefore?.lastAssistantMode === "high_level_recommendation" ||
        (profileBefore?.lastAssistantMode === "cta_prompt" &&
          Boolean(profileBefore?.postRecommendationAckCount))),
  );
}

function repeatsRecommendationAfterAck(response: string) {
  return (
    response.length > 240 &&
    /\b(what i would validate|what good looks like|what i think is happening|why it matters|expected impact|typical range|timeline|let's stay on|i would focus on)\b/i.test(
      response,
    )
  );
}

function areResponsesSimilar(left: string, right: string) {
  const normalizedLeft = normalizeResponse(left);
  const normalizedRight = normalizeResponse(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;

  const leftWords = new Set(normalizedLeft.split(" "));
  const rightWords = new Set(normalizedRight.split(" "));
  const intersection = Array.from(leftWords).filter((word) => rightWords.has(word)).length;
  const union = new Set([...leftWords, ...rightWords]).size;

  return union > 0 && intersection / union >= 0.88;
}

function normalizeResponse(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function isCtaEvent(eventType: string | undefined): eventType is ZoraCtaEvent {
  return Boolean(
    eventType &&
      [
        "audit_clicked",
        "strategy_call_clicked",
        "ask_question_clicked",
        "faq_opened",
        "contact_requested",
        "live_agent_requested",
      ].includes(eventType),
  );
}

function topCounts(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const label = value?.trim().replace(/\s+/g, " ").slice(0, 120) || "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}
