import {
  hasSupabaseAdminConfig,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";
import {
  scoreZoraLead,
  scoreZoraLeadTemperature,
  zoraIndustryConfidenceScore,
  type ZoraLeadProfile,
  type ZoraLeadTemperature,
  type ZoraResponse,
} from "@/lib/zora-assistant";
import {
  conversationOutcomeForEvent,
  conversationOutcomeForIntent,
  ctaClickedForEvent,
  detectZoraFailureReasons,
  logZoraFailure,
  logZoraLearningExample,
  normalizeZoraLearningIntent,
  type ZoraConversationOutcome,
} from "@/lib/zora-learning";

export type ZoraConversationMetadata = {
  sessionId?: string | null;
  currentStep?: string | null;
  sourcePath?: string | null;
  userAgent?: string | null;
  eventType?: string | null;
  intent?: string | null;
  conversationStage?: string | null;
  currentTopic?: string | null;
  currentSubtopic?: string | null;
  detectedConcept?: string | null;
  conceptConfidence?: string | null;
  recentTalkingPoint?: string | null;
  ctaClicked?: string | null;
  conversationOutcome?: ZoraConversationOutcome | string | null;
  profileBefore?: ZoraLeadProfile | null;
  previousAssistantMessages?: string[];
  action?: ZoraResponse["action"] | null;
  recommendedActions?: ZoraResponse["recommendedActions"];
  contextEngine?: unknown;
};

export type ZoraConversationRow = {
  id: string;
  created_at: string;
  session_id: string | null;
  business_type: string | null;
  challenge: string | null;
  website_url: string | null;
  platform_hint: string | null;
  industry: string | null;
  inferred_industry: string | null;
  inferred_business_model: string | null;
  inferred_funnel_type: string | null;
  industry_confidence: string | number | null;
  industry_confidence_score: number | null;
  industry_evidence: string[] | null;
  buyer_journey: string | null;
  primary_bottlenecks: string[] | null;
  recommended_focus_areas: string[] | null;
  optional_revenue_mention: string | null;
  current_step: string | null;
  intent: string | null;
  conversation_stage: string | null;
  current_topic: string | null;
  current_subtopic: string | null;
  detected_concept: string | null;
  concept_confidence: string | null;
  recent_talking_point: string | null;
  recommended_next_step: string | null;
  recommendation_roadmap: unknown | null;
  cta_clicked: string | null;
  conversation_outcome: string | null;
  lead_score: number | null;
  lead_temperature: ZoraLeadTemperature | null;
  latest_user_message: string | null;
  latest_assistant_message: string | null;
  source_path: string | null;
  user_agent: string | null;
  audit_clicked: boolean;
  strategy_call_clicked: boolean;
  ask_question_clicked: boolean;
  faq_opened: boolean;
  contact_requested: boolean;
  live_agent_requested: boolean;
  email_submitted: boolean;
};

export async function logZoraConversation(
  profile: ZoraLeadProfile,
  userMessage: string,
  assistantMessage: string,
  metadata: ZoraConversationMetadata = {},
) {
  if (!hasSupabaseAdminConfig()) {
    warnInDevelopment(
      "Zora lead logging skipped: Supabase admin environment variables are not configured.",
    );
    return { ok: false as const, skipped: true, error: "not-configured" };
  }

  try {
    const detectedIntent = normalizeZoraLearningIntent(
      userMessage,
      metadata.intent || metadata.currentStep || metadata.eventType || undefined,
    );
    const ctaClicked = metadata.ctaClicked || ctaClickedForEvent(metadata.eventType || undefined);
    const conversationOutcome =
      metadata.conversationOutcome ||
      conversationOutcomeForEvent(metadata.eventType || undefined) ||
      conversationOutcomeForIntent(detectedIntent) ||
      null;
    const previousAssistantMessages =
      metadata.previousAssistantMessages ||
      (metadata.sessionId
        ? await recentZoraAssistantMessages(metadata.sessionId)
        : []);
    const leadTemperature = scoreZoraLeadTemperature(
      profile,
      metadata.eventType || undefined,
    );
    const result = await supabaseAdminFetch<null>("zora_conversations", {
      method: "POST",
      body: {
        session_id: metadata.sessionId || null,
        business_type: profile.businessType || null,
        challenge: profile.challenge || null,
        website_url: profile.websiteUrl || null,
        platform_hint: profile.platform || null,
        industry: profile.industryProfile?.industry || profile.industry || null,
        inferred_industry: profile.inferredIndustry || null,
        inferred_business_model: profile.inferredBusinessModel || null,
        inferred_funnel_type: profile.inferredFunnelType || null,
        industry_confidence: profile.industryProfile?.confidence || profile.industryConfidence || null,
        industry_confidence_score: zoraIndustryConfidenceScore(profile.industryConfidence),
        industry_evidence:
          profile.industryProfile?.evidence || profile.industryEvidence || null,
        buyer_journey: profile.industryProfile?.buyerJourney || profile.buyerJourney || null,
        primary_bottlenecks:
          profile.industryProfile?.primaryBottlenecks || profile.primaryBottlenecks || null,
        recommended_focus_areas:
          profile.industryProfile?.recommendedFocusAreas ||
          profile.recommendedFocusAreas ||
          null,
        optional_revenue_mention: profile.annualRevenueText || profile.revenueRange || null,
        current_step: metadata.currentStep || metadata.eventType || null,
        intent: detectedIntent,
        conversation_stage:
          metadata.conversationStage || profile.conversationStage || null,
        current_topic: metadata.currentTopic || profile.currentTopic || null,
        current_subtopic: metadata.currentSubtopic || null,
        detected_concept: metadata.detectedConcept || profile.detectedConcept || null,
        concept_confidence: metadata.conceptConfidence || profile.conceptConfidence || null,
        recent_talking_point:
          metadata.recentTalkingPoint ||
          profile.detectedConcept ||
          profile.currentSubtopic ||
          null,
        recommended_next_step: profile.recommendedNextStep || null,
        recommendation_roadmap: profile.recommendationRoadmap || null,
        cta_clicked: ctaClicked || null,
        conversation_outcome: conversationOutcome,
        lead_score: scoreZoraLead(profile),
        lead_temperature: leadTemperature,
        latest_user_message: userMessage.slice(0, 1000),
        latest_assistant_message: assistantMessage.slice(0, 1200),
        source_path: metadata.sourcePath || null,
        user_agent: metadata.userAgent || null,
        ask_question_clicked: metadata.eventType === "ask_question_clicked",
        faq_opened: metadata.eventType === "faq_opened",
        contact_requested: metadata.eventType === "contact_requested",
        live_agent_requested: metadata.eventType === "live_agent_requested",
        email_submitted: Boolean(profile.email),
      },
      prefer: "returning=minimal",
    });

    if (!result.ok) {
      warnInDevelopment("Zora lead logging failed:", result.error);
      return { ok: false as const, skipped: false, error: result.error };
    }

    void logZoraLearningExample({
      intent: detectedIntent,
      profile,
      userMessage,
      assistantResponse: assistantMessage,
      ctaClicked,
      conversionOutcome: conversationOutcome || undefined,
    }).catch((error) => warnInDevelopment("Zora learning logging failed:", error));

    const failureReasons = detectZoraFailureReasons({
      userMessage,
      assistantResponse: assistantMessage,
      detectedIntent,
      profileBefore: metadata.profileBefore || undefined,
      profileAfter: profile,
      previousAssistantMessages,
      action: metadata.action as never,
      recommendedActions: metadata.recommendedActions,
    });

    failureReasons.forEach((failureReason) => {
      void logZoraFailure({
        sessionId: metadata.sessionId,
        profile: {
          ...profile,
          leadTemperature,
        },
        userMessage,
        assistantResponse: assistantMessage,
        detectedIntent,
        failureReason,
      }).catch((error) => warnInDevelopment("Zora failure logging failed:", error));
    });

    return { ok: true as const, skipped: false, error: "" };
  } catch (error) {
    warnInDevelopment("Zora lead logging failed:", error);
    return {
      ok: false as const,
      skipped: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateZoraConversion(
  sessionId: string,
  eventType: string,
  profile: ZoraLeadProfile = {},
  metadata: Omit<ZoraConversationMetadata, "sessionId" | "eventType"> = {},
) {
  if (!sessionId) {
    return { ok: false as const, skipped: true, error: "missing-session-id" };
  }

  if (!hasSupabaseAdminConfig()) {
    warnInDevelopment(
      "Zora conversion tracking skipped: Supabase admin environment variables are not configured.",
    );
    return { ok: false as const, skipped: true, error: "not-configured" };
  }

  const patch =
    eventType === "audit_clicked"
      ? {
          audit_clicked: true,
          cta_clicked: "audit_clicked",
          conversation_outcome: "audit_started",
        }
      : eventType === "strategy_call_clicked"
        ? {
            strategy_call_clicked: true,
            cta_clicked: "strategy_call_clicked",
            conversation_outcome: "strategy_call_clicked",
          }
        : eventType === "ask_question_clicked"
          ? { ask_question_clicked: true, cta_clicked: "ask_question_clicked" }
        : eventType === "faq_opened"
          ? { faq_opened: true, cta_clicked: "faq_opened" }
        : eventType === "contact_requested"
          ? { contact_requested: true, cta_clicked: "contact_requested" }
        : eventType === "live_agent_requested"
          ? { live_agent_requested: true, cta_clicked: "live_agent_requested" }
        : eventType === "qualification_completed"
          ? { conversation_outcome: "qualified" }
        : eventType === "email_submitted"
          ? { email_submitted: true }
          : null;

  try {
    if (patch) {
      const result = await supabaseAdminFetch<null>("zora_conversations", {
        method: "PATCH",
        query: {
          session_id: `eq.${sessionId}`,
        },
        body: {
          ...patch,
          lead_temperature: scoreZoraLeadTemperature(profile, eventType),
          current_step: eventType,
          conversation_stage: profile.conversationStage || null,
          current_topic: profile.currentTopic || null,
          current_subtopic: profile.currentSubtopic || null,
          detected_concept: profile.detectedConcept || null,
          concept_confidence: profile.conceptConfidence || null,
          recent_talking_point: profile.detectedConcept || profile.currentSubtopic || null,
        },
        prefer: "returning=minimal",
      });

      if (!result.ok) {
        warnInDevelopment("Zora conversion update failed:", result.error);
        return { ok: false as const, skipped: false, error: result.error };
      }
    }

    return await logZoraConversation(
      profile,
      eventType,
      eventType,
      {
        ...metadata,
        sessionId,
        eventType,
        currentStep: eventType,
        ctaClicked: ctaClickedForEvent(eventType),
        conversationOutcome: conversationOutcomeForEvent(eventType),
      },
    );
  } catch (error) {
    warnInDevelopment("Zora conversion update failed:", error);
    return {
      ok: false as const,
      skipped: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function listZoraConversations(limit = 1000) {
  if (!hasSupabaseAdminConfig()) {
    return {
      ok: false as const,
      data: [] as ZoraConversationRow[],
      error: "Supabase admin environment variables are not configured.",
    };
  }

  try {
    const result = await supabaseAdminFetch<ZoraConversationRow[]>(
      "zora_conversations",
      {
        query: {
          select:
            "id,created_at,session_id,business_type,challenge,website_url,platform_hint,industry,inferred_industry,inferred_business_model,inferred_funnel_type,industry_confidence,industry_confidence_score,industry_evidence,buyer_journey,primary_bottlenecks,recommended_focus_areas,optional_revenue_mention,current_step,intent,conversation_stage,current_topic,current_subtopic,detected_concept,concept_confidence,recent_talking_point,recommended_next_step,recommendation_roadmap,cta_clicked,conversation_outcome,lead_score,lead_temperature,latest_user_message,latest_assistant_message,source_path,user_agent,audit_clicked,strategy_call_clicked,ask_question_clicked,faq_opened,contact_requested,live_agent_requested,email_submitted",
          order: "created_at.desc",
          limit,
        },
      },
    );

    if (!result.ok) {
      return {
        ok: false as const,
        data: [] as ZoraConversationRow[],
        error: result.error,
      };
    }

    return {
      ok: true as const,
      data: result.data ?? [],
      error: "",
    };
  } catch (error) {
    return {
      ok: false as const,
      data: [] as ZoraConversationRow[],
      error:
        error instanceof Error
          ? error.message
          : "Could not reach Zora conversation storage.",
    };
  }
}

async function recentZoraAssistantMessages(sessionId: string) {
  const result = await supabaseAdminFetch<Array<{ latest_assistant_message: string | null }>>(
    "zora_conversations",
    {
      query: {
        select: "latest_assistant_message",
        session_id: `eq.${sessionId}`,
        order: "created_at.desc",
        limit: 5,
      },
    },
  );

  if (!result.ok) return [];

  return (result.data || [])
    .map((row) => row.latest_assistant_message)
    .filter((value): value is string => Boolean(value));
}

function warnInDevelopment(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(...args);
  }
}
