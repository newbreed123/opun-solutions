import {
  getZoraSolutionFramework,
  type ZoraSolutionFrameworkKey,
} from "./solution-frameworks";

type ButtonLabel = "Run Free Audit" | "Book Strategy Call" | "Ask Another Question";

type BuildInput = {
  frameworkKey: ZoraSolutionFrameworkKey;
  businessType?: string;
  industry?: string;
  websiteUrl?: string;
  activeChallenge?: string;
  userMessage: string;
};

function contextSentence(input: BuildInput) {
  const pieces = [
    input.activeChallenge ? `your main challenge is ${input.activeChallenge.toLowerCase()}` : "",
    input.businessType ? `you described this as ${input.businessType}` : "",
    input.websiteUrl ? `you shared ${input.websiteUrl}` : "",
  ].filter(Boolean);

  return pieces.length ? `Since ${pieces.join(" and ")}, ` : "";
}

function challengeLabel(input: BuildInput) {
  return input.activeChallenge?.toLowerCase() || "this challenge";
}

function normalizedIndustryKey(input: BuildInput) {
  const source = `${input.industry || ""} ${input.businessType || ""}`.toLowerCase();
  if (/ecommerce|shopify|bigcommerce|store/.test(source)) return "ecommerce";
  if (/service/.test(source)) return "service";
  return "";
}

function buttonsForFramework(
  frameworkKey: ZoraSolutionFrameworkKey,
  hasWebsite: boolean,
  recommendedNextStep: "free_audit" | "strategy_call" | "ask_followup",
): ButtonLabel[] {
  if (frameworkKey === "traffic_growth" && !hasWebsite) {
    return ["Book Strategy Call", "Ask Another Question"];
  }

  if (recommendedNextStep === "free_audit") {
    return ["Run Free Audit", "Book Strategy Call", "Ask Another Question"];
  }

  if (recommendedNextStep === "strategy_call") {
    return hasWebsite
      ? ["Book Strategy Call", "Run Free Audit", "Ask Another Question"]
      : ["Book Strategy Call", "Ask Another Question"];
  }

  return ["Ask Another Question", "Book Strategy Call"];
}

export function buildSolutionFrameworkAnswer(input: BuildInput): {
  message: string;
  suggestedButtons: ButtonLabel[];
  recentTalkingPoint: string;
  updatedState?: Record<string, unknown>;
} {
  const framework = getZoraSolutionFramework(input.frameworkKey);
  const industryVariant = framework.industryVariants?.[normalizedIndustryKey(input)];
  const checks = (industryVariant?.firstThingsToCheck || framework.firstThingsToCheck).slice(0, 5);
  const howOpzixHelps = framework.howOpzixHelps.slice(0, 5);
  const frame = industryVariant?.frame || framework.consultantFrame;
  const nextStep =
    framework.recommendedNextStep === "free_audit" && !input.websiteUrl
      ? "strategy_call"
      : framework.recommendedNextStep;
  const nextStepSentence =
    nextStep === "free_audit"
      ? "If the site already exists, the best first move is a free audit so we can see whether the issue is visibility, conversion, tracking, or follow-up."
      : nextStep === "strategy_call"
        ? "The best first move is a strategy call so the scope can be mapped before building or automating the wrong thing."
        : "The best next move is to answer one more diagnostic question before choosing the fix.";

  const intro =
    input.frameworkKey === "traffic_growth"
      ? `${contextSentence(input)}I'd first separate traffic volume from traffic quality. More visitors only help if the landing path, offer, tracking, and follow-up system are ready to convert them.`
      : input.frameworkKey === "conversion_improvement"
        ? `${contextSentence(input)}I'd start by finding where interested visitors lose confidence or fail to take the next step.`
        : `${contextSentence(input)}I'd start by diagnosing ${challengeLabel(input)} as a business path problem, not just a technology request. ${framework.problemStatement}`;

  const isContinuation = /\b(tell me more|more|how does that work|what comes next|why)\b/i.test(
    input.userMessage,
  );
  const continuationDetail =
    isContinuation && input.frameworkKey === "traffic_growth"
      ? "Deeper layer: traffic quality and conversion readiness have to be diagnosed together. If the right visitors cannot find the offer, the problem is visibility. If they arrive but do not act, the problem is message, trust, CTA friction, tracking, or follow-up. Opzix would separate those before recommending SEO, ads, page changes, or automation."
      : "";

  const conversionServiceMessage =
    input.frameworkKey === "conversion_improvement" && normalizedIndustryKey(input) === "service"
      ? [
          intro,
          "For a service business, I would look at:\n1. whether the service page clearly explains who the offer is for,\n2. whether the CTA is visible and specific,\n3. whether there is enough proof to build trust,\n4. whether the form or booking path creates friction,\n5. whether follow-up happens quickly after someone reaches out.",
          "Opzix can help by reviewing the live customer path, improving the service-page structure, strengthening trust signals, tightening the CTA, and setting up tracking so we can see where people drop off.",
          input.websiteUrl
            ? "Since you already shared your website, the free audit is the best next step. It can show whether the issue is messaging, page structure, tracking, or follow-up."
            : "Since I do not have a website URL yet, I would first need the site so the review can be grounded in the actual customer path.",
          "Where do people seem to hesitate most: service page, form, booking step, or follow-up?",
        ].join("\n\n")
      : "";
  const displayedFollowUpQuestion = conversionServiceMessage
    ? "Where do people seem to hesitate most: service page, form, booking step, or follow-up?"
    : framework.followUpQuestion;

  const message =
    conversionServiceMessage ||
    [
      intro,
      frame,
      continuationDetail,
      `For your situation, I would look at:\n${checks
        .map((item, index) => `${index + 1}. ${item}`)
        .join("\n")}`,
      `Opzix can help by:\n${howOpzixHelps
        .map((item, index) => `${index + 1}. ${item}`)
        .join("\n")}`,
      nextStepSentence,
      framework.followUpQuestion,
    ].filter(Boolean).join("\n\n");

  return {
    message,
    suggestedButtons: buttonsForFramework(
      input.frameworkKey,
      Boolean(input.websiteUrl),
      framework.recommendedNextStep,
    ),
    recentTalkingPoint: input.frameworkKey,
    updatedState: {
      currentTopic: input.frameworkKey,
      currentSubtopic: input.frameworkKey,
      currentDiscoveryQuestionKey: `${input.frameworkKey}_followup`,
      lastZoraQuestion: displayedFollowUpQuestion,
      lastExpectedAnswerSet:
        input.frameworkKey === "conversion_improvement"
          ? ["service page", "form", "booking step", "follow-up"]
          : undefined,
      lastAssistantIntent: "solution_framework",
      recentTalkingPoints: [input.frameworkKey],
    },
  };
}
