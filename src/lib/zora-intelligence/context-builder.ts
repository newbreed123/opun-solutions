import type { ZoraLeadProfile, ZoraResponse } from "@/lib/zora-assistant";

export type ZoraConversationHistoryItem = {
  role?: string;
  content?: unknown;
  text?: unknown;
};

export type ZoraAuditContext = {
  source?: string;
  action?: string;
  scanId?: string;
  websiteUrl?: string;
  recommendationId?: string;
  recommendationTitle?: string;
  category?: string;
  severity?: string;
  businessExplanation?: string;
  technicalExplanation?: string;
  recommendedFix?: string;
  suggestedQuestion?: string;
  overallScore?: number;
  overallStatus?: string;
  primaryConcern?: string;
} | null;

export type ZoraIntelligenceContext = {
  userMessage: string;
  conversationHistory: ZoraConversationHistoryItem[];
  leadProfile: ZoraLeadProfile;
  businessType?: ZoraLeadProfile["businessType"];
  challenge?: ZoraLeadProfile["challenge"];
  activeChallenge?: string;
  websiteUrl?: string;
  industryProfile?: ZoraLeadProfile["industryProfile"];
  currentOfferKey?: string;
  currentPlaybookKey?: string;
  currentDiscoveryQuestionKey?: string;
  lastZoraQuestion?: string;
  lastExpectedAnswerSet?: string[];
  currentTopic?: string;
  topicDepth?: number;
  auditContext?: ZoraAuditContext;
  recentTalkingPoints: string[];
  lastAssistantIntent?: string;
};

export type BuildZoraIntelligenceContextInput = {
  userMessage: string;
  conversationHistory?: ZoraConversationHistoryItem[];
  leadProfile?: ZoraLeadProfile;
  auditContext?: ZoraAuditContext;
  baseResponse?: ZoraResponse;
};

export function buildZoraIntelligenceContext(
  input: BuildZoraIntelligenceContextInput,
): ZoraIntelligenceContext {
  const profile = input.baseResponse?.leadProfile || input.leadProfile || {};
  const normalizedAuditContext = input.auditContext || null;

  return {
    userMessage: input.userMessage.trim(),
    conversationHistory: input.conversationHistory || [],
    leadProfile: profile,
    businessType: profile.businessType,
    challenge: profile.challenge,
    activeChallenge: profile.challenge,
    websiteUrl:
      profile.websiteUrl ||
      normalizedAuditContext?.websiteUrl ||
      profile.auditWebsiteUrl,
    industryProfile: profile.industryProfile,
    currentOfferKey: profile.currentOfferKey || profile.lastMentionedOffer,
    currentPlaybookKey: profile.currentPlaybookKey,
    currentDiscoveryQuestionKey: profile.currentDiscoveryQuestionKey,
    lastZoraQuestion: profile.lastZoraQuestion,
    lastExpectedAnswerSet: profile.lastExpectedAnswerSet,
    currentTopic: profile.currentTopic,
    topicDepth: profile.topicDepth || profile.currentTopicDepth,
    auditContext: normalizedAuditContext,
    recentTalkingPoints: (profile.recentTalkingPoints || []).map((point) => String(point)),
    lastAssistantIntent: profile.lastAssistantIntent,
  };
}
