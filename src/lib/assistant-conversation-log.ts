import {
  hasSupabaseAdminConfig,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";

export type AssistantConversationLogInput = {
  scanId?: string | null;
  domain?: string | null;
  question: string;
  detectedIntent: string;
  intentConfidence: string;
  answerPreview?: string | null;
  siteType?: string | null;
  score?: number | null;
  scoringConfidence?: string | null;
  leadSubmitted?: boolean;
  contactClicked?: boolean;
};

export type AssistantConversationRow = {
  id: string;
  scan_id: string | null;
  domain: string | null;
  question: string;
  detected_intent: string;
  intent_confidence: string;
  answer_preview: string | null;
  site_type: string | null;
  score: number | null;
  scoring_confidence: string | null;
  lead_submitted: boolean;
  contact_clicked: boolean;
  created_at: string;
};

export async function logAssistantConversation(
  input: AssistantConversationLogInput,
) {
  if (!hasSupabaseAdminConfig()) {
    console.warn(
      "Assistant conversation logging skipped: Supabase admin environment variables are not configured.",
    );
    return { ok: false as const, skipped: true, error: "not-configured" };
  }

  try {
    const result = await supabaseAdminFetch<null>("assistant_conversations", {
      method: "POST",
      body: {
        scan_id: input.scanId || null,
        domain: input.domain || null,
        question: input.question,
        detected_intent: input.detectedIntent,
        intent_confidence: input.intentConfidence,
        answer_preview: input.answerPreview?.slice(0, 500) || null,
        site_type: input.siteType || null,
        score:
          typeof input.score === "number" && Number.isFinite(input.score)
            ? Math.round(input.score)
            : null,
        scoring_confidence: input.scoringConfidence || null,
        lead_submitted: input.leadSubmitted ?? false,
        contact_clicked: input.contactClicked ?? false,
      },
      prefer: "returning=minimal",
    });

    if (!result.ok) {
      console.warn("Assistant conversation logging failed:", result.error);
      return { ok: false as const, skipped: false, error: result.error };
    }

    return { ok: true as const, skipped: false, error: "" };
  } catch (error) {
    console.warn("Assistant conversation logging failed:", error);
    return {
      ok: false as const,
      skipped: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function listAssistantConversations(limit = 1000) {
  if (!hasSupabaseAdminConfig()) {
    return {
      ok: false as const,
      data: [] as AssistantConversationRow[],
      error: "Supabase admin environment variables are not configured.",
    };
  }

  try {
    const result = await supabaseAdminFetch<AssistantConversationRow[]>(
      "assistant_conversations",
      {
        query: {
          select:
            "id,scan_id,domain,question,detected_intent,intent_confidence,answer_preview,site_type,score,scoring_confidence,lead_submitted,contact_clicked,created_at",
          order: "created_at.desc",
          limit,
        },
      },
    );

    if (!result.ok) {
      return {
        ok: false as const,
        data: [] as AssistantConversationRow[],
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
      data: [] as AssistantConversationRow[],
      error:
        error instanceof Error
          ? error.message
          : "Could not reach assistant conversation storage.",
    };
  }
}
