import type { ConceptDetectionResult, OpzixBrainConcept } from "./types";

const directTerms: Record<OpzixBrainConcept, string[]> = {
  bottleneck: ["bottleneck", "business bottleneck", "growth bottleneck"],
  customer_journey: ["customer journey", "customer path", "buyer journey"],
  landing_page: ["landing page", "benefit of a landing page", "landing pages"],
  tracking_visibility: [
    "tracking visibility",
    "conversion tracking",
    "source tracking",
    "roi tracking",
    "reporting visibility",
  ],
  conversion_path: ["conversion path", "customer journey", "buying path"],
  offer_clarity: ["offer clarity", "value proposition", "unclear promise"],
  lead_capture: ["lead capture", "contact form"],
  follow_up_speed: ["follow up", "follow-up", "response time", "speed to lead"],
  crm_routing: ["crm routing", "lead assignment", "sales process"],
  analytics_dashboard: ["analytics dashboard", "dashboard", "reporting dashboard"],
  automation_workflow: ["automation workflow", "workflow automation", "automated workflow"],
  backend_integration: ["backend integration", "api integration", "system integration"],
  support_ticket_flow: ["support ticket flow", "support tickets", "ticket system", "help desk"],
  ecommerce_storefront: ["ecommerce storefront", "online store", "storefront"],
  google_ads_readiness: ["google ads readiness", "google ads", "paid ads", "ad readiness"],
  product_discovery: ["product discovery", "find products", "product pages"],
  booking_flow: ["booking flow", "appointment", "schedule", "calendly", "consultation"],
  trust_signals: ["trust signals", "reviews", "testimonials", "credibility"],
  ai_assistant: ["ai assistant", "ai agent", "chatbot"],
};

const relatedTerms: Record<OpzixBrainConcept, string[]> = {
  bottleneck: ["stuck", "leak", "constraint", "limiting growth"],
  customer_journey: ["journey", "path", "visitor path", "steps"],
  landing_page: ["ad page", "campaign page", "lead page"],
  tracking_visibility: ["tracking", "analytics", "ga4", "pixel", "attribution"],
  conversion_path: [
    "conversion",
    "funnel",
    "drop off",
    "visitors not converting",
    "user path",
    "run ads",
    "fix my website",
    "fix website",
  ],
  offer_clarity: ["offer", "messaging", "headline", "what should i say"],
  lead_capture: ["form", "inquiry", "request info", "get leads", "submit"],
  follow_up_speed: ["slow replies", "leads not contacted", "missed leads"],
  crm_routing: ["crm", "routing", "pipeline", "handoff"],
  analytics_dashboard: ["metrics", "reporting", "portal", "kpi"],
  automation_workflow: ["automation", "automate", "workflow", "handoff"],
  backend_integration: ["integration", "api", "netsuite", "erp", "connect systems"],
  support_ticket_flow: ["support", "tickets", "customer support", "helpdesk"],
  ecommerce_storefront: ["ecommerce", "shopify", "bigcommerce", "products online"],
  google_ads_readiness: ["ppc", "campaigns", "run ads", "ad management", "underperforming ads"],
  product_discovery: ["search", "categories", "filters", "catalog", "sku"],
  booking_flow: ["booking", "intake"],
  trust_signals: ["trust", "proof", "guarantee", "shipping", "returns", "certifications"],
  ai_assistant: ["automate questions", "qualify leads", "answer customer questions"],
};

export function detectOpzixBrainConcept(message: string): ConceptDetectionResult {
  const text = normalize(message);
  const concepts = Object.keys(directTerms) as OpzixBrainConcept[];
  const ranked = concepts
    .map((concept) => {
      const directMatches = directTerms[concept].filter((term) =>
        text.includes(normalize(term)),
      );
      const relatedMatches = relatedTerms[concept].filter((term) =>
        text.includes(normalize(term)),
      );
      const score = directMatches.length * 3 + relatedMatches.length;
      return {
        concept,
        score,
        directMatches,
        relatedMatches,
        matchedTerms: [...directMatches, ...relatedMatches],
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];

  if (!best) {
    return { concept: null, confidence: "Low", matchedTerms: [] };
  }

  return {
    concept: best.concept,
    confidence: best.directMatches.length ? "High" : "Moderate",
    matchedTerms: best.matchedTerms,
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
