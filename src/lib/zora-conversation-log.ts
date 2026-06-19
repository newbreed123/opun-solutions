import {
  hasSupabaseAdminConfig,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";
import {
  scoreZoraLead,
  scoreZoraLeadTemperature,
  type ZoraLeadProfile,
  type ZoraLeadTemperature,
} from "@/lib/zora-assistant";

export type ZoraConversationMetadata = {
  sessionId?: string | null;
  currentStep?: string | null;
  sourcePath?: string | null;
  userAgent?: string | null;
  eventType?: string | null;
};

export type ZoraConversationRow = {
  id: string;
  created_at: string;
  session_id: string | null;
  business_type: string | null;
  challenge: string | null;
  website_url: string | null;
  platform_hint: string | null;
  inferred_industry: string | null;
  inferred_business_model: string | null;
  inferred_funnel_type: string | null;
  industry_confidence: number | null;
  optional_revenue_mention: string | null;
  current_step: string | null;
  recommended_next_step: string | null;
  recommendation_roadmap: unknown | null;
  lead_score: number | null;
  lead_temperature: ZoraLeadTemperature | null;
  latest_user_message: string | null;
  latest_assistant_message: string | null;
  source_path: string | null;
  user_agent: string | null;
  audit_clicked: boolean;
  strategy_call_clicked: boolean;
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
    const result = await supabaseAdminFetch<null>("zora_conversations", {
      method: "POST",
      body: {
        session_id: metadata.sessionId || null,
        business_type: profile.businessType || null,
        challenge: profile.challenge || null,
        website_url: profile.websiteUrl || null,
        platform_hint: profile.platform || null,
        inferred_industry: profile.inferredIndustry || null,
        inferred_business_model: profile.inferredBusinessModel || null,
        inferred_funnel_type: profile.inferredFunnelType || null,
        industry_confidence:
          typeof profile.industryConfidence === "number"
            ? profile.industryConfidence
            : null,
        optional_revenue_mention: profile.annualRevenueText || profile.revenueRange || null,
        current_step: metadata.currentStep || metadata.eventType || null,
        recommended_next_step: profile.recommendedNextStep || null,
        recommendation_roadmap: profile.recommendationRoadmap || null,
        lead_score: scoreZoraLead(profile),
        lead_temperature: scoreZoraLeadTemperature(profile, metadata.eventType || undefined),
        latest_user_message: userMessage.slice(0, 1000),
        latest_assistant_message: assistantMessage.slice(0, 1200),
        source_path: metadata.sourcePath || null,
        user_agent: metadata.userAgent || null,
        email_submitted: Boolean(profile.email),
      },
      prefer: "returning=minimal",
    });

    if (!result.ok) {
      warnInDevelopment("Zora lead logging failed:", result.error);
      return { ok: false as const, skipped: false, error: result.error };
    }

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
      ? { audit_clicked: true }
      : eventType === "strategy_call_clicked"
        ? { strategy_call_clicked: true }
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
            "id,created_at,session_id,business_type,challenge,website_url,platform_hint,inferred_industry,inferred_business_model,inferred_funnel_type,industry_confidence,optional_revenue_mention,current_step,recommended_next_step,recommendation_roadmap,lead_score,lead_temperature,latest_user_message,latest_assistant_message,source_path,user_agent,audit_clicked,strategy_call_clicked,email_submitted",
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

function warnInDevelopment(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(...args);
  }
}
