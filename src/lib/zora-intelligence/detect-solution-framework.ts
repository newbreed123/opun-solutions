import {
  isZoraSolutionFrameworkKey,
  type ZoraSolutionFrameworkKey,
} from "./solution-frameworks";

type DetectionInput = {
  message: string;
  activeChallenge?: string;
  businessType?: string;
  currentOfferKey?: string;
  currentTopic?: string;
};

type DetectionResult = {
  frameworkKey: ZoraSolutionFrameworkKey | null;
  confidence: "High" | "Moderate" | "Low";
  matchedTerms: string[];
  isSolutionQuestion: boolean;
};

const solutionQuestionPatterns = [
  /\bhow can (you|opzix) help\b/i,
  /\bhow can .+\bhelp\b/i,
  /\bhow would (you|opzix) help\b/i,
  /\bwhat would (you|opzix) do\b/i,
  /\bhow would (you|opzix) solve\b/i,
  /\bhelp me with\b/i,
  /\bwhat is the process\b/i,
  /\bwhat would the process look like\b/i,
  /\bhow do we fix\b/i,
  /\bwhat should i do\b/i,
  /\bhow can i improve\b/i,
  /\bhow can i get\b/i,
  /\bhow do i get\b/i,
  /\btell me more\b/i,
  /\bhow does that work\b/i,
  /\bwhat comes next\b/i,
];

const genericServiceListQuestions =
  /\b(what services do you offer|what does opzix do|what can you build|what does opzix build)\b/i;

const directDefinitionQuestions = /\b(what is|what are|define|meaning of|explain)\b/i;

const frameworkTerms: Record<ZoraSolutionFrameworkKey, RegExp[]> = {
  traffic_growth: [
    /\btraffic\b/i,
    /\bmore visitors\b/i,
    /\bwebsite visitors\b/i,
    /\bbring people to (my|the) site\b/i,
    /\bgenerate traffic\b/i,
    /\bpaid traffic\b/i,
    /\borganic traffic\b/i,
  ],
  lead_generation: [
    /\bmore leads?\b/i,
    /\bgenerate leads?\b/i,
    /\bget inquiries\b/i,
    /\bget more customers\b/i,
    /\bmore consultations\b/i,
    /\bmore booked calls?\b/i,
  ],
  conversion_improvement: [
    /\bconversion\b/i,
    /\bnot converting\b/i,
    /\bdo not buy\b/i,
    /\bdon't buy\b/i,
    /\bdo not contact\b/i,
    /\bdon't contact\b/i,
    /\bdo not book\b/i,
    /\bdon't book\b/i,
    /\blow conversion rate\b/i,
    /\bcart abandonment\b/i,
  ],
  follow_up_system: [
    /\bfollow[- ]?up\b/i,
    /\bslow response\b/i,
    /\bmissed leads?\b/i,
    /\bnobody follows up\b/i,
    /\bleads? go cold\b/i,
  ],
  operations_automation: [
    /\boperations?\b/i,
    /\bmanual work\b/i,
    /\brepetitive tasks?\b/i,
    /\binternal workflow\b/i,
    /\bautomate (a |the |my |our )?process\b/i,
    /\badmin work\b/i,
  ],
  tracking_visibility: [
    /\btracking\b/i,
    /\banalytics\b/i,
    /\battribution\b/i,
    /\bga4\b/i,
    /\bpixels?\b/i,
    /\bdon't know what's working\b/i,
    /\bdo not know what is working\b/i,
  ],
  ai_assistant_adoption: [
    /\bai consultant\b/i,
    /\bai assistant\b/i,
    /\bchatbot\b/i,
    /\bai agent\b/i,
    /\bcustomer service bot\b/i,
    /\bautomate questions\b/i,
    /\bai help\b/i,
    /\bai\b/i,
  ],
  ecommerce_growth: [
    /\bshopify store\b/i,
    /\becommerce store\b/i,
    /\bonline store\b/i,
    /\bproduct pages?\b/i,
    /\bcheckout\b/i,
    /\badd to cart\b/i,
    /\bproduct discovery\b/i,
  ],
  business_systems: [
    /\bbusiness systems?\b/i,
    /\bconnected systems?\b/i,
    /\bwebsite plus crm\b/i,
    /\ball[- ]in[- ]one system\b/i,
    /\bdigital transformation\b/i,
    /\bimprove my business\b/i,
  ],
  website_launch: [
    /\bno website\b/i,
    /\bneed a website\b/i,
    /\bbuild a website\b/i,
    /\bnew website\b/i,
    /\blanding page\b/i,
    /\blaunch a site\b/i,
  ],
};

