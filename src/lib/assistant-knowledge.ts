export type AssistantIntentName =
  | "cost_estimate"
  | "rebuild_vs_fix"
  | "roi_value"
  | "fix_priority"
  | "explain_finding"
  | "compare_findings"
  | "implementation_plan"
  | "opzix_recommendation"
  | "platform_question"
  | "score_explanation"
  | "benchmark_question"
  | "competitive_question"
  | "revenue_impact"
  | "contact_or_booking"
  | "general_unknown";

export type AssistantIntentConfidence = "High" | "Moderate" | "Low";

export type AssistantIntentDetection = {
  intent: AssistantIntentName;
  confidence: AssistantIntentConfidence;
  matchedPatterns: string[];
};

export type AssistantKnowledgeEntry = {
  intent: AssistantIntentName;
  title: string;
  questionPatterns: string[];
  answerFramework: string[];
  requiredScanFields: string[];
  fallbackAnswer: string;
  ctaStyle: "manual_review" | "compare_options" | "rank_actions" | "book_audit";
};

export const assistantKnowledgeFrameworks: AssistantKnowledgeEntry[] = [
  {
    intent: "cost_estimate",
    title: "Planning Range",
    questionPatterns: [
      "how much",
      "cost",
      "price",
      "budget",
      "estimate",
      "expensive",
      "what would opzix charge",
      "how much would it cost",
    ],
    answerFramework: [
      "Estimated project size",
      "Typical investment range",
      "Timeline",
      "Why this range",
      "Assumptions",
      "Recommended next step",
    ],
    requiredScanFields: [
      "siteType",
      "platform",
      "primaryConcern",
      "topFindings",
      "scoringConfidence",
    ],
    fallbackAnswer:
      "Based on this scan, I would give a directional planning range before treating anything as a final proposal.",
    ctaStyle: "manual_review",
  },
  {
    intent: "rebuild_vs_fix",
    title: "Rebuild vs Fix",
    questionPatterns: [
      "rebuild",
      "new website",
      "build a new store",
      "build a new",
      "new ecommerce store",
      "start over",
      "fix the old one",
      "replace the site",
      "without fixing",
    ],
    answerFramework: [
      "Rebuild recommendation",
      "Why",
      "Improvement planning range",
      "Rebuild planning range",
      "Lowest-risk recommendation",
      "Next step",
    ],
    requiredScanFields: [
      "platform",
      "scoringConfidence",
      "primaryConcern",
      "topFindings",
      "competitiveContext",
    ],
    fallbackAnswer:
      "I would compare the lower-risk fix path against the rebuild path before recommending a full rebuild.",
    ctaStyle: "compare_options",
  },
  {
    intent: "roi_value",
    title: "ROI / Worth Fixing",
    questionPatterns: [
      "worth fixing",
      "worth the fix",
      "worth the cost",
      "roi",
      "return",
      "will this increase sales",
      "business impact",
      "is this worth it",
      "pay off",
      "should i fix",
    ],
    answerFramework: [
      "Is it worth fixing",
      "Highest ROI fix",
      "Business risk",
      "Effort level",
      "Expected type of impact",
      "No guaranteed revenue lift caveat",
    ],
    requiredScanFields: ["revenueImpact", "primaryConcern", "topFindings"],
    fallbackAnswer:
      "The ROI read is directional because the scan does not include private analytics or checkout data.",
    ctaStyle: "rank_actions",
  },
  {
    intent: "fix_priority",
    title: "Fix Priority",
    questionPatterns: [
      "what should i fix first",
      "priority",
      "where should i start",
      "first thing to fix",
      "fix first",
    ],
    answerFramework: [
      "First fix",
      "Why first",
      "What to check",
      "What success looks like",
      "What Opzix would do next",
    ],
    requiredScanFields: ["primaryConcern", "topFindings", "scoreReducers"],
    fallbackAnswer:
      "The first fix should come from the highest-priority customer journey issue in the scan.",
    ctaStyle: "rank_actions",
  },
  {
    intent: "opzix_recommendation",
    title: "Opzix Recommendation",
    questionPatterns: [
      "what would opzix do first",
      "what would opzix fix first",
      "what would you do first",
      "what would you do",
      "where would you start",
      "where should we start",
      "where should i start",
      "what would opzix do",
      "opzix do first",
      "opzix fix first",
    ],
    answerFramework: [
      "What I would do first",
      "Why",
      "What I would validate",
      "Expected impact",
      "What comes second",
    ],
    requiredScanFields: [
      "scoreNarrative",
      "recommendationRoadmap",
      "recommendedNextSteps",
      "revenueImpact",
      "siteType",
    ],
    fallbackAnswer:
      "I would start with the highest-ROI customer journey validation, not the loudest technical finding.",
    ctaStyle: "manual_review",
  },
  {
    intent: "implementation_plan",
    title: "Implementation Plan",
    questionPatterns: [
      "how would you fix it",
      "implementation",
      "steps",
      "roadmap",
      "action plan",
      "what comes next",
      "what is next",
      "next step",
      "how long",
      "timeline",
      "quick wins",
      "30 day",
    ],
    answerFramework: [
      "Quick wins",
      "30-day improvements",
      "Larger project",
      "What to measure",
    ],
    requiredScanFields: [
      "recommendationRoadmap",
      "topFindings",
      "primaryConcern",
      "platform",
    ],
    fallbackAnswer:
      "I would separate this into quick wins, a 30-day cleanup, and any larger project work.",
    ctaStyle: "manual_review",
  },
  {
    intent: "score_explanation",
    title: "Score Explanation",
    questionPatterns: [
      "why this score",
      "why did it score",
      "why did it change",
      "why did the score change",
      "why changed",
      "why did this change",
      "score changed",
      "score change",
      "what changed",
      "what matters most",
      "biggest thing affecting",
      "biggest score reducer",
      "what is hurting",
      "why so low",
      "why so high",
      "why did it get",
      "score 65",
      "why is the score",
    ],
    answerFramework: [
      "Why the score landed here",
      "Positive signals",
      "Reducers",
      "Confidence level",
      "What would change the score",
    ],
    requiredScanFields: [
      "score",
      "positiveSignals",
      "scoreReducers",
      "scoringConfidence",
    ],
    fallbackAnswer:
      "The score reflects the mix of positive commerce signals, reducers, and scoring confidence.",
    ctaStyle: "manual_review",
  },
  {
    intent: "competitive_question",
    title: "Competitive / Benchmark",
    questionPatterns: [
      "competitive",
      "competitor",
      "peer",
      "compare",
      "benchmark",
      "better site",
      "who should this be compared",
    ],
    answerFramework: [
      "Peer set",
      "What stronger peers usually show",
      "How this site compares",
      "What to improve first",
    ],
    requiredScanFields: ["benchmarkGroup", "benchmarkLabel", "competitiveContext"],
    fallbackAnswer:
      "I would compare this against similar pages in the same conversion context.",
    ctaStyle: "manual_review",
  },
  {
    intent: "benchmark_question",
    title: "Benchmark Question",
    questionPatterns: ["benchmark", "percentile", "average", "peer set"],
    answerFramework: [
      "Benchmark group",
      "Benchmark label",
      "Why this comparison",
      "First gap to improve",
    ],
    requiredScanFields: ["benchmarkGroup", "benchmarkLabel"],
    fallbackAnswer:
      "The benchmark is directional and based on visible public-page evidence.",
    ctaStyle: "manual_review",
  },
  {
    intent: "platform_question",
    title: "Platform Question",
    questionPatterns: [
      "platform",
      "shopify",
      "bigcommerce",
      "magento",
      "custom stack",
      "what is it built on",
    ],
    answerFramework: [
      "Platform read",
      "Confidence",
      "Evidence",
      "What to manually confirm",
    ],
    requiredScanFields: ["platform", "scoringConfidence"],
    fallbackAnswer:
      "The platform read should stay conservative until a manual review confirms the stack.",
    ctaStyle: "manual_review",
  },
  {
    intent: "revenue_impact",
    title: "Revenue Impact",
    questionPatterns: [
      "revenue",
      "sales",
      "leads",
      "conversion",
      "business impact",
      "cost money",
    ],
    answerFramework: [
      "Likely business impact",
      "Risk area",
      "Confidence",
      "What to measure",
    ],
    requiredScanFields: ["revenueImpact", "topFindings"],
    fallbackAnswer:
      "The revenue impact is directional because the scan does not include private analytics.",
    ctaStyle: "manual_review",
  },
  {
    intent: "contact_or_booking",
    title: "Contact or Booking",
    questionPatterns: [
      "book",
      "contact",
      "talk to opzix",
      "review this audit",
      "manual review",
      "can opzix help",
    ],
    answerFramework: [
      "How Opzix can help",
      "What we would review",
      "Best next step",
    ],
    requiredScanFields: ["primaryConcern", "topFindings"],
    fallbackAnswer:
      "Opzix can review the scan manually and turn it into a practical fix plan.",
    ctaStyle: "book_audit",
  },
  {
    intent: "compare_findings",
    title: "Compare Findings",
    questionPatterns: ["compare findings", "which is worse", "which matters more"],
    answerFramework: ["Finding A", "Finding B", "Business tradeoff"],
    requiredScanFields: ["topFindings"],
    fallbackAnswer: "I would compare the findings by customer impact and effort.",
    ctaStyle: "rank_actions",
  },
  {
    intent: "explain_finding",
    title: "Explain Finding",
    questionPatterns: ["why does this matter", "explain", "what does this mean"],
    answerFramework: ["Plain-English meaning", "Evidence", "Business meaning"],
    requiredScanFields: ["topFindings"],
    fallbackAnswer:
      "I can explain the scan finding in plain English using the visible evidence.",
    ctaStyle: "manual_review",
  },
];

