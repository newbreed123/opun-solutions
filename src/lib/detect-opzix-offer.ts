import {
  getOpzixOffer,
  OPZIX_OFFERS,
  type OpzixOfferKey,
} from "@/lib/opzix-offers";

export type OpzixOfferIntentDetection = {
  offerKey: OpzixOfferKey | null;
  confidence: "High" | "Moderate" | "Low";
  matchedTerms: string[];
  isOfferQuestion: boolean;
};

export type OpzixOfferAnswer = {
  message: string;
  suggestedButtons: Array<"Run Free Audit" | "Book Strategy Call" | "Ask Another Question">;
  recentTalkingPoint: OpzixOfferKey;
};

const explicitOfferTerms: Record<OpzixOfferKey, string[]> = {
  business_systems: [
    "business systems",
    "operations system",
    "growth system",
    "connect my tools",
    "automate my business",
    "customer journey system",
  ],
  website_development: [
    "build a website",
    "need a website",
    "website developer",
    "business website",
    "landing page",
    "redesign my website",
  ],
  ecommerce_storefront: [
    "ecommerce store",
    "online store",
    "shopify store",
    "bigcommerce store",
    "sell products online",
    "dropshipping store",
  ],
  ecommerce_audit: [
    "audit my website",
    "ecommerce audit",
    "website audit",
    "scan my store",
    "conversion audit",
  ],
  ai_assistant_chatbot: [
    "ai consultant",
    "ai chatbot",
    "ai assistant",
    "ai agent",
    "chatbot",
    "virtual assistant",
    "automate questions",
    "customer service bot",
    "lead qualification bot",
    "ai for my business",
    "chatbot for my website",
    "automate customer questions",
  ],
  crm_email_automation: [
    "crm",
    "lead integration",
    "lead routing",
    "lead capture integration",
    "email automation",
    "follow-up automation",
    "lead follow-up",
    "nurture emails",
    "klaviyo",
    "mailchimp",
  ],
  booking_intake_flow: [
    "booking",
    "appointment",
    "intake form",
    "consultation form",
    "request care",
    "application form",
  ],
  analytics_tracking: [
    "tracking",
    "analytics",
    "ga4",
    "google tag manager",
    "conversion tracking",
    "pixels",
    "attribution",
  ],
  backend_integrations: [
    "integration",
    "api integration",
    "netsuite",
    "erp",
    "shopify integration",
    "bigcommerce integration",
    "backend connection",
    "connect systems",
  ],
  client_dashboard: [
    "dashboard",
    "reporting dashboard",
    "admin dashboard",
    "client portal",
    "analytics dashboard",
  ],
  support_ticket_flow: [
    "support tickets",
    "ticket system",
    "help desk",
    "customer support workflow",
  ],
  conversion_optimization: [
    "conversion",
    "cro",
    "improve conversions",
    "not converting",
    "landing page optimization",
  ],
  google_ads_ad_readiness: [
    "do you run google ads",
    "google ads",
    "paid ads",
    "ad management",
    "ppc",
    "campaign strategy",
    "launch ads",
    "underperforming ads",
  ],
  strategy_consulting: [
    "strategy",
    "consulting",
    "consultant",
    "business systems advice",
    "what should i build",
    "help me plan",
  ],
};

const productLineQuestionPatterns = [
  /\bwhat does opzix do\b/i,
  /\bwhat services do you offer\b/i,
  /\bwhat services does opzix offer\b/i,
  /\bcan opzix help my business\b/i,
  /\bwhat can you build\b/i,
  /\bwhat can opzix build\b/i,
  /\bhow can opzix help\b/i,
  /\bwhat do you know\b/i,
  /\bwhat can you help with\b/i,
];

