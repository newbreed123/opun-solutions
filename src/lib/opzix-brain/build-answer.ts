import { OPZIX_BRAIN_CONCEPTS } from "./concepts";
import type {
  OpzixBrainButton,
  OpzixBrainConcept,
  OpzixBrainIndustry,
} from "./types";

export function buildOpzixBrainAnswer(input: {
  concept: OpzixBrainConcept;
  industry?: OpzixBrainIndustry;
  businessType?: string;
  challenge?: string;
  websiteUrl?: string;
  topicDepth?: number;
}): {
  message: string;
  suggestedButtons: OpzixBrainButton[];
  recentTalkingPoint: string;
} {
  const entry = OPZIX_BRAIN_CONCEPTS[input.concept];
  const industry = input.industry || "unknown";
  const variant = entry.industryVariants[industry];
  const depth = input.topicDepth || 0;
  const context = [input.businessType, input.challenge].filter(Boolean).join(" / ");

  const message =
    depth > 0
      ? [
          `One layer deeper: ${entry.businessRisk}`,
          `Business impact: ${businessImpact(input.concept)}`,
          variant
            ? `In ${industryLabel(industry)}: ${variant.explanation}`
            : context
              ? `In this ${context.toLowerCase()} context, I would tie the concept back to the actual customer path before prescribing a fix.`
              : "Without more context, I would still map this against the customer journey before prescribing a fix.",
          variant?.examples.length
            ? `Examples I would watch: ${joinList(variant.examples)}.`
            : `Common mistake: ${entry.commonMistakes[0]}`,
          deeperDiagnosticQuestion(input.concept, input.websiteUrl),
        ]
          .filter(Boolean)
          .join("\n\n")
      : [
          directAnswer(input.concept, entry.shortDefinition),
          `It matters because ${lowercaseFirst(entry.whyItMatters)}`,
          `Good ${entry.title.toLowerCase()} looks like this: ${entry.whatGoodLooksLike}`,
          variant ? industrySentence(industry, variant.explanation) : "",
          `From an Opzix perspective, I would validate ${joinList(
            variant?.whatToValidate.length
              ? variant.whatToValidate
              : entry.whatOpzixWouldValidate,
          )}.`,
          diagnosticQuestion(input.concept),
        ]
          .filter(Boolean)
          .join("\n\n");

  return {
    message,
    suggestedButtons: ["Ask Another Question"],
    recentTalkingPoint: input.concept,
  };
}

export function buildOpzixBrainLowConfidenceFallback() {
  return {
    message:
      "I may not have enough context to answer that confidently yet. I can still help by narrowing it down: are you asking about website conversion, tracking, lead capture, follow-up, automation, or operations?",
    suggestedButtons: [
      "Ask Another Question",
    ] as OpzixBrainButton[],
    recentTalkingPoint: "unknown",
  };
}

function directAnswer(concept: OpzixBrainConcept, definition: string) {
  if (concept === "bottleneck") {
    return "A bottleneck is the part of the customer journey or business process that limits growth. For example, if people visit your site but do not submit a form, the bottleneck may be the offer, landing page, or lead capture. If leads come in but no one follows up, the bottleneck may be CRM routing or operations. Opzix focuses on finding the bottleneck first so businesses do not waste money fixing the wrong thing.";
  }

  if (concept === "landing_page") {
    return "A landing page gives one audience one clear path to one action. Unlike a homepage, which usually has many links and audiences, a landing page focuses on a specific offer such as booking a consultation, requesting a quote, downloading a guide, or buying a product. The benefit is less distraction, clearer messaging, better tracking, and a stronger chance that paid traffic turns into leads or sales.";
  }

  if (concept === "tracking_visibility") {
    return "Tracking helps you see what is actually working. " + definition;
  }

  if (concept === "follow_up_speed") {
    return "Follow-up matters because customer intent fades quickly. " + definition;
  }

  return definition;
}

function businessImpact(concept: OpzixBrainConcept) {
  switch (concept) {
    case "bottleneck":
    case "customer_journey":
    case "landing_page":
    case "tracking_visibility":
    case "analytics_dashboard":
    case "google_ads_readiness":
      return "the team can prioritize from evidence instead of opinions about what might be working.";
    case "conversion_path":
    case "offer_clarity":
    case "trust_signals":
      return "more of the traffic you already have gets a fair chance to become revenue or qualified demand.";
    case "lead_capture":
    case "booking_flow":
    case "crm_routing":
    case "follow_up_speed":
      return "existing intent is less likely to leak after a visitor has already raised their hand.";
    case "product_discovery":
    case "ecommerce_storefront":
      return "shoppers can reach the right option faster, which improves the odds that product-page and checkout work actually matter.";
    case "ai_assistant":
      return "the business can answer, qualify, and route conversations without adding manual load.";
    case "automation_workflow":
    case "backend_integration":
    case "support_ticket_flow":
      return "the business can reduce manual work and make operational handoffs more reliable.";
    default:
      return "the business can connect customer experience to clearer operational outcomes.";
  }
}

function diagnosticQuestion(concept: OpzixBrainConcept) {
  switch (concept) {
    case "bottleneck":
      return "Where does growth feel stuck right now: before leads come in, after leads come in, during purchase, or inside operations?";
    case "landing_page":
      return "Is the landing page meant to drive form submissions, booked calls, purchases, quote requests, or another action?";
    case "analytics_dashboard":
      return "Who needs the dashboard first: internal staff, managers, clients, customers, or a mix?";
    case "google_ads_readiness":
      return "Are you launching ads for the first time, fixing underperforming ads, or making sure tracking is set up correctly?";
    case "tracking_visibility":
      return "Are you trying to understand tracking for ads, website leads, ecommerce sales, or internal operations?";
    case "conversion_path":
      return "Where do visitors seem to lose momentum: before the main action, during the action, or after the handoff?";
    case "offer_clarity":
      return "Is the visitor unclear about who the offer is for, what they get, why to trust it, or what to do next?";
    case "follow_up_speed":
      return "Do new inquiries currently get a useful response within minutes, hours, or the next business day?";
    default:
      return "Which part of this are you trying to improve first: visibility, conversion, follow-up, automation, or operations?";
  }
}

function deeperDiagnosticQuestion(concept: OpzixBrainConcept, websiteUrl?: string) {
  const context = websiteUrl ? ` on ${websiteUrl}` : "";
  return `The sharper diagnostic question is: where does ${concept.replace(/_/g, " ")} break down${context} - before the visitor acts, while they act, or after the handoff?`;
}

function industryLabel(industry: OpzixBrainIndustry) {
  return industry.replace(/_/g, " ");
}

function industrySentence(industry: OpzixBrainIndustry, explanation: string) {
  if (/^for\s+/i.test(explanation)) return explanation;
  return `For ${industryLabel(industry)}, ${lowercaseFirst(explanation)}`;
}

function joinList(items: string[]) {
  if (items.length <= 1) return items[0] || "";
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function lowercaseFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