export function detectAssistantIntent(question: string): AssistantIntentDetection {
  const normalized = normalizeAssistantQuestion(question);

  if (!normalized) {
    return {
      intent: "general_unknown",
      confidence: "Low",
      matchedPatterns: [],
    };
  }

  const scored = assistantKnowledgeFrameworks
    .filter((entry) => entry.intent !== "general_unknown")
    .map((entry) => {
      const matchedPatterns = entry.questionPatterns.filter((pattern) =>
        normalized.includes(normalizeAssistantQuestion(pattern)),
      );

      return {
        intent: entry.intent,
        matchedPatterns,
        score: matchedPatterns.reduce(
          (total, pattern) => total + patternWeight(pattern),
          0,
        ),
      };
    })
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        intentPriority(right.intent) - intentPriority(left.intent) ||
        right.matchedPatterns.length - left.matchedPatterns.length,
    );

  const best = scored[0];

  if (!best) {
    return {
      intent: "general_unknown",
      confidence: "Low",
      matchedPatterns: [],
    };
  }

  return {
    intent: best.intent,
    confidence: best.score >= 4 ? "High" : best.score >= 2 ? "Moderate" : "Low",
    matchedPatterns: best.matchedPatterns,
  };
}

export function getAssistantKnowledgeEntry(intent: AssistantIntentName) {
  return assistantKnowledgeFrameworks.find((entry) => entry.intent === intent);
}

function normalizeAssistantQuestion(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s/-]/g, " ").replace(/\s+/g, " ").trim();
}

function patternWeight(pattern: string) {
  const wordCount = normalizeAssistantQuestion(pattern).split(/\s+/).filter(Boolean).length;
  return wordCount >= 3 ? 3 : wordCount === 2 ? 2 : 1;
}

function intentPriority(intent: AssistantIntentName) {
  const priorities: Partial<Record<AssistantIntentName, number>> = {
    rebuild_vs_fix: 30,
    opzix_recommendation: 28,
    roi_value: 25,
    score_explanation: 22,
    cost_estimate: 20,
    implementation_plan: 15,
    fix_priority: 10,
  };

  return priorities[intent] ?? 0;
}
