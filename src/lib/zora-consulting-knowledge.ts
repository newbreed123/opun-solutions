import type { ZoraIndustry } from "@/lib/zora-industry-awareness";

export type ZoraConsultingConcept =
  | "tracking_visibility"
  | "conversion_path"
  | "lead_capture"
  | "follow_up_speed"
  | "crm_routing"
  | "booking_flow"
  | "offer_clarity"
  | "product_discovery"
  | "trust_signals"
  | "mobile_ux"
  | "analytics_dashboard"
  | "ai_assistant"
  | "backend_integrations"
  | "support_ticket_flow"
  | "email_sms_automation"
  | "ads_readiness"
  | "website_rebuild"
  | "operations_workflow";

export type ZoraConsultingConceptConfidence = "High" | "Moderate" | "Low";

export type ZoraConsultingIndustryVariant =
  | "ecommerce_dtc"
  | "industrial_b2b_catalog"
  | "marketplace_retail"
  | "real_estate"
  | "healthcare_care"
  | "service_business"
  | "local_service"
  | "education"
  | "restaurant_hospitality"
  | "unknown";

export type ZoraConsultingConceptEntry = {
  concept: ZoraConsultingConcept;
  title: string;
  shortDefinition: string;
  whyItMatters: string;
  businessRisk: string;
  whatGoodLooksLike: string;
  commonMistakes: string[];
  whatOpzixWouldValidate: string[];
  relatedConcepts: ZoraConsultingConcept[];
  industryVariants: Partial<Record<ZoraConsultingIndustryVariant, string>>;
};

type ConceptButton = "Run Free Audit" | "Book Strategy Call" | "Ask Another Question";

const conceptTermMap: Record<ZoraConsultingConcept, string[]> = {
  tracking_visibility: [
    "tracking",
    "analytics",
    "ga4",
    "pixel",
    "attribution",
    "conversion tracking",
    "dashboard",
    "source tracking",
    "roi tracking",
  ],
  follow_up_speed: [
    "follow up",
    "follow-up",
    "response time",
    "speed to lead",
    "leads not contacted",
    "slow replies",
  ],
  crm_routing: ["crm", "routing", "lead assignment", "pipeline", "handoff"],
  offer_clarity: [
    "offer",
    "messaging",
    "headline",
    "value proposition",
    "what should i say",
  ],
  conversion_path: [
    "conversion",
    "funnel",
    "visitors not converting",
    "drop off",
    "drop-off",
    "customer journey",
  ],
  product_discovery: [
    "find products",
    "search",
    "categories",
    "filters",
    "product pages",
    "catalog",
    "sku",
  ],
  ai_assistant: [
    "chatbot",
    "ai assistant",
    "agent",
    "automate questions",
    "qualify leads",
  ],
  booking_flow: ["booking", "calendly", "appointment", "schedule", "intake"],
  ads_readiness: [
    "ads",
    "google ads",
    "meta ads",
    "run traffic",
    "should i advertise",
  ],
  website_rebuild: ["rebuild", "redesign", "new website", "start over"],
  lead_capture: [
    "lead capture",
    "form",
    "forms",
    "capture leads",
    "inquiry",
    "contact form",
  ],
  trust_signals: [
    "trust",
    "reviews",
    "testimonials",
    "proof",
    "case studies",
    "credibility",
  ],
  mobile_ux: ["mobile", "phone", "responsive", "mobile ux", "mobile experience"],
  analytics_dashboard: [
    "analytics dashboard",
    "reporting",
    "report",
    "kpi",
    "metrics",
    "dashboard view",
  ],
  backend_integrations: [
    "integration",
    "integrations",
    "api",
    "backend",
    "connect systems",
    "sync",
  ],
  support_ticket_flow: [
    "support ticket",
    "tickets",
    "customer support",
    "help desk",
    "support queue",
  ],
  email_sms_automation: [
    "email automation",
    "sms",
    "text message",
    "sequence",
    "drip",
    "nurture",
  ],
  operations_workflow: [
    "operations",
    "workflow",
    "manual process",
    "handoff",
    "process automation",
  ],
};

export const zoraConsultingKnowledge: Record<
  ZoraConsultingConcept,
  ZoraConsultingConceptEntry
