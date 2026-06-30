export type OpzixConsultingNextStep = "free_audit" | "strategy_call" | "ask_followup";

export type OpzixConsultingOffer = {
  key: string;
  title: string;
  whatItIs: string;
  whatItIncludes: string[];
  whatItDoesNotMean?: string[];
  bestFor: string[];
  commonUserPhrases: string[];
  consultantAnswer: string;
  followUpQuestions: string[];
  recommendedNextStep: OpzixConsultingNextStep;
  relatedOffers: string[];
};

export const OPZIX_CONSULTING_OFFERS: OpzixConsultingOffer[] = [
  {
    key: "business_systems",
    title: "Business Systems",
    whatItIs:
      "Connected growth systems that align the website, CRM, automation, tracking, dashboards, and follow-up process.",
    whatItIncludes: ["journey mapping", "workflow design", "tool handoffs", "automation roadmap", "reporting structure"],
    whatItDoesNotMean: ["It is not a generic software shopping list."],
    bestFor: ["teams with disconnected tools", "owners unsure what to fix first", "manual operations"],
    commonUserPhrases: ["business system", "growth system", "connect my tools", "operations workflow"],
    consultantAnswer:
      "Opzix helps businesses design connected growth systems, so the customer journey does not break between website, CRM, automation, reporting, and follow-up.",
    followUpQuestions: ["Where does the current process feel most disconnected?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["crm_email_automation", "analytics_tracking", "dashboards_portals"],
  },
  {
    key: "website_development",
    title: "Website Development",
    whatItIs:
      "Websites designed around clear offers, useful customer journeys, conversion paths, and operational handoffs.",
    whatItIncludes: ["site planning", "page structure", "responsive build", "forms", "tracking readiness", "CRM or booking handoff"],
    whatItDoesNotMean: ["It is not just a prettier brochure site."],
    bestFor: ["new websites", "service businesses", "unclear site messaging", "websites disconnected from follow-up"],
    commonUserPhrases: ["build a website", "need a website", "website developer", "redesign my website"],
    consultantAnswer:
      "Opzix builds websites that make the offer clear and connect the visitor's next action to tracking, forms, booking, CRM, or follow-up.",
    followUpQuestions: ["Are you building something new, redesigning, or fixing a specific part of the site?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["landing_pages", "analytics_tracking", "conversion_optimization"],
  },
  {
    key: "landing_pages",
    title: "Landing Pages",
    whatItIs:
      "Focused pages that give one audience one clear path to one action, usually for paid traffic, campaigns, or specific offers.",
    whatItIncludes: ["offer framing", "CTA path", "trust proof", "form or booking flow", "tracking events"],
    bestFor: ["Google Ads traffic", "lead generation", "campaign launches", "specific offers"],
    commonUserPhrases: ["landing page", "sales page", "ad landing page", "campaign page"],
    consultantAnswer:
      "Opzix can build landing pages that reduce distraction, clarify the offer, track the right action, and connect visitors to lead capture or booking.",
    followUpQuestions: ["Where would traffic come from: ads, email, social, search, or referrals?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["google_ads_ad_readiness", "conversion_optimization", "analytics_tracking"],
  },
  {
    key: "ecommerce_storefronts",
    title: "Ecommerce Storefronts",
    whatItIs:
      "Online storefronts and improvement work for product discovery, product confidence, checkout, tracking, and operations.",
    whatItIncludes: ["Shopify or BigCommerce planning", "product pages", "collections", "checkout path", "apps", "tracking"],
    bestFor: ["new stores", "Shopify stores", "BigCommerce stores", "stores with product or checkout friction"],
    commonUserPhrases: ["Shopify store", "BigCommerce store", "online store", "sell products online"],
    consultantAnswer:
      "Opzix helps build and improve ecommerce storefronts so customers can find the right products, trust the store, and complete checkout with less friction.",
    followUpQuestions: ["Are you launching a new store, rebuilding one, or improving an existing storefront?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["ecommerce_audit", "backend_integrations", "conversion_optimization"],
  },
  {
    key: "ecommerce_audit",
    title: "Ecommerce Audit",
    whatItIs:
      "A practical review of an ecommerce site's customer journey, conversion path, trust signals, tracking, and high-friction moments.",
    whatItIncludes: ["homepage review", "product-page review", "mobile UX", "checkout observations", "tracking readiness", "recommendations"],
    bestFor: ["stores with traffic but weak sales", "stores unsure what to fix first", "pre-ad-spend reviews"],
    commonUserPhrases: ["audit my store", "website audit", "scan my store", "conversion audit"],
    consultantAnswer:
      "The ecommerce audit helps identify where the store may be losing clarity, trust, or momentum before the customer purchases.",
    followUpQuestions: ["Do you already have a live ecommerce URL to review?"],
    recommendedNextStep: "free_audit",
    relatedOffers: ["conversion_optimization", "analytics_tracking", "ecommerce_storefronts"],
  },
  {
    key: "ai_assistants_chatbots",
    title: "AI Assistants / Chatbots",
    whatItIs:
      "AI assistants and chatbots designed around business workflows such as answering questions, qualifying leads, intake, routing, and support.",
    whatItIncludes: ["website chat", "lead qualification", "FAQ guidance", "intake questions", "routing", "CRM/email handoff", "human escalation"],
    whatItDoesNotMean: [
      "Opzix usually builds AI assistants or chatbots, not a human-like AI consultant as a standalone replacement.",
      "It is not generic ChatGPT pasted onto a site.",
    ],
    bestFor: ["repetitive questions", "lead qualification", "service intake", "support routing", "customer workflow help"],
    commonUserPhrases: ["AI consultant", "AI chatbot", "AI assistant", "chatbot for my website", "AI agent"],
    consultantAnswer:
      "Opzix usually builds AI assistants or chatbots, not a human-like AI consultant as a standalone replacement. The assistant can answer questions, qualify leads, collect intake details, route conversations, support customer workflows, and hand off context to your team.",
    followUpQuestions: ["What would you want the AI assistant to handle first: lead qualification, customer questions, booking, support, or internal workflow help?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["lead_capture", "booking_intake_flows", "crm_email_automation"],
  },
  {
    key: "crm_email_automation",
    title: "CRM & Email Automation",
    whatItIs:
      "Follow-up systems that capture, tag, nurture, notify, and route leads after a visitor raises their hand.",
    whatItIncludes: ["CRM mapping", "lead source tagging", "email sequences", "notifications", "pipeline handoff", "follow-up automation"],
    bestFor: ["slow lead follow-up", "manual handoffs", "unclear lead ownership", "nurture campaigns"],
    commonUserPhrases: ["CRM", "email automation", "lead follow-up", "Klaviyo", "Mailchimp", "lead integration"],
    consultantAnswer:
      "Opzix can help organize lead capture and follow-up so inquiries do not sit in an inbox without context, ownership, or a next step.",
    followUpQuestions: ["Where do leads go right now after someone submits a form or asks for help?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["lead_capture", "analytics_tracking", "ai_assistants_chatbots"],
  },
  {
    key: "booking_intake_flows",
    title: "Booking / Intake Flows",
    whatItIs:
      "Booking and intake paths that collect the right context before a call, consultation, appointment, or service request.",
    whatItIncludes: ["calendar path", "intake questions", "qualification", "confirmation", "routing", "CRM/email notifications"],
    bestFor: ["consultation booking", "care intake", "applications", "unqualified calls"],
    commonUserPhrases: ["booking", "appointment", "intake form", "consultation form", "application form"],
    consultantAnswer:
      "Opzix can design booking and intake flows that reduce wasted calls and help the team understand the request before the first human follow-up.",
    followUpQuestions: ["What should someone answer before they book or submit an intake request?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["ai_assistants_chatbots", "crm_email_automation", "analytics_tracking"],
  },
  {
    key: "analytics_tracking",
    title: "Analytics & Tracking",
    whatItIs:
      "Measurement setup for the events and customer actions that matter: forms, bookings, purchases, calls, ad conversions, and source attribution.",
    whatItIncludes: ["GA4", "Google Tag Manager", "conversion events", "pixels", "form tracking", "booking tracking", "reporting sanity checks"],
    bestFor: ["Google Ads", "unclear attribution", "missing conversion events", "untrusted reports"],
    commonUserPhrases: ["tracking", "analytics", "GA4", "GTM", "conversion tracking", "pixels"],
    consultantAnswer:
      "Opzix can help set up analytics and conversion tracking so the business can see which actions are happening and which channels are producing results.",
    followUpQuestions: ["What are you trying to track first: forms, booked calls, purchases, ad conversions, or lead source quality?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["dashboards_portals", "google_ads_ad_readiness", "conversion_optimization"],
  },
  {
    key: "dashboards_portals",
    title: "Dashboards / Portals",
    whatItIs:
      "Dashboards and portals that help teams, managers, clients, or customers see the information they need without jumping between scattered tools.",
    whatItIncludes: ["internal dashboards", "client portals", "admin views", "analytics views", "support or task visibility", "role-based information"],
    bestFor: ["internal teams", "managers", "clients", "operations", "reporting visibility"],
    commonUserPhrases: ["dashboard", "portal", "client portal", "admin dashboard", "reporting dashboard"],
    consultantAnswer:
      "Opzix builds dashboards and portals that help teams see the information they need without jumping between scattered tools. For internal teams, that might mean leads, bookings, audit activity, support tickets, campaign performance, ecommerce metrics, or operational tasks in one place.",
    followUpQuestions: ["Who is the dashboard for: internal staff, managers, clients, customers, or a mix?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["analytics_tracking", "backend_integrations", "support_ticket_flows"],
  },
  {
    key: "backend_integrations",
    title: "Backend Integrations",
    whatItIs:
      "Connections between ecommerce platforms, CRMs, ERPs, dashboards, forms, and operational tools so data moves with less manual work.",
    whatItIncludes: ["API planning", "ERP/CRM mapping", "Shopify or BigCommerce integration", "field mapping", "sync triggers", "error handling"],
    bestFor: ["NetSuite", "ERP sync", "manual data entry", "multi-system reporting", "storefront-to-operations handoff"],
    commonUserPhrases: ["integration", "NetSuite", "ERP", "API integration", "connect systems", "Shopify to NetSuite"],
    consultantAnswer:
      "Opzix can help scope and build backend integrations by mapping which system owns each record, what should sync, and how exceptions should be handled.",
    followUpQuestions: ["Which systems need to connect, and what data should move first?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["dashboards_portals", "ecommerce_storefronts", "analytics_tracking"],
  },
  {
    key: "support_ticket_flows",
    title: "Support / Ticket Flows",
    whatItIs:
      "Customer support intake and routing systems that turn scattered questions into trackable tickets, ownership, and next steps.",
    whatItIncludes: ["support intake", "ticket categories", "help desk routing", "escalation", "status messaging", "reporting"],
    bestFor: ["scattered support", "ecommerce support", "service requests", "unclear ownership"],
    commonUserPhrases: ["support tickets", "ticket system", "help desk", "customer support workflow"],
    consultantAnswer:
      "Opzix can design support and ticket flows so customer questions are captured, routed, tracked, and escalated clearly.",
    followUpQuestions: ["What support requests come in most often?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["ai_assistants_chatbots", "dashboards_portals", "crm_email_automation"],
  },
  {
    key: "conversion_optimization",
    title: "Conversion Optimization",
    whatItIs:
      "Improvement work for the page, offer, trust, tracking, and follow-up path that affects whether visitors take action.",
    whatItIncludes: ["landing page review", "CTA clarity", "trust proof", "form or checkout friction", "measurement", "experiment recommendations"],
    bestFor: ["traffic not converting", "weak landing pages", "cart or form drop-off", "ad spend readiness"],
    commonUserPhrases: ["CRO", "conversion", "not converting", "improve conversions", "landing page optimization"],
    consultantAnswer:
      "Opzix can help improve conversion paths by looking at the offer, page flow, trust signals, tracking, and follow-up steps together.",
    followUpQuestions: ["Where does the conversion problem seem to happen: page, form, cart, checkout, booking, or follow-up?"],
    recommendedNextStep: "free_audit",
    relatedOffers: ["landing_pages", "analytics_tracking", "ecommerce_audit"],
  },
  {
    key: "google_ads_ad_readiness",
    title: "Google Ads / Ad Readiness",
    whatItIs:
      "Ad-readiness and campaign strategy support tied to landing pages, tracking, conversion paths, and performance visibility.",
    whatItIncludes: ["landing page strategy", "conversion tracking", "campaign visibility", "offer alignment", "ad funnel readiness"],
    whatItDoesNotMean: ["Full campaign management should be scoped around clean tracking and a landing path that can convert."],
    bestFor: ["launching Google Ads", "fixing underperforming ads", "tracking setup", "paid traffic readiness"],
    commonUserPhrases: ["do you run google ads", "Google Ads", "paid ads", "ad management", "PPC"],
    consultantAnswer:
      "Opzix can help with Google Ads readiness, landing page strategy, tracking, conversion paths, and campaign performance visibility. If full campaign management is part of the scope, it should be tied to clean tracking and a landing path that can convert.",
    followUpQuestions: ["Are you trying to launch ads for the first time, fix underperforming ads, or make sure tracking is set up correctly?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["landing_pages", "analytics_tracking", "conversion_optimization"],
  },
  {
    key: "strategy_consulting",
    title: "Strategy Consulting",
    whatItIs:
      "Practical systems strategy to decide what to build, fix, automate, or measure next.",
    whatItIncludes: ["customer journey review", "opportunity mapping", "prioritization", "roadmap planning", "implementation strategy"],
    bestFor: ["unclear priorities", "new growth system planning", "build-versus-fix decisions"],
    commonUserPhrases: ["strategy", "consulting", "consultant", "what should I build", "help me plan"],
    consultantAnswer:
      "Opzix strategy consulting is tied to practical systems decisions: what to build, fix, automate, track, or connect next.",
    followUpQuestions: ["Are you trying to build something new, fix an existing system, or decide what would help most?"],
    recommendedNextStep: "strategy_call",
    relatedOffers: ["business_systems", "website_development", "analytics_tracking"],
  },
];

export const OPZIX_CONSULTING_OFFERS_BY_KEY = OPZIX_CONSULTING_OFFERS.reduce(
  (offers, offer) => {
    offers[offer.key] = offer;
    return offers;
  },
  {} as Record<string, OpzixConsultingOffer>,
);