const followUpPatterns = [
  /\btell me more\b/i,
  /\bhow does that work\b/i,
  /\bwhat does that include\b/i,
  /\bwhat is included\b/i,
  /\bhow much\b/i,
  /\bwhat comes next\b/i,
  /\bnext steps?\b/i,
  /\b(they|it|that|this)\s+(need|needs|should|has|have)\s+to\b/i,
  /\bconnect(ed|ing)?\s+(to|with)\b/i,
  /\b(orders?|customers?|products?|inventory|fulfillment|refunds?|financial fields?|leads?)\b/i,
  /\b(two[-\s]?way|both ways|both directions|bidirectional|bi-directional|sync back|sync both)\b/i,
  /\b(all of the above|all of those|everything mentioned|all mentioned|do all|all of it)\b/i,
  /\b(lead qualification|qualify leads?|booking appointments?|customer support|routing inquiries|route inquiries|answering questions?)\b/i,
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesTerm(normalizedMessage: string, term: string) {
  const normalizedTerm = normalize(term);

  if (!normalizedTerm) return false;
  if (/^[a-z0-9+.-]{2,5}$/.test(normalizedTerm)) {
    return new RegExp(`\\b${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      normalizedMessage,
    );
  }

  return normalizedMessage.includes(normalizedTerm);
}

export function isOpzixProductLineQuestion(message: string) {
  return productLineQuestionPatterns.some((pattern) => pattern.test(message));
}

export function isOpzixOfferFollowUp(message: string) {
  return followUpPatterns.some((pattern) => pattern.test(message));
}

export function detectOpzixOfferIntent(message: string): OpzixOfferIntentDetection {
  const normalizedMessage = normalize(message);

  if (
    /\b(what is|what are|benefit of|why does|why is|explain)\b/i.test(message) &&
    /\blanding page(s)?\b/i.test(message)
  ) {
    return {
      offerKey: null,
      confidence: "Low",
      matchedTerms: [],
      isOfferQuestion: false,
    };
  }

  const matches = OPZIX_OFFERS.map((offer) => {
    const terms = [...explicitOfferTerms[offer.key], ...offer.commonUserPhrases];
    const matchedTerms = Array.from(
      new Set(terms.filter((term) => includesTerm(normalizedMessage, term))),
    );

    return {
      offerKey: offer.key,
      matchedTerms,
      score: matchedTerms.reduce((total, term) => total + normalize(term).split(" ").length, 0),
    };
  })
    .filter((match) => match.matchedTerms.length > 0)
    .sort((a, b) => b.score - a.score || b.matchedTerms.length - a.matchedTerms.length);

  const bestMatch = matches[0];

  if (!bestMatch) {
    return {
      offerKey: null,
      confidence: "Low",
      matchedTerms: [],
      isOfferQuestion: isOpzixProductLineQuestion(message),
    };
  }

  const confidence =
    bestMatch.matchedTerms.length >= 2 || bestMatch.score >= 3 ? "High" : "Moderate";

  return {
    offerKey: bestMatch.offerKey,
    confidence,
    matchedTerms: bestMatch.matchedTerms,
    isOfferQuestion: true,
  };
}

function suggestedButtonsForOffer(
  nextStep: ReturnType<typeof getOpzixOffer>["recommendedNextStep"],
): OpzixOfferAnswer["suggestedButtons"] {
  if (nextStep === "free_audit") return ["Run Free Audit", "Ask Another Question"];
  if (nextStep === "strategy_call") return ["Book Strategy Call", "Ask Another Question"];
  return ["Ask Another Question"];
}

function includesAny(message: string, phrases: string[]) {
  const normalizedMessage = normalize(message);
  return phrases.some((phrase) => includesTerm(normalizedMessage, phrase));
}

function offerIncludesSentence(items: string[]) {
  if (items.length <= 4) return items.join(", ");
  return `${items.slice(0, 5).join(", ")}, and ${items[5]}`;
}

function businessContextLabel(businessType?: string, industry?: string) {
  const raw = businessType || industry;
  if (!raw) return "";

  const normalized = raw.replace(/_/g, " ").toLowerCase();
  if (normalized.includes("ecommerce")) return "For an ecommerce business, ";
  if (normalized.includes("service")) return "For a service business, ";
  if (normalized.includes("real estate")) return "For a real estate business, ";
  if (normalized.includes("care") || normalized.includes("health")) {
    return "For a care or healthcare business, ";
  }

  return "";
}

function detectedIntegrationSystems(message: string) {
  const knownSystems = [
    "BigCommerce",
    "NetSuite",
    "Shopify",
    "Klaviyo",
    "Mailchimp",
    "HubSpot",
    "Salesforce",
    "GA4",
    "Google Tag Manager",
    "ERP",
    "CRM",
  ];
  const normalizedMessage = normalize(message);

  return knownSystems.filter((system) => includesTerm(normalizedMessage, system));
}

function detectedIntegrationDataTypes(message: string) {
  const dataTypes = [
    "orders",
    "customers",
    "products",
    "inventory",
    "fulfillment",
    "refunds",
    "financial fields",
    "leads",
    "appointments",
    "reporting data",
  ];
  const normalizedMessage = normalize(message);

  return dataTypes
    .filter((dataType) => includesTerm(normalizedMessage, dataType))
    .sort(
      (a, b) =>
        normalizedMessage.indexOf(normalize(a)) - normalizedMessage.indexOf(normalize(b)),
    );
}

function formatDataTypeList(dataTypes: string[]) {
  if (dataTypes.length <= 1) return dataTypes[0] || "the data";
  if (dataTypes.length === 2) return `${dataTypes[0]} and ${dataTypes[1]}`;
  return `${dataTypes.slice(0, -1).join(", ")}, and ${dataTypes[dataTypes.length - 1]}`;
}

function buildIntegrationDataPriorityAnswer(
  userMessage: string,
  suggestedButtons: OpzixOfferAnswer["suggestedButtons"],
): OpzixOfferAnswer | undefined {
  const dataTypes = detectedIntegrationDataTypes(userMessage);

  if (dataTypes.length < 2) return undefined;

  const priorityList = formatDataTypeList(dataTypes);

  return {
    message: `Got it. If the priority is ${priorityList}, I would scope the integration in that order instead of treating every sync as equal.\n\nFor a Shopify-to-NetSuite or BigCommerce-to-NetSuite workflow, that usually means starting with order creation and customer records, then product mapping, then inventory availability and update timing. The key design choices are field ownership, sync direction, failure handling, and how your team reconciles exceptions.\n\nDo orders need to create sales orders in NetSuite automatically, or should they land somewhere for review first?`,
    suggestedButtons,
    recentTalkingPoint: "backend_integrations",
  };
}

function buildTwoWayIntegrationAnswer(
  suggestedButtons: OpzixOfferAnswer["suggestedButtons"],
): OpzixOfferAnswer {
  return {
    message:
      "Got it. For a two-way integration, I would scope both directions separately instead of treating it as one generic sync.\n\nOne direction is usually storefront to NetSuite: orders, customers, payments, refunds, and fulfillment updates. The other direction is usually NetSuite back to the storefront: inventory availability, product updates, order status, and sometimes pricing or customer account data.\n\nThe next design question is ownership: which system should be the source of truth for products and inventory?",
    suggestedButtons,
    recentTalkingPoint: "backend_integrations",
  };
}

function buildNamedIntegrationAnswer(
  userMessage: string,
  suggestedButtons: OpzixOfferAnswer["suggestedButtons"],
): OpzixOfferAnswer | undefined {
  const systems = detectedIntegrationSystems(userMessage);
  const dataPriorityAnswer = buildIntegrationDataPriorityAnswer(userMessage, suggestedButtons);

  if (dataPriorityAnswer) return dataPriorityAnswer;

  if (/\b(two[-\s]?way|both ways|both directions|bidirectional|bi-directional|sync back|sync both)\b/i.test(userMessage)) {
    return buildTwoWayIntegrationAnswer(suggestedButtons);
  }

  if (systems.includes("BigCommerce") && systems.includes("NetSuite")) {
    return {
      message:
        "Yes. For a BigCommerce-to-NetSuite integration, Opzix would usually start by mapping the exact data flow between the storefront and ERP: orders, customers, products, inventory, fulfillment status, refunds, and financial fields.\n\nThe important part is not just connecting two systems. It is deciding which system owns each record, what triggers each sync, how errors are handled, and what your team needs to see when something fails.\n\nDo you mainly need orders to flow from BigCommerce into NetSuite, inventory or product data synced back to BigCommerce, or a two-way workflow?",
      suggestedButtons,
      recentTalkingPoint: "backend_integrations",
    };
  }

  if (systems.includes("Shopify") && systems.includes("NetSuite")) {
    return {
      message:
        "Yes. For a Shopify-to-NetSuite integration, Opzix would usually start by mapping the storefront-to-ERP workflow: orders, customers, products, inventory, fulfillment status, refunds, and financial fields.\n\nThe important part is deciding which system owns each record, what triggers each sync, how errors are handled, and what your team needs to see when something fails.\n\nDo you mainly need orders to flow from Shopify into NetSuite, inventory or product data synced back to Shopify, or a two-way workflow?",
      suggestedButtons,
      recentTalkingPoint: "backend_integrations",
    };
  }

  if (systems.length >= 2 || /\bconnect\b.+\b(to|with)\b/i.test(userMessage)) {
    const systemLabel = systems.length >= 2 ? systems.join(" and ") : "those systems";

    return {
      message: `Yes. Opzix can help scope and build an integration between ${systemLabel}.\n\nThe first step is mapping the workflow: which data should move, which system should be the source of truth, what should trigger the sync, and how your team should handle errors or exceptions.\n\nWhat information needs to move first: orders, customers, leads, products, inventory, appointments, or reporting data?`,
      suggestedButtons,
      recentTalkingPoint: "backend_integrations",
    };
  }

  return undefined;
}

function buildLeadIntegrationAnswer(
  userMessage: string,
  suggestedButtons: OpzixOfferAnswer["suggestedButtons"],
): OpzixOfferAnswer {
  const systems = detectedIntegrationSystems(userMessage);

  if (systems.includes("NetSuite")) {
    return {
      message:
        "Got it. If the leads need to connect to NetSuite, Opzix would treat that as a lead-routing and CRM/ERP handoff workflow, not just a simple form notification.\n\nThe first step is deciding what should become a record in NetSuite, which fields are required, how the lead should be tagged, and what should happen if NetSuite rejects or duplicates a record.\n\nWhere are those leads coming from today: website forms, Zora/chat, ads, a booking flow, or another source?",
      suggestedButtons,
      recentTalkingPoint: "crm_email_automation",
    };
  }

  return {
    message:
      "Yes. Opzix can help with lead integrations, which usually means connecting the places leads come from, like website forms, chat, landing pages, booking flows, or ads, to the place your team actually works from, like a CRM, email sequence, spreadsheet, notification channel, or sales pipeline.\n\nThe goal is to make sure each lead is captured, tagged with useful context, routed to the right follow-up path, and visible enough that your team can respond quickly.\n\nWhere do your leads need to go after someone reaches out: a CRM, email inbox, calendar, spreadsheet, or sales pipeline?",
    suggestedButtons,
    recentTalkingPoint: "crm_email_automation",
  };
}

function buildAiAssistantScopeAnswer(
  userMessage: string,
  suggestedButtons: OpzixOfferAnswer["suggestedButtons"],
): OpzixOfferAnswer | undefined {
  if (/\b(lead qualification|qualify leads?)\b/i.test(userMessage)) {
    return {
      message:
        "Good. For lead qualification, I would design the AI assistant to identify who the visitor is, what they need, how urgent or qualified the request is, and where the conversation should go next.\n\nThat usually means asking a short sequence of business-specific questions, tagging the lead by fit or intent, collecting contact details at the right moment, and handing qualified leads to CRM, email, or booking without making every visitor fill out a long form.\n\nWhat makes a lead qualified for you: budget, service need, company size, timeline, location, product interest, or something else?",
      suggestedButtons,
      recentTalkingPoint: "ai_assistant_chatbot",
    };
  }

  if (/\b(booking appointments?|book appointments?|calendar|schedule calls?)\b/i.test(userMessage)) {
    return {
      message:
        "Good. For booking appointments, I would make the AI assistant qualify the visitor before it pushes them to a calendar, then pass the right context into the booking or follow-up flow.\n\nThat helps avoid unqualified calls while still giving high-intent visitors a fast path forward.\n\nWhat should someone answer before they are invited to book: service need, timeline, budget, location, or project type?",
      suggestedButtons,
      recentTalkingPoint: "ai_assistant_chatbot",
    };
  }

  if (/\b(customer support|support questions?|help requests?)\b/i.test(userMessage)) {
    return {
      message:
        "Good. For customer support, I would design the AI assistant around the most common questions and escalation paths, not just a generic FAQ.\n\nIt can answer routine questions, collect order or account context, separate urgent issues from simple requests, and route anything sensitive or unresolved to a human workflow.\n\nWhat support questions come up most often right now?",
      suggestedButtons,
      recentTalkingPoint: "ai_assistant_chatbot",
    };
  }

  if (/\b(routing inquiries|route inquiries|routing|route conversations?)\b/i.test(userMessage)) {
    return {
      message:
        "Good. For routing inquiries, I would make the AI assistant classify the visitor's intent, collect the minimum useful context, and send the conversation to the right next step: sales, support, booking, email, CRM, or a human handoff.\n\nThe key is defining the routing rules before building the assistant, so it knows when to answer, when to qualify, and when to escalate.\n\nWhat are the main paths inquiries should route into?",
      suggestedButtons,
      recentTalkingPoint: "ai_assistant_chatbot",
    };
  }

  if (/\b(answering questions?|faq|common questions?)\b/i.test(userMessage)) {
    return {
      message:
        "Good. For answering questions, I would build the assistant around your actual services, policies, products, and customer decision points, then add guardrails for what it should not answer on its own.\n\nThe goal is to reduce repetitive questions while still moving serious prospects toward qualification, booking, or a human handoff.\n\nWhat questions do customers or prospects ask most often?",
      suggestedButtons,
      recentTalkingPoint: "ai_assistant_chatbot",
    };
  }

  if (/\b(all of the above|all of those|everything mentioned|all mentioned|do all|all of it)\b/i.test(userMessage)) {
    return {
      message:
        "Got it. If you want the AI assistant to handle all of that, I would scope it as a connected workflow rather than one oversized chat prompt.\n\nA good Opzix AI assistant could answer common questions, qualify leads, collect intake details, guide visitors to the right next step, route conversations, and hand qualified prospects to CRM, email, or booking. The important part is sequencing those jobs so the assistant knows when to answer, when to ask a qualifying question, and when to escalate to a human or calendar.\n\nWhich part should be the first priority: lead qualification, booking appointments, customer support, or routing inquiries to the right team?",
      suggestedButtons,
      recentTalkingPoint: "ai_assistant_chatbot",
    };
  }

  return undefined;
}

export function buildOpzixOfferAnswer(input: {
  offerKey: OpzixOfferKey;
  businessType?: string;
  industry?: string;
  websiteUrl?: string;
  userMessage: string;
}): OpzixOfferAnswer {
  const offer = getOpzixOffer(input.offerKey);
  const contextPrefix = businessContextLabel(input.businessType, input.industry);
  const suggestedButtons = suggestedButtonsForOffer(offer.recommendedNextStep);

  if (
    offer.key === "ai_assistant_chatbot" &&
    includesAny(input.userMessage, ["ai consultant", "consultant"])
  ) {
    return {
      message:
        "Opzix does not usually position this as an 'AI consultant' service. What we build are AI assistants and chatbots designed around your business workflow. That could mean answering customer questions, qualifying leads, collecting intake details, routing conversations, or handing qualified prospects to email, CRM, or a booking flow.\n\nThe right starting point is deciding what job the AI should perform for your business.\n\n" +
        offer.followUpQuestion,
      suggestedButtons,
      recentTalkingPoint: offer.key,
    };
  }

  if (offer.key === "ai_assistant_chatbot") {
    const scopedAiAnswer = buildAiAssistantScopeAnswer(input.userMessage, suggestedButtons);
    if (scopedAiAnswer) return scopedAiAnswer;
  }

  if (offer.key === "client_dashboard") {
    return {
      message:
        "Opzix builds dashboards and portals that help teams see the information they need without jumping between scattered tools. For internal teams, that might mean leads, bookings, audit activity, support tickets, campaign performance, ecommerce metrics, or operational tasks in one place.\n\nDashboards are most useful when they are designed around a decision, not just charts.\n\nWho is the dashboard for: internal staff, managers, clients, customers, or a mix?",
      suggestedButtons,
      recentTalkingPoint: offer.key,
    };
  }

  if (offer.key === "google_ads_ad_readiness") {
    return {
      message:
        "Opzix can help with Google Ads readiness, landing page strategy, tracking, conversion paths, and campaign performance visibility. If full campaign management is part of the scope, it should be tied to clean tracking and a landing path that can convert.\n\nAre you trying to launch ads for the first time, fix underperforming ads, or make sure tracking is set up correctly?",
      suggestedButtons,
      recentTalkingPoint: offer.key,
    };
  }

  if (
    offer.key === "crm_email_automation" &&
    (includesAny(input.userMessage, [
      "lead integration",
      "lead routing",
      "lead capture integration",
    ]) ||
      detectedIntegrationSystems(input.userMessage).length > 0 ||
      /\bconnect(ed|ing)?\s+(to|with)\b/i.test(input.userMessage))
  ) {
    return buildLeadIntegrationAnswer(input.userMessage, suggestedButtons);
  }

  if (offer.key === "backend_integrations") {
    const namedIntegrationAnswer = buildNamedIntegrationAnswer(input.userMessage, suggestedButtons);
    if (namedIntegrationAnswer) return namedIntegrationAnswer;
  }

  const correction = offer.whatItDoesNotMean?.length
    ? `\n\nA useful distinction: ${offer.whatItDoesNotMean[0]}`
    : "";
  const websiteContext = input.websiteUrl
    ? ` Since you shared ${input.websiteUrl}, that can be useful context, but I would still scope the workflow before assuming the fix.`
    : "";

  return {
    message: `${contextPrefix}${offer.plainEnglish}\n\nThat can include ${offerIncludesSentence(
      offer.whatItIncludes,
    )}.${correction}${websiteContext}\n\n${offer.followUpQuestion}`,
    suggestedButtons,
    recentTalkingPoint: offer.key,
  };
}

export function buildOpzixProductLineAnswer() {
  return {
    message:
      "Opzix helps businesses design and improve connected growth systems. That can include websites, ecommerce storefronts, AI assistants, CRM/email automation, booking or intake flows, analytics and conversion tracking, backend integrations, dashboards, support workflows, and conversion optimization.\n\nAre you trying to build something new, fix an existing system, or understand what would help your business most?",
    suggestedButtons: ["Book Strategy Call", "Ask Another Question"] as OpzixOfferAnswer["suggestedButtons"],
  };
}