> = {
  tracking_visibility: {
    concept: "tracking_visibility",
    title: "Tracking Visibility",
    shortDefinition:
      "Tracking visibility means knowing which traffic sources, campaigns, pages, forms, and customer actions are actually producing leads, sales, or appointments.",
    whyItMatters:
      "Without tracking, business decisions become guesswork because the team cannot tell which activity is creating real customer movement.",
    businessRisk:
      "Poor tracking causes wasted ad spend, unclear priorities, duplicate reporting, and confidence in fixes that may not be connected to revenue or qualified demand.",
    whatGoodLooksLike:
      "Good tracking connects traffic source, campaign, page behavior, conversion events, form or booking activity, ecommerce actions, and CRM/source attribution in a dashboard the team can actually use.",
    commonMistakes: [
      "Installing analytics but not defining meaningful conversion events.",
      "Counting page views while losing source attribution after the form or checkout.",
      "Treating every lead or sale as equal without campaign, page, or channel context.",
    ],
    whatOpzixWouldValidate: [
      "GA4 or analytics setup",
      "conversion events",
      "form tracking",
      "booking tracking",
      "ecommerce events",
      "CRM/source attribution",
      "dashboard visibility",
    ],
    relatedConcepts: ["analytics_dashboard", "ads_readiness", "conversion_path", "crm_routing"],
    industryVariants: {
      ecommerce_dtc:
        "For ecommerce, tracking needs to show source, product view, add-to-cart, checkout step, purchase, and abandoned path visibility.",
      real_estate:
        "For real estate, tracking should separate buyer, seller, valuation, showing, and portal-source inquiries so follow-up is tied to intent.",
      healthcare_care:
        "For healthcare and care, tracking should show service-page visits, intake starts, appointment requests, provider/location interest, and compliant routing visibility.",
      service_business:
        "For service businesses, tracking should connect channel, landing page, quote request, booking action, and follow-up outcome.",
    },
  },
  follow_up_speed: {
    concept: "follow_up_speed",
    title: "Follow-Up Speed",
    shortDefinition:
      "Follow-up speed is how quickly a real customer inquiry gets a useful response after submitting a form, booking request, chat, or cart recovery signal.",
    whyItMatters:
      "Intent cools quickly. The longer a prospect waits, the more likely they are to compare alternatives or forget why they reached out.",
    businessRisk:
      "Slow replies waste existing demand, reduce close rate, and make paid traffic look worse than it really is.",
    whatGoodLooksLike:
      "A high-intent inquiry is acknowledged instantly, routed to the right owner, and followed by a relevant next action within minutes.",
    commonMistakes: [
      "Letting forms land in a shared inbox with no owner.",
      "Sending a generic auto-reply without a next step.",
      "Measuring lead volume but not response time or booked outcome.",
    ],
    whatOpzixWouldValidate: [
      "form destination",
      "notification timing",
      "lead owner",
      "CRM task creation",
      "email/SMS response path",
      "missed lead handling",
    ],
    relatedConcepts: ["crm_routing", "email_sms_automation", "booking_flow", "lead_capture"],
    industryVariants: {
      real_estate:
        "For real estate, speed-to-lead is critical because buyers and sellers often contact multiple agents in the same session.",
      healthcare_care:
        "For care and healthcare, delayed intake responses can feel like operational unreliability at the exact moment trust matters most.",
      local_service:
        "For local services, quick reply often determines whether the customer books you or the next provider in search results.",
    },
  },
  crm_routing: {
    concept: "crm_routing",
    title: "CRM Routing",
    shortDefinition:
      "CRM routing is the logic that sends each inquiry to the right pipeline, owner, status, and follow-up path.",
    whyItMatters:
      "A lead is only useful if the business knows who owns it, what it needs, and what should happen next.",
    businessRisk:
      "Weak routing creates lost leads, duplicated outreach, bad reporting, and sales teams chasing the wrong opportunities.",
    whatGoodLooksLike:
      "New contacts are tagged by source and intent, assigned correctly, given a next task, and visible in a pipeline.",
    commonMistakes: [
      "Sending every inquiry to the same list.",
      "Skipping source, service, location, or urgency tags.",
      "Treating form submission as the end of the process instead of the start of a workflow.",
    ],
    whatOpzixWouldValidate: [
      "CRM fields",
      "source attribution",
      "assignment rules",
      "pipeline stages",
      "handoff alerts",
      "follow-up automations",
    ],
    relatedConcepts: ["follow_up_speed", "lead_capture", "email_sms_automation", "operations_workflow"],
    industryVariants: {
      service_business:
        "For service businesses, routing should separate quote requests, urgent requests, booked appointments, and unqualified inquiries.",
      healthcare_care:
        "For healthcare and care, routing should respect service line, location, intake urgency, and compliance-sensitive handling.",
      real_estate:
        "For real estate, routing should separate buyer, seller, valuation, showing, investor, and referral partner intent.",
    },
  },
  offer_clarity: {
    concept: "offer_clarity",
    title: "Offer Clarity",
    shortDefinition:
      "Offer clarity means a visitor can quickly understand who the business helps, what outcome is being offered, why it is credible, and what to do next.",
    whyItMatters:
      "Traffic and design only work when the first promise is clear enough for the right visitor to continue.",
    businessRisk:
      "A vague offer makes good visitors hesitate, compare, or leave before the business has a chance to earn trust.",
    whatGoodLooksLike:
      "The page states the audience, outcome, proof, differentiator, and next step without forcing the visitor to infer the value.",
    commonMistakes: [
      "Leading with broad slogans instead of a concrete outcome.",
      "Using the same message for every audience.",
      "Hiding proof or pricing context too far from the call to action.",
    ],
    whatOpzixWouldValidate: [
      "headline",
      "primary CTA",
      "proof near the CTA",
      "audience specificity",
      "first objection handling",
      "landing-page match to traffic source",
    ],
    relatedConcepts: ["conversion_path", "trust_signals", "ads_readiness", "lead_capture"],
    industryVariants: {
      ecommerce_dtc:
        "For ecommerce, offer clarity should explain why this product, why this brand, and why now.",
      service_business:
        "For service businesses, offer clarity should make the problem, service, outcome, and next consultation step obvious.",
      education:
        "For education, offer clarity should connect program fit, outcomes, credibility, timeline, and application path.",
    },
  },
  conversion_path: {
    concept: "conversion_path",
    title: "Conversion Path",
    shortDefinition:
      "The conversion path is the sequence a visitor follows from first landing on the site to taking the desired action.",
    whyItMatters:
      "Most conversion problems are not one-button problems. They are path problems involving clarity, trust, friction, and timing.",
    businessRisk:
      "A broken path turns traffic into unclear visits, abandoned carts, incomplete forms, or unqualified conversations.",
    whatGoodLooksLike:
      "The visitor can understand the offer, evaluate trust, choose the right next step, and complete the action without unnecessary friction.",
    commonMistakes: [
      "Optimizing isolated page elements without checking the full path.",
      "Sending all traffic to a generic page.",
      "Asking for commitment before enough trust or context exists.",
    ],
    whatOpzixWouldValidate: [
      "landing-page match",
      "CTA sequence",
      "mobile path",
      "form or checkout steps",
      "trust placement",
      "drop-off points",
    ],
    relatedConcepts: ["offer_clarity", "mobile_ux", "tracking_visibility", "lead_capture"],
    industryVariants: {
      ecommerce_dtc:
        "For ecommerce, the path usually runs from ad or search intent to product discovery, product confidence, cart, checkout, and post-purchase follow-up.",
      marketplace_retail:
        "For marketplace or enterprise retail, the path often depends on search, departments, availability, account, cart, and fulfillment clarity.",
      healthcare_care:
        "For healthcare and care, the path runs from service or provider discovery to appointment or intake routing.",
    },
  },
  product_discovery: {
    concept: "product_discovery",
    title: "Product Discovery",
    shortDefinition:
      "Product discovery is how easily shoppers can find the right product, category, size, variant, or solution.",
    whyItMatters:
      "If shoppers cannot find the right option quickly, they rarely reach the point where price, reviews, or checkout even matter.",
    businessRisk:
      "Weak discovery lowers conversion, makes ads less efficient, and hides products that should be selling.",
    whatGoodLooksLike:
      "Search, categories, filters, product cards, and product pages help shoppers narrow choices with confidence.",
    commonMistakes: [
      "Flat categories with weak filters.",
      "Search that does not understand buyer language.",
      "Product cards that hide price, availability, ratings, or core specs.",
    ],
    whatOpzixWouldValidate: [
      "site search",
      "category structure",
      "filters",
      "product-card clarity",
      "product-page confidence",
      "mobile browsing path",
    ],
    relatedConcepts: ["conversion_path", "mobile_ux", "trust_signals", "tracking_visibility"],
    industryVariants: {
      ecommerce_dtc:
        "For DTC ecommerce, discovery should reduce choice friction and make product fit obvious before checkout.",
      industrial_b2b_catalog:
        "For industrial catalogs, discovery should support specs, part numbers, compatibility, documentation, and reorder workflows.",
      marketplace_retail:
        "For marketplace retail, discovery depends on search relevance, department hierarchy, local availability, and filtering at scale.",
    },
  },
  ai_assistant: {
    concept: "ai_assistant",
    title: "AI Assistant",
    shortDefinition:
      "An AI assistant helps answer common questions, qualify intent, guide users to the right next step, and hand useful context to the business.",
    whyItMatters:
      "A good assistant reduces friction without pretending every conversation should become a hard sell.",
    businessRisk:
      "A weak assistant can repeat scripts, misclassify users, route people too early, or create more operational noise.",
    whatGoodLooksLike:
      "The assistant understands the user context, answers direct questions, deepens the current topic, and triggers clear actions only when appropriate.",
    commonMistakes: [
      "Using the assistant as a menu tree instead of a consultant.",
      "Routing based only on generated text.",
      "Forcing a CTA after every answer.",
    ],
    whatOpzixWouldValidate: [
      "qualification flow",
      "intent detection",
      "topic persistence",
      "handoff rules",
      "CRM routing",
      "conversation logging",
    ],
    relatedConcepts: ["lead_capture", "crm_routing", "follow_up_speed", "support_ticket_flow"],
    industryVariants: {
      service_business:
        "For service businesses, an assistant should qualify the request, collect context, and route serious prospects to booking or follow-up.",
      healthcare_care:
        "For care and healthcare, an assistant should support service navigation and intake routing without overstepping compliance boundaries.",
      ecommerce_dtc:
        "For ecommerce, an assistant should answer fit, shipping, return, and product questions while escalating high-intent issues cleanly.",
    },
  },
  booking_flow: {
    concept: "booking_flow",
    title: "Booking Flow",
    shortDefinition:
      "A booking flow is the path from interest to a scheduled appointment, consultation, demo, or intake conversation.",
    whyItMatters:
      "A visitor can be interested and still abandon if scheduling feels confusing, invasive, or disconnected from the promise.",
    businessRisk:
      "Poor booking flows create missed appointments, low-quality calls, and lost prospects who were ready to act.",
    whatGoodLooksLike:
      "The user knows what they are booking, how long it takes, who it is for, what happens next, and receives confirmation quickly.",
    commonMistakes: [
      "Asking too many questions before showing availability.",
      "Using generic calendar language that does not match the offer.",
      "Failing to route booking context into the CRM or operations system.",
    ],
    whatOpzixWouldValidate: [
      "CTA wording",
      "calendar or intake steps",
      "qualification fields",
      "confirmation message",
      "CRM handoff",
      "no-show prevention",
    ],
    relatedConcepts: ["lead_capture", "crm_routing", "follow_up_speed", "conversion_path"],
    industryVariants: {
      real_estate:
        "For real estate, booking should distinguish buyer consultation, seller valuation, showing request, and discovery call.",
      healthcare_care:
        "For healthcare and care, booking should make provider, location, service, availability, and intake expectations clear.",
      restaurant_hospitality:
        "For hospitality, booking should clarify availability, party size, location, confirmation, and special requests.",
    },
  },
  analytics_dashboard: {
    concept: "analytics_dashboard",
    title: "Analytics Dashboard",
    shortDefinition:
      "An analytics dashboard turns scattered performance data into a view the team can use to make decisions.",
    whyItMatters:
      "Teams need one practical view of what is working, what is leaking, and where attention should go next.",
    businessRisk:
      "Without a usable dashboard, teams overreact to noisy metrics or underreact to real problems.",
    whatGoodLooksLike:
      "A dashboard shows traffic, conversions, source quality, funnel steps, follow-up status, and business outcomes in plain language.",
    commonMistakes: [
      "Building dashboards before defining decisions.",
      "Showing vanity metrics without conversion context.",
      "Leaving CRM, ad, booking, and site data disconnected.",
    ],
    whatOpzixWouldValidate: [
      "primary KPIs",
      "data sources",
      "event definitions",
      "source attribution",
      "CRM or ecommerce outcomes",
      "executive summary views",
    ],
    relatedConcepts: ["tracking_visibility", "ads_readiness", "crm_routing", "operations_workflow"],
    industryVariants: {
      ecommerce_dtc:
        "For ecommerce, the dashboard should connect source, product journey, checkout behavior, sales, and repeat purchase indicators.",
      service_business:
        "For service businesses, the dashboard should connect source, form or booking starts, qualified leads, response time, and booked outcomes.",
      healthcare_care:
        "For healthcare and care, dashboards should focus on intake volume, service line interest, appointment requests, and routing latency.",
    },
  },
  ads_readiness: {
    concept: "ads_readiness",
    title: "Ads Readiness",
    shortDefinition:
      "Ads readiness means the website, offer, tracking, and follow-up system are prepared before the business pays for traffic.",
    whyItMatters:
      "Ads amplify whatever path already exists. If the path is unclear, ads make the leak more expensive.",
    businessRisk:
      "A business can burn budget driving traffic into weak messaging, broken tracking, slow follow-up, or a confusing buying path.",
    whatGoodLooksLike:
      "Campaign intent matches the landing page, tracking captures key events, the CTA is clear, and follow-up is ready before spend scales.",
    commonMistakes: [
      "Starting ads before tracking is verified.",
      "Sending cold traffic to a generic homepage.",
      "Judging ad quality without checking conversion and follow-up gaps.",
    ],
    whatOpzixWouldValidate: [
      "campaign intent",
      "landing-page match",
      "offer clarity",
      "conversion tracking",
      "follow-up readiness",
      "dashboard reporting",
    ],
    relatedConcepts: ["offer_clarity", "tracking_visibility", "conversion_path", "follow_up_speed"],
    industryVariants: {
      ecommerce_dtc:
        "For ecommerce, paid traffic should land on a path with product fit, trust, shipping/returns clarity, and checkout visibility.",
      real_estate:
        "For real estate, ads should route to buyer, seller, valuation, or local-market intent instead of a generic homepage.",
      service_business:
        "For service businesses, ads should be tied to a clear service offer, local proof, qualification, and fast follow-up.",
    },
  },
  lead_capture: {
    concept: "lead_capture",
    title: "Lead Capture",
    shortDefinition:
      "Lead capture is the point where visitor intent becomes usable contact and context for follow-up.",
    whyItMatters:
      "The business cannot improve close rate if the site collects too little context, too much friction, or routes inquiries poorly.",
    businessRisk:
      "Weak capture creates low-quality leads, abandoned forms, and unclear next steps for the team.",
    whatGoodLooksLike:
      "Forms or chats collect enough information to route the inquiry while keeping the first step easy to complete.",
    commonMistakes: ["Long forms too early.", "No confirmation step.", "No source or service tagging."],
    whatOpzixWouldValidate: ["form fields", "CTA context", "source capture", "CRM handoff", "confirmation"],
    relatedConcepts: ["crm_routing", "follow_up_speed", "booking_flow", "ai_assistant"],
    industryVariants: {},
  },
  trust_signals: {
    concept: "trust_signals",
    title: "Trust Signals",
    shortDefinition:
      "Trust signals are the proof elements that help a visitor feel safer taking the next step.",
    whyItMatters:
      "Visitors rarely act when the page asks for money, time, or personal information before earning confidence.",
    businessRisk:
      "Missing proof increases hesitation, comparison shopping, form abandonment, and low-quality inquiries.",
    whatGoodLooksLike:
      "Relevant reviews, credentials, guarantees, case evidence, policies, or recognizable proof appear near decision points.",
    commonMistakes: ["Hiding reviews.", "Using generic testimonials.", "Separating proof from the CTA."],
    whatOpzixWouldValidate: ["review placement", "policy clarity", "credentials", "case proof", "CTA support"],
    relatedConcepts: ["offer_clarity", "conversion_path", "product_discovery", "booking_flow"],
    industryVariants: {},
  },
  mobile_ux: {
    concept: "mobile_ux",
    title: "Mobile UX",
    shortDefinition:
      "Mobile UX is how clear, fast, and usable the customer journey feels on a phone.",
    whyItMatters:
      "Many first visits happen on mobile, especially from ads, search, maps, and social traffic.",
    businessRisk:
      "Small mobile friction can quietly reduce conversions even when the desktop site looks polished.",
    whatGoodLooksLike:
      "The mobile path loads quickly, keeps CTAs visible, makes forms easy, and avoids forcing zooming or excessive taps.",
    commonMistakes: ["Desktop-first layouts.", "Hidden CTAs.", "Long mobile forms.", "Slow pages."],
    whatOpzixWouldValidate: ["page speed", "CTA visibility", "navigation", "form friction", "checkout or booking path"],
    relatedConcepts: ["conversion_path", "product_discovery", "booking_flow", "lead_capture"],
    industryVariants: {},
  },
  backend_integrations: {
    concept: "backend_integrations",
    title: "Backend Integrations",
    shortDefinition:
      "Backend integrations connect the website, CRM, ecommerce platform, dashboard, email/SMS tools, and operational systems.",
    whyItMatters:
      "A good front-end experience can still fail if the systems behind it do not pass data reliably.",
    businessRisk:
      "Disconnected systems create manual work, duplicate data, missed follow-up, and unreliable reporting.",
    whatGoodLooksLike:
      "Customer actions move cleanly into the right system with source, status, owner, and next action preserved.",
    commonMistakes: ["Point-to-point fixes with no owner.", "No error monitoring.", "Missing source fields."],
    whatOpzixWouldValidate: ["API connections", "field mapping", "sync timing", "error handling", "data ownership"],
    relatedConcepts: ["crm_routing", "operations_workflow", "analytics_dashboard", "email_sms_automation"],
    industryVariants: {},
  },
  support_ticket_flow: {
    concept: "support_ticket_flow",
    title: "Support Ticket Flow",
    shortDefinition:
      "Support ticket flow is how customer issues are collected, categorized, assigned, and resolved.",
    whyItMatters:
      "Support friction affects retention, reputation, and customer trust after the first conversion.",
    businessRisk:
      "Unclear ticket routing creates slow responses, repeated questions, and poor customer experience.",
    whatGoodLooksLike:
      "Issues are categorized by topic, urgency, customer value, and owner, with status visibility for the team.",
    commonMistakes: ["One shared inbox.", "No priority logic.", "No customer context in the ticket."],
    whatOpzixWouldValidate: ["ticket sources", "categories", "routing rules", "SLA expectations", "customer context"],
    relatedConcepts: ["ai_assistant", "crm_routing", "operations_workflow", "backend_integrations"],
    industryVariants: {},
  },
  email_sms_automation: {
    concept: "email_sms_automation",
    title: "Email/SMS Automation",
    shortDefinition:
      "Email/SMS automation sends timely, relevant messages after a customer action or signal.",
    whyItMatters:
      "Automation keeps follow-up consistent when human teams are busy or when the customer is not ready yet.",
    businessRisk:
      "Poor automation feels generic, misses urgency, or lets interested people go cold.",
    whatGoodLooksLike:
      "Messages are triggered by intent, personalized by context, and connected to the next useful action.",
    commonMistakes: ["One-size-fits-all sequences.", "No source or intent tags.", "No stop or escalation rules."],
    whatOpzixWouldValidate: ["triggers", "segments", "message timing", "CRM fields", "handoff rules"],
    relatedConcepts: ["follow_up_speed", "crm_routing", "lead_capture", "ai_assistant"],
    industryVariants: {},
  },
  website_rebuild: {
    concept: "website_rebuild",
    title: "Website Rebuild",
    shortDefinition:
      "A website rebuild is a larger replacement of site structure, design, platform, or technical foundation.",
    whyItMatters:
      "A rebuild can help when architecture is limiting growth, but it can waste money if the real issue is offer, tracking, or follow-up.",
    businessRisk:
      "Rebuilding without diagnosis can make the same growth leaks more expensive with cleaner code.",
    whatGoodLooksLike:
      "The team knows whether the constraint is technical, strategic, operational, or measurement-related before scoping the rebuild.",
    commonMistakes: ["Treating redesign as strategy.", "Ignoring tracking and CRM handoff.", "Replacing before validating constraints."],
    whatOpzixWouldValidate: ["platform limits", "technical debt", "conversion path", "tracking gaps", "integration needs"],
    relatedConcepts: ["conversion_path", "offer_clarity", "tracking_visibility", "backend_integrations"],
    industryVariants: {},
  },
  operations_workflow: {
    concept: "operations_workflow",
    title: "Operations Workflow",
    shortDefinition:
      "Operations workflow is how customer actions move through people, tools, approvals, and fulfillment after the website interaction.",
    whyItMatters:
      "Growth breaks when demand enters the business faster than the operating system can handle it.",
    businessRisk:
      "Manual handoffs create delays, unclear ownership, inconsistent customer experience, and unreliable reporting.",
    whatGoodLooksLike:
      "Each customer action has a clear owner, system destination, status, timeline, and escalation path.",
    commonMistakes: ["Keeping workflows in inboxes.", "No status tracking.", "No distinction between urgent and routine requests."],
    whatOpzixWouldValidate: ["handoff map", "owners", "system destinations", "automation triggers", "exceptions"],
    relatedConcepts: ["crm_routing", "backend_integrations", "analytics_dashboard", "support_ticket_flow"],
    industryVariants: {},
  },
};

