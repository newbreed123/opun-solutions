export type OpzixOfferKey =
  | "business_systems"
  | "website_development"
  | "ecommerce_storefront"
  | "ecommerce_audit"
  | "ai_assistant_chatbot"
  | "crm_email_automation"
  | "booking_intake_flow"
  | "analytics_tracking"
  | "backend_integrations"
  | "client_dashboard"
  | "support_ticket_flow"
  | "conversion_optimization"
  | "google_ads_ad_readiness"
  | "strategy_consulting";

export type OpzixOffer = {
  key: OpzixOfferKey;
  title: string;
  plainEnglish: string;
  whatItIncludes: string[];
  whatItDoesNotMean?: string[];
  bestFor: string[];
  commonUserPhrases: string[];
  zoraAnswerGuidance: string;
  recommendedNextStep: "free_audit" | "strategy_call" | "ask_followup";
  followUpQuestion: string;
};

export const OPZIX_OFFERS: OpzixOffer[] = [
  {
    key: "business_systems",
    title: "Business Systems",
    plainEnglish:
      "Opzix designs connected business systems so a website, CRM, automation, reporting, and follow-up process work together instead of operating as separate tools.",
    whatItIncludes: [
      "Customer journey mapping",
      "Tool and workflow review",
      "Lead capture and handoff design",
      "Automation planning",
      "Reporting and ownership structure",
      "Implementation roadmap",
    ],
    whatItDoesNotMean: [
      "It is not just a software recommendation list.",
      "It is not a generic business plan.",
      "It should connect real customer actions to operational follow-through.",
    ],
    bestFor: [
      "Businesses with disconnected tools",
      "Teams doing too much manual follow-up",
      "Companies that need a clearer growth operating system",
      "Owners who are not sure what to fix first",
    ],
    commonUserPhrases: [
      "business systems",
      "operations system",
      "growth system",
      "connect my tools",
      "automate my business",
      "customer journey system",
    ],
    zoraAnswerGuidance:
      "Explain that Opzix looks at the connected path from customer interest to follow-up, delivery, and reporting. Ask where the current process feels disconnected.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Where does your current process feel most disconnected: lead capture, follow-up, customer delivery, reporting, or internal handoffs?",
  },
  {
    key: "website_development",
    title: "Website Development",
    plainEnglish:
      "Opzix builds websites and landing pages that make the offer clear, guide visitors toward the right action, and connect cleanly to tracking, forms, booking, or CRM follow-up.",
    whatItIncludes: [
      "Business website planning",
      "Landing page design and build",
      "Offer and page structure",
      "Responsive front-end development",
      "Forms, booking links, or intake flows",
      "Basic analytics readiness",
    ],
    whatItDoesNotMean: [
      "It is not just a prettier brochure site.",
      "It should be tied to a clear customer action.",
      "It does not automatically mean a full rebuild is required.",
    ],
    bestFor: [
      "Businesses launching a new site",
      "Service businesses that need a stronger landing page",
      "Companies with unclear messaging or weak calls to action",
      "Teams that need web pages connected to follow-up systems",
    ],
    commonUserPhrases: [
      "build a website",
      "need a website",
      "website developer",
      "business website",
      "landing page",
      "redesign my website",
    ],
    zoraAnswerGuidance:
      "Answer as a website or landing-page build request first. Do not turn every website question into a conversion diagnosis unless the user mentions performance or conversion problems.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Are you trying to launch a new website, redesign an existing one, or build a specific landing page for leads or sales?",
  },
  {
    key: "ecommerce_storefront",
    title: "Ecommerce Storefront",
    plainEnglish:
      "Opzix helps build and improve ecommerce storefronts so customers can understand the products, trust the store, add to cart, and complete checkout with less friction.",
    whatItIncludes: [
      "Shopify or BigCommerce storefront planning",
      "Product and collection page structure",
      "Checkout path review",
      "Storefront UX improvements",
      "Apps, integrations, and tracking readiness",
      "Launch or improvement roadmap",
    ],
    whatItDoesNotMean: [
      "It is not a promise that any product will sell without demand.",
      "It is not limited to visual design.",
      "It should connect storefront decisions to operations and tracking.",
    ],
    bestFor: [
      "Businesses launching an online store",
      "Stores moving to Shopify or BigCommerce",
      "Brands with product-page or checkout friction",
      "Teams that need ecommerce systems connected to fulfillment or reporting",
    ],
    commonUserPhrases: [
      "ecommerce store",
      "online store",
      "Shopify store",
      "BigCommerce store",
      "sell products online",
      "dropshipping store",
    ],
    zoraAnswerGuidance:
      "Treat storefront requests as ecommerce build or improvement requests. Ask whether the user is launching, rebuilding, or trying to improve an existing store.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Are you starting a new store, rebuilding an existing one, or trying to improve product pages and checkout?",
  },
  {
    key: "ecommerce_audit",
    title: "Ecommerce Audit",
    plainEnglish:
      "Opzix audits ecommerce websites to identify where customers may be losing clarity, trust, or momentum before purchase.",
    whatItIncludes: [
      "Homepage and product-page review",
      "Customer journey and CTA review",
      "Mobile usability checks",
      "Trust and offer clarity review",
      "Checkout path observations",
      "Prioritized improvement recommendations",
    ],
    whatItDoesNotMean: [
      "It is not a full technical SEO audit.",
      "It is not a guaranteed diagnosis of private analytics data.",
      "It should be used as a practical starting point for improvement decisions.",
    ],
    bestFor: [
      "Ecommerce stores unsure what to fix first",
      "Brands with traffic but weak sales",
      "Teams preparing to scale ad spend",
      "Owners who want an outside review of their store experience",
    ],
    commonUserPhrases: [
      "audit my website",
      "ecommerce audit",
      "website audit",
      "scan my store",
      "conversion audit",
    ],
    zoraAnswerGuidance:
      "Explain the audit as a store-experience review. If the user has a URL, guide them toward the free audit.",
    recommendedNextStep: "free_audit",
    followUpQuestion:
      "Do you have a live ecommerce URL you want reviewed, or are you still preparing the store for launch?",
  },
  {
    key: "ai_assistant_chatbot",
    title: "AI Assistant / Chatbot",
    plainEnglish:
      "Opzix builds AI assistants and chatbots that help businesses answer questions, qualify leads, collect customer context, route conversations, and support customer workflows.",
    whatItIncludes: [
      "Website chat assistant",
      "Lead qualification flow",
      "FAQ and service guidance",
      "Customer intake questions",
      "Conversation routing",
      "CRM or email handoff",
      "Business-specific knowledge base",
      "Escalation to human contact or booking",
    ],
    whatItDoesNotMean: [
      "We do not usually describe this as replacing a human consultant.",
      "We do not promise fully autonomous decision-making.",
      "We do not position it as generic ChatGPT pasted onto a website.",
      "It should be designed around a specific business workflow.",
    ],
    bestFor: [
      "Businesses that get repetitive questions",
      "Businesses that need better lead qualification",
      "Service businesses with intake processes",
      "Ecommerce stores with product or support questions",
      "Companies that want to route visitors before human follow-up",
    ],
    commonUserPhrases: [
      "AI consultant",
      "AI chatbot",
      "AI assistant",
      "chatbot for my website",
      "AI agent",
      "automate customer questions",
      "virtual assistant",
      "customer service bot",
      "lead qualification bot",
      "AI for my business",
    ],
    zoraAnswerGuidance:
      "If a user says 'AI consultant,' clarify gently that Opzix usually builds AI assistants or chatbots rather than selling an AI consultant as a standalone role. Explain what the assistant can do and ask what business job they want the AI to handle.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "What would you want the AI assistant to help with first: answering questions, qualifying leads, booking appointments, customer support, or routing inquiries?",
  },
  {
    key: "crm_email_automation",
    title: "CRM & Email Automation",
    plainEnglish:
      "Opzix helps businesses organize leads and automate follow-up so inquiries are captured, tagged, nurtured, and handed to the right next step.",
    whatItIncludes: [
      "CRM flow mapping",
      "Lead source tagging",
      "Email follow-up sequences",
      "Klaviyo, Mailchimp, or CRM workflow support",
      "Internal notifications",
      "Booking or sales handoff logic",
    ],
    whatItDoesNotMean: [
      "It is not just blasting more emails.",
      "It should respect lead intent and customer context.",
      "It does not replace the need for a clear offer.",
    ],
    bestFor: [
      "Businesses losing leads after form submission",
      "Teams managing inquiries from multiple sources",
      "Stores that need post-purchase or abandoned-flow logic",
      "Service businesses that need faster follow-up",
    ],
    commonUserPhrases: [
      "CRM",
      "email automation",
      "follow-up automation",
      "lead follow-up",
      "nurture emails",
      "Klaviyo",
      "Mailchimp",
    ],
    zoraAnswerGuidance:
      "Explain CRM and email automation as a follow-up system, not just software setup. Ask where leads currently go.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Where do new leads currently go after someone submits a form or asks for help: a CRM, email inbox, spreadsheet, or nowhere structured?",
  },
  {
    key: "booking_intake_flow",
    title: "Booking / Intake Flow",
    plainEnglish:
      "Opzix designs booking and intake flows that collect the right context, route people to the right next step, and reduce wasted back-and-forth before a call or service request.",
    whatItIncludes: [
      "Booking path review",
      "Intake form structure",
      "Qualification questions",
      "Calendar or appointment routing",
      "Confirmation and handoff messaging",
      "CRM or email notification logic",
    ],
    whatItDoesNotMean: [
      "It is not just adding a calendar link.",
      "It should qualify intent before asking for too much information.",
      "It should not make urgent or high-intent users work harder than needed.",
    ],
    bestFor: [
      "Service businesses booking consultations",
      "Healthcare or care teams collecting intake details",
      "Companies with unqualified calls",
      "Teams that need cleaner appointment handoffs",
    ],
    commonUserPhrases: [
      "booking",
      "appointment",
      "intake form",
      "consultation form",
      "request care",
      "application form",
    ],
    zoraAnswerGuidance:
      "Explain the flow as a qualification and handoff system. Ask what information needs to be collected before a human follows up.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "What should the flow collect before someone reaches your team: contact details, service need, timing, budget, eligibility, or appointment preference?",
  },
  {
    key: "analytics_tracking",
    title: "Analytics & Conversion Tracking",
    plainEnglish:
      "Opzix sets up and improves analytics, conversion tracking, and reporting so businesses can see which customer actions are happening and which channels are producing results.",
    whatItIncludes: [
      "GA4 event planning",
      "Google Tag Manager support",
      "Conversion tracking setup",
      "Ad pixel readiness",
      "Form, booking, and ecommerce event tracking",
      "Reporting sanity checks",
    ],
    whatItDoesNotMean: [
      "It is not just installing a script tag.",
      "It should track meaningful business actions, not every possible click.",
      "It does not make poor data accurate without validation.",
    ],
    bestFor: [
      "Businesses running Google Ads or paid traffic",
      "Stores with unclear revenue attribution",
      "Service businesses tracking forms or booked calls",
      "Teams that do not trust their reports",
    ],
    commonUserPhrases: [
      "tracking",
      "analytics",
      "GA4",
      "Google Tag Manager",
      "conversion tracking",
      "pixels",
      "attribution",
    ],
    zoraAnswerGuidance:
      "Answer tracking requests directly. Mention GA4, GTM, pixels, events, and validation when relevant.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "What are you trying to track first: form submissions, booked appointments, ecommerce purchases, ad conversions, or lead source quality?",
  },
  {
    key: "backend_integrations",
    title: "Backend Integrations",
    plainEnglish:
      "Opzix connects backend systems so data can move between ecommerce platforms, CRMs, ERPs, dashboards, forms, and operational tools with less manual work.",
    whatItIncludes: [
      "API integration planning",
      "ERP or CRM connection mapping",
      "Shopify or BigCommerce integration support",
      "Data flow and field mapping",
      "Automation triggers",
      "Error and handoff review",
    ],
    whatItDoesNotMean: [
      "It is not integration for its own sake.",
      "It should solve a clear operational problem.",
      "It may require discovery before scope can be estimated.",
    ],
    bestFor: [
      "Teams copying data between tools",
      "Stores connecting ecommerce to ERP or fulfillment",
      "Businesses with CRM or backend sync problems",
      "Companies that need cleaner reporting from multiple systems",
    ],
    commonUserPhrases: [
      "integration",
      "API integration",
      "NetSuite",
      "ERP",
      "Shopify integration",
      "BigCommerce integration",
      "backend connection",
      "connect systems",
    ],
    zoraAnswerGuidance:
      "Treat named systems like NetSuite or ERP as backend integration intent. Ask which systems need to exchange data and what should trigger the sync.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Which systems need to connect, and what information should move between them?",
  },
  {
    key: "client_dashboard",
    title: "Client Dashboard",
    plainEnglish:
      "Opzix builds dashboards and portals that help teams or clients see key information, track progress, and make decisions without digging through scattered tools.",
    whatItIncludes: [
      "Dashboard requirements mapping",
      "Client portal planning",
      "Admin views",
      "Metric and data source definition",
      "Role-based information structure",
      "Reporting interface design",
    ],
    whatItDoesNotMean: [
      "It is not just charts for decoration.",
      "It should answer specific operational questions.",
      "It depends on reliable source data.",
    ],
    bestFor: [
      "Agencies or service teams sharing status with clients",
      "Operators needing a clear internal view",
      "Businesses with scattered reports",
      "Teams that need a lightweight portal or admin dashboard",
    ],
    commonUserPhrases: [
      "dashboard",
      "reporting dashboard",
      "admin dashboard",
      "client portal",
      "analytics dashboard",
    ],
    zoraAnswerGuidance:
      "Explain dashboards as decision interfaces. Ask who needs the dashboard and what decisions it should support.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Who is the dashboard for: internal staff, clients, managers, customers, or a mix of roles?",
  },
  {
    key: "support_ticket_flow",
    title: "Support / Ticket Flow",
    plainEnglish:
      "Opzix helps design customer support flows so questions become trackable tickets, route to the right place, and give customers clearer next steps.",
    whatItIncludes: [
      "Support intake mapping",
      "Ticket category structure",
      "Help desk workflow planning",
      "Escalation rules",
      "Customer status messaging",
      "Reporting and response visibility",
    ],
    whatItDoesNotMean: [
      "It is not just picking a help desk app.",
      "It should reduce confusion for both customers and staff.",
      "It should separate urgent issues from routine questions.",
    ],
    bestFor: [
      "Businesses receiving support through scattered channels",
      "Ecommerce stores with repeat support questions",
      "Teams that need clearer escalation paths",
      "Companies wanting response visibility",
    ],
    commonUserPhrases: [
      "support tickets",
      "ticket system",
      "help desk",
      "customer support workflow",
    ],
    zoraAnswerGuidance:
      "Explain support flow as intake, routing, escalation, and visibility. Ask what kinds of support requests come in most often.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "What support requests are most common right now: order questions, service questions, technical issues, billing, or general help?",
  },
  {
    key: "conversion_optimization",
    title: "Conversion Optimization",
    plainEnglish:
      "Opzix improves conversion paths by reviewing the offer, page flow, trust signals, tracking, and follow-up steps that affect whether visitors take action.",
    whatItIncludes: [
      "Conversion path review",
      "Landing page optimization",
      "Offer and CTA clarity",
      "Trust signal improvements",
      "Form, booking, or checkout friction review",
      "Measurement and experiment recommendations",
    ],
    whatItDoesNotMean: [
      "It is not only changing button colors.",
      "It should be based on customer intent and data where available.",
      "It may include tracking or follow-up fixes, not only page edits.",
    ],
    bestFor: [
      "Businesses with traffic but weak leads or sales",
      "Stores with product-page or checkout drop-off",
      "Landing pages that are not converting",
      "Teams preparing to scale paid traffic",
    ],
    commonUserPhrases: [
      "conversion",
      "CRO",
      "improve conversions",
      "not converting",
      "landing page optimization",
    ],
    zoraAnswerGuidance:
      "Use conversion diagnosis only when the user mentions conversion performance, CRO, not converting, or landing page optimization.",
    recommendedNextStep: "free_audit",
    followUpQuestion:
      "Where are you seeing the conversion problem: landing page visits, form submissions, product pages, cart, checkout, or booked calls?",
  },
  {
    key: "strategy_consulting",
    title: "Strategy Consulting",
    plainEnglish:
      "Opzix offers strategy guidance to help businesses decide what to build, fix, automate, or measure next based on their customer journey and operating constraints.",
    whatItIncludes: [
      "Business and customer journey review",
      "System opportunity mapping",
      "Build-versus-fix prioritization",
      "Offer, tracking, and follow-up review",
      "Roadmap recommendations",
      "Implementation planning",
    ],
    whatItDoesNotMean: [
      "It is not abstract advice disconnected from execution.",
      "It is not a replacement for knowing the business goal.",
      "It should lead to a practical next step.",
    ],
    bestFor: [
      "Owners unsure what to build first",
      "Teams choosing between website, automation, tracking, or CRM work",
      "Businesses planning a new growth system",
      "Companies that need an outside systems perspective",
    ],
    commonUserPhrases: [
      "strategy",
      "consulting",
      "consultant",
      "business systems advice",
      "what should I build",
      "help me plan",
    ],
    zoraAnswerGuidance:
      "Explain that strategy consulting is tied to practical systems decisions. Ask whether they are trying to build something new, fix something, or prioritize next steps.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Are you trying to build something new, fix an existing system, or decide what would help the business most right now?",
  },
  {
    key: "google_ads_ad_readiness",
    title: "Google Ads / Ad Readiness",
    plainEnglish:
      "Opzix can help with Google Ads readiness, landing page strategy, tracking, conversion paths, and campaign performance visibility.",
    whatItIncludes: [
      "Landing page strategy",
      "Conversion tracking readiness",
      "Campaign performance visibility",
      "Offer and traffic alignment",
      "Follow-up path review",
      "Ad funnel improvement planning",
    ],
    whatItDoesNotMean: [
      "Full campaign management should be tied to clean tracking and a landing path that can convert.",
      "It is not just turning ads on before the customer journey is ready.",
    ],
    bestFor: [
      "Businesses launching Google Ads",
      "Companies fixing underperforming ads",
      "Teams that need conversion tracking set up correctly",
      "Landing pages preparing for paid traffic",
    ],
    commonUserPhrases: [
      "do you run Google Ads",
      "Google Ads",
      "paid ads",
      "ad management",
      "PPC",
      "campaign strategy",
    ],
    zoraAnswerGuidance:
      "Answer directly that Opzix helps with Google Ads readiness, landing pages, tracking, conversion paths, and campaign visibility. Clarify full ad management should be scoped around clean tracking and a landing path that can convert.",
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Are you trying to launch ads for the first time, fix underperforming ads, or make sure tracking is set up correctly?",
  },
];

export const OPZIX_OFFERS_BY_KEY = OPZIX_OFFERS.reduce(
  (offersByKey, offer) => {
    offersByKey[offer.key] = offer;
    return offersByKey;
  },
  {} as Record<OpzixOfferKey, OpzixOffer>,
);

export function getOpzixOffer(key: OpzixOfferKey) {
  return OPZIX_OFFERS_BY_KEY[key];
}

export function isOpzixOfferKey(value?: string): value is OpzixOfferKey {
  return Boolean(value && value in OPZIX_OFFERS_BY_KEY);
}