function frameworkForChallenge(challenge?: string): ZoraSolutionFrameworkKey | null {
  const normalized = (challenge || "").toLowerCase();

  if (normalized.includes("traffic")) return "traffic_growth";
  if (normalized.includes("conversion") || normalized.includes("converting")) {
    return "conversion_improvement";
  }
  if (normalized.includes("follow")) return "follow_up_system";
  if (normalized.includes("operation")) return "operations_automation";
  if (normalized.includes("tracking")) return "tracking_visibility";
  if (normalized.includes("not sure")) return "business_systems";
  if (normalized.includes("website")) return "website_launch";
  return null;
}

function frameworkForOffer(offerKey?: string): ZoraSolutionFrameworkKey | null {
  if (!offerKey) return null;

  if (offerKey === "ai_assistant_chatbot") return "ai_assistant_adoption";
  if (offerKey === "crm_email_automation") return "follow_up_system";
  if (offerKey === "analytics_tracking") return "tracking_visibility";
  if (offerKey === "ecommerce_storefront" || offerKey === "ecommerce_audit") {
    return "ecommerce_growth";
  }
  if (offerKey === "website_development") return "website_launch";
  if (offerKey === "business_systems" || offerKey === "backend_integrations") {
    return "business_systems";
  }
  return null;
}

function frameworkForBusinessType(businessType?: string): ZoraSolutionFrameworkKey | null {
  if (!businessType) return null;
  if (/ecommerce/i.test(businessType)) return "ecommerce_growth";
  return null;
}

function termMatchForMessage(message: string) {
  const matches = Object.entries(frameworkTerms)
    .map(([key, patterns]) => {
      const matchedTerms = patterns
        .filter((pattern) => pattern.test(message))
        .map((pattern) => pattern.source.replace(/\\b|\\s|\(\?:|\?|\^|\$|\[|\]/g, ""));

      return {
        key: key as ZoraSolutionFrameworkKey,
        matchedTerms,
      };
    })
    .filter((match) => match.matchedTerms.length > 0)
    .sort((a, b) => b.matchedTerms.length - a.matchedTerms.length);

  return matches[0];
}

export function detectSolutionFrameworkIntent(input: DetectionInput): DetectionResult {
  const message = input.message.trim();
  const currentTopic =
    isZoraSolutionFrameworkKey(input.currentTopic) ? input.currentTopic : undefined;
  const isContinuation =
    Boolean(currentTopic) &&
    /\b(ok|okay|tell me more|more|how does that work|what comes next|why|how much|cost|pricing|next step)\b/i.test(
      message,
    );
  const hasSolutionQuestion = solutionQuestionPatterns.some((pattern) => pattern.test(message));
  const asksForGenericServices = genericServiceListQuestions.test(message);
  const isDefinitionQuestion = directDefinitionQuestions.test(message) && !hasSolutionQuestion;
  const termMatch = termMatchForMessage(message);
  const needPhrase =
    /\b(i need|need|want|trying to|get|generate|bring)\b/i.test(message) && Boolean(termMatch);
  const isSolutionQuestion =
    !asksForGenericServices &&
    !isDefinitionQuestion &&
    (hasSolutionQuestion || isContinuation || needPhrase);

  if (!isSolutionQuestion) {
    return {
      frameworkKey: null,
      confidence: "Low",
      matchedTerms: termMatch?.matchedTerms || [],
      isSolutionQuestion: false,
    };
  }

  const frameworkKey =
    termMatch?.key ||
    (isContinuation ? currentTopic : null) ||
    frameworkForChallenge(input.activeChallenge) ||
    frameworkForOffer(input.currentOfferKey) ||
    frameworkForBusinessType(input.businessType);

  return {
    frameworkKey,
    confidence: termMatch?.key || input.activeChallenge || currentTopic ? "High" : "Moderate",
    matchedTerms: [
      ...(termMatch?.matchedTerms || []),
      ...(input.activeChallenge ? [input.activeChallenge] : []),
      ...(currentTopic ? [currentTopic] : []),
    ],
    isSolutionQuestion,
  };
}