const allConcepts = Object.keys(zoraConsultingKnowledge) as ZoraConsultingConcept[];

export function detectConsultingConcept(message: string): {
  concept: ZoraConsultingConcept | null;
  confidence: ZoraConsultingConceptConfidence;
  matchedTerms: string[];
} {
  const normalized = normalizeText(message);
  const matches = allConcepts
    .map((concept) => {
      const matchedTerms = conceptTermMap[concept].filter((term) =>
        normalized.includes(normalizeText(term)),
      );
      const score = matchedTerms.reduce((total, term) => total + (term.includes(" ") ? 2 : 1), 0);
      return { concept, matchedTerms, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.matchedTerms.join("").length - a.matchedTerms.join("").length);

  const best = matches[0];
  if (!best) {
    return { concept: null, confidence: "Low", matchedTerms: [] };
  }

  const confidence: ZoraConsultingConceptConfidence =
    best.score >= 3 || best.matchedTerms.some((term) => term.includes(" "))
      ? "High"
      : best.score >= 1
        ? "Moderate"
        : "Low";

  return {
    concept: best.concept,
    confidence,
    matchedTerms: best.matchedTerms,
  };
}

export function buildConsultingConceptAnswer(input: {
  concept: ZoraConsultingConcept;
  industry?: ZoraIndustry;
  businessType?: string;
  challenge?: string;
  websiteUrl?: string;
  topicDepth?: number;
}): {
  message: string;
  suggestedButtons: ConceptButton[];
  recentTalkingPoint: string;
} {
  const entry = zoraConsultingKnowledge[input.concept];
  const industryKey = consultingIndustryKey(input.industry);
  const industryVariant =
    entry.industryVariants[industryKey] ||
    entry.industryVariants.unknown ||
    genericIndustryContext(input.businessType, input.challenge);
  const depth = input.topicDepth || 0;

  const message =
    depth <= 0
      ? [
          `${entry.title}: ${entry.shortDefinition}`,
          `Why it matters: ${entry.whyItMatters}`,
          `What good looks like: ${entry.whatGoodLooksLike}`,
          `What Opzix would validate: ${joinReadableList(entry.whatOpzixWouldValidate)}.`,
          `${industryVariant} ${diagnosticQuestion(entry, input, false)}`,
        ].join("\n\n")
      : [
          `One layer deeper: ${entry.businessRisk}`,
          `Business impact: ${businessImpactForConcept(entry.concept)}`,
          `In this context: ${industryVariant}`,
          `A common mistake is ${entry.commonMistakes[0].toLowerCase()}`,
          diagnosticQuestion(entry, input, true),
        ].join("\n\n");

  return {
    message,
    suggestedButtons: ["Ask Another Question"],
    recentTalkingPoint: input.concept,
  };
}

export function isConsultingExperienceQuestion(message: string) {
  return (
    /\b(have you|has opzix|do you|does opzix|can opzix|can you|have y'all|have you all)\b/i.test(message) &&
    /\b(managed|done|set this up|setup|built|implemented|experience|know how|handle|manage)\b/i.test(message)
  );
}

export function buildConsultingExperienceAnswer(input: {
  concept?: ZoraConsultingConcept | null;
  websiteUrl?: string;
}) {
  const concept = input.concept ? zoraConsultingKnowledge[input.concept] : null;
  const focus = concept
    ? `${concept.title.toLowerCase()}, ${joinReadableList(concept.relatedConcepts.map(labelConcept))}`
    : "tracking, conversion paths, customer journeys, AI assistants, CRM routing, dashboards, and operational workflows";
  const nextStep = input.websiteUrl
    ? "With a live URL, the clean next step is to map what is visible first, then decide whether the free audit or a manual strategy review is the better fit."
    : "If you are still mapping the system, the clean next step is a strategy conversation that turns the workflow into a practical implementation plan.";

  return `Yes - Opzix is built specifically around diagnosing and improving ${focus}. I would not claim client-specific history from this chat alone, but the capability is exactly in that lane: map the current path, identify the operational leak, then implement the website, tracking, automation, dashboard, AI assistant, or CRM handoff that solves it. ${nextStep}`;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function consultingIndustryKey(industry?: ZoraIndustry): ZoraConsultingIndustryVariant {
  if (
    industry === "ecommerce_dtc" ||
    industry === "industrial_b2b_catalog" ||
    industry === "marketplace_retail" ||
    industry === "real_estate" ||
    industry === "healthcare_care" ||
    industry === "service_business" ||
    industry === "local_service" ||
    industry === "education" ||
    industry === "restaurant_hospitality"
  ) {
    return industry;
  }

  return "unknown";
}

function genericIndustryContext(businessType?: string, challenge?: string) {
  if (businessType || challenge) {
    return `For this ${[businessType, challenge].filter(Boolean).join(" / ").toLowerCase()} context, I would tie the concept back to the actual customer path instead of treating it as an isolated technical task.`;
  }

  return "Without more business context, I would validate this against the customer journey before recommending a build.";
}

function diagnosticQuestion(
  entry: ZoraConsultingConceptEntry,
  input: { websiteUrl?: string; challenge?: string },
  deeper: boolean,
) {
  const subject = input.websiteUrl ? `on ${input.websiteUrl}` : "in the current journey";
  if (deeper) {
    return `The sharper diagnostic question is: where does ${entry.title.toLowerCase()} break down ${subject} - before the action, during the action, or after the handoff?`;
  }

  return `The first question I would ask is: can you currently see where this is working or breaking ${subject}?`;
}

function businessImpactForConcept(concept: ZoraConsultingConcept) {
  switch (concept) {
    case "tracking_visibility":
    case "analytics_dashboard":
      return "the team can spend confidently because decisions are tied to evidence instead of opinion.";
    case "follow_up_speed":
    case "crm_routing":
    case "email_sms_automation":
      return "existing demand is less likely to leak after a customer has already shown intent.";
    case "conversion_path":
    case "offer_clarity":
    case "product_discovery":
    case "mobile_ux":
    case "trust_signals":
      return "more visitors get enough clarity and confidence to take the next step.";
    case "ai_assistant":
    case "support_ticket_flow":
      return "the business can answer, qualify, and route conversations without adding manual load.";
    case "ads_readiness":
      return "paid traffic has a better chance of creating revenue or qualified demand instead of just visits.";
    case "website_rebuild":
      return "the team avoids spending on a rebuild when a focused fix would solve the actual constraint.";
    case "backend_integrations":
    case "operations_workflow":
    case "lead_capture":
    case "booking_flow":
      return "customer intent moves into the right operating system with less delay and confusion.";
    default:
      return "the team can connect the website experience to a clearer business outcome.";
  }
}

function joinReadableList(items: string[]) {
  if (items.length <= 1) return items[0] || "";
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function labelConcept(concept: ZoraConsultingConcept) {
  return zoraConsultingKnowledge[concept].title.toLowerCase();
}
