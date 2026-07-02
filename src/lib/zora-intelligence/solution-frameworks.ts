export type ZoraSolutionFrameworkKey =
  | "traffic_growth"
  | "lead_generation"
  | "conversion_improvement"
  | "follow_up_system"
  | "operations_automation"
  | "tracking_visibility"
  | "ai_assistant_adoption"
  | "ecommerce_growth"
  | "business_systems"
  | "website_launch";

export type ZoraSolutionFramework = {
  key: ZoraSolutionFrameworkKey;
  title: string;
  problemStatement: string;
  consultantFrame: string;
  howOpzixHelps: string[];
  firstThingsToCheck: string[];
  commonMistakes: string[];
  expectedOutcomes: string[];
  relatedOffers: string[];
  recommendedNextStep: "free_audit" | "strategy_call" | "ask_followup";
  followUpQuestion: string;
  industryVariants?: Partial<Record<string, {
    frame: string;
    firstThingsToCheck: string[];
    examples: string[];
  }>>;
};

export const OPZIX_SOLUTION_FRAMEWORKS: Record<ZoraSolutionFrameworkKey, ZoraSolutionFramework> = {
  traffic_growth: {
    key: "traffic_growth",
    title: "Traffic Growth Framework",
    problemStatement:
      "Getting more traffic only helps if the destination can convert.",
    consultantFrame:
      "Opzix would first separate three questions: are enough of the right people finding you, are they landing on the right message, and can you track what happens after they arrive?",
    howOpzixHelps: [
      "Review the current website and landing path",
      "Clarify the target audience and offer",
      "Improve landing pages or service pages",
      "Set up tracking to measure traffic quality",
      "Improve SEO and ad-readiness",
      "Build lead capture and follow-up paths",
      "Use Zora and audit insights to identify where traffic leaks",
    ],
    firstThingsToCheck: [
      "Current traffic sources",
      "Landing page relevance",
      "Search visibility",
      "Offer clarity",
      "Lead capture",
      "Tracking setup",
      "Follow-up process",
    ],
    commonMistakes: [
      "Buying traffic before the landing path is ready",
      "Measuring sessions without measuring lead or revenue quality",
      "Sending every visitor to the same generic page",
    ],
    expectedOutcomes: [
      "A clearer source-to-lead path",
      "Better visibility into traffic quality",
      "A stronger first conversion path before scaling spend",
    ],
    relatedOffers: [
      "website_development",
      "analytics_tracking",
      "google_ads_ad_readiness",
      "crm_email_automation",
    ],
    recommendedNextStep: "free_audit",
    followUpQuestion:
      "Are you trying to get more organic traffic, paid traffic, or better-quality traffic from the visitors you already have?",
    industryVariants: {
      service: {
        frame:
          "For a service business, traffic quality matters more than raw volume because the goal is usually a qualified inquiry, booked call, or intake request.",
        firstThingsToCheck: [
          "Service page clarity",
          "Local or niche search visibility",
          "Primary CTA strength",
          "Form or booking friction",
          "Speed-to-lead follow-up",
        ],
        examples: [
          "Turn vague service pages into intent-specific landing paths",
          "Connect forms or booking requests to follow-up",
        ],
      },
      ecommerce: {
        frame:
          "For ecommerce, traffic should be judged by product discovery, product-page confidence, checkout readiness, and retention, not visits alone.",
        firstThingsToCheck: [
          "Category and product discovery",
          "Product-page confidence",
          "Cart and checkout trust",
          "Campaign-to-product relevance",
          "Email or SMS capture",
        ],
        examples: [
          "Match paid traffic to the right collection or product page",
          "Use tracking to separate browsing traffic from purchase intent",
        ],
      },
    },
  },
  lead_generation: {
    key: "lead_generation",
    title: "Lead Generation Framework",
    problemStatement:
      "Lead generation is not just traffic. It is the system that turns the right visitor into a real opportunity.",
    consultantFrame:
      "Opzix looks at the full path from visitor intent to captured context, routed follow-up, and sales readiness.",
    howOpzixHelps: [
      "Clarify the offer and audience",
      "Improve landing pages, forms, chat, or booking paths",
      "Connect lead capture to CRM, email, or notifications",
      "Add source tagging and qualification questions",
      "Build follow-up paths for high-intent inquiries",
    ],
    firstThingsToCheck: [
      "Lead source quality",
      "CTA clarity",
      "Form friction",
      "Qualification fields",
      "CRM or inbox routing",
      "Follow-up timing",
    ],
    commonMistakes: [
      "Optimizing for more form fills instead of better opportunities",
      "Capturing leads without source or intent context",
      "Letting leads sit in an inbox with no ownership",
    ],
    expectedOutcomes: [
      "More useful inquiries",
      "Cleaner handoff into sales or operations",
      "Better visibility into which sources create real opportunities",
    ],
    relatedOffers: ["website_development", "crm_email_automation", "booking_intake_flow"],
    recommendedNextStep: "free_audit",
    followUpQuestion:
      "Where do new leads come from today: search, ads, referrals, social, forms, chat, or something else?",
  },
  conversion_improvement: {
    key: "conversion_improvement",
    title: "Conversion Improvement Framework",
    problemStatement:
      "Conversion improvement is about removing friction between interest and action.",
    consultantFrame:
      "Opzix separates message clarity, trust, page structure, CTA path, technical friction, and follow-up so the fix is not just a cosmetic redesign.",
    howOpzixHelps: [
      "Review the visible customer journey",
      "Improve offer clarity and proof near the action",
      "Reduce form, booking, cart, or checkout friction",
      "Strengthen mobile UX and trust cues",
      "Set up tracking around the key conversion events",
    ],
    firstThingsToCheck: [
      "Message clarity",
      "CTA visibility",
      "Trust proof",
      "Mobile path",
      "Form or checkout friction",
      "Tracking events",
    ],
    commonMistakes: [
      "Changing design before diagnosing the actual drop-off",
      "Adding more CTAs instead of making the right next action obvious",
      "Ignoring mobile and confirmation-state friction",
    ],
    expectedOutcomes: [
      "A clearer path from interest to action",
      "Fewer preventable drop-offs",
      "Better tracking around the conversion path",
    ],
    relatedOffers: ["conversion_optimization", "ecommerce_audit", "analytics_tracking"],
    recommendedNextStep: "free_audit",
    followUpQuestion:
      "Where do people seem to hesitate most: homepage, service page, product page, form, cart, checkout, or booking?",
  },
  follow_up_system: {
    key: "follow_up_system",
    title: "Follow-Up System Framework",
    problemStatement:
      "Follow-up problems usually happen after the website does its job. The lead exists, but the handoff is weak.",
    consultantFrame:
      "Opzix maps what happens after someone raises their hand: where the lead goes, who owns it, what context is preserved, and how quickly the next step happens.",
    howOpzixHelps: [
      "Map form, chat, booking, and call handoffs",
      "Connect leads to CRM, email, notifications, or pipeline tools",
      "Add qualification and source context",
      "Build email/SMS or task-based follow-up",
      "Create visibility for missed or aging leads",
    ],
    firstThingsToCheck: [
      "Lead destination",
      "Response time",
      "Ownership rules",
      "Notification channel",
      "CRM fields",
      "Follow-up sequence",
    ],
    commonMistakes: [
      "Treating every lead the same",
      "Sending leads to shared inboxes with no owner",
      "Automating messages before the routing rules are clear",
    ],
    expectedOutcomes: [
      "Faster response",
      "Cleaner ownership",
      "Fewer missed opportunities",
    ],
    relatedOffers: ["crm_email_automation", "booking_intake_flow", "business_systems"],
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Where do leads currently go after someone reaches out: a CRM, inbox, spreadsheet, calendar, or nowhere structured?",
  },
  operations_automation: {
    key: "operations_automation",
    title: "Operations Automation Framework",
    problemStatement:
      "Operations automation is about removing repeated manual steps that slow the business down.",
    consultantFrame:
      "Opzix looks for the points where people copy data, chase status, re-enter details, or manually coordinate handoffs that software should make visible.",
    howOpzixHelps: [
      "Map the current workflow",
      "Identify repeated admin work and bottlenecks",
      "Connect forms, CRM, ecommerce, ERP, dashboards, or notifications",
      "Build automations around clear ownership rules",
      "Create exception paths for errors and handoffs",
    ],
    firstThingsToCheck: [
      "Manual handoffs",
      "Repeated data entry",
      "Approval or status steps",
      "Tool gaps",
      "Error handling",
      "Reporting visibility",
    ],
    commonMistakes: [
      "Automating a messy workflow before defining ownership",
      "Connecting tools without deciding the source of truth",
      "Ignoring exception handling",
    ],
    expectedOutcomes: [
      "Less repeated manual work",
      "Clearer ownership",
      "More reliable handoffs and reporting",
    ],
    relatedOffers: ["business_systems", "backend_integrations", "client_dashboard"],
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Which task eats the most time right now: data entry, lead routing, reporting, order handling, scheduling, or internal coordination?",
  },
  tracking_visibility: {
    key: "tracking_visibility",
    title: "Tracking Visibility Framework",
    problemStatement:
      "Tracking gives the business decision visibility. Without it, growth decisions become guesswork.",
    consultantFrame:
      "Opzix checks whether the business can see where visitors come from, what actions they take, which actions matter, and whether the data reaches the tools used to make decisions.",
    howOpzixHelps: [
      "Review GA4, GTM, pixels, and conversion events",
      "Define the actions that should count as conversions",
      "Set up or clean event tracking",
      "Validate forms, bookings, calls, carts, or checkout events",
      "Connect reporting to dashboards or campaign decisions",
    ],
    firstThingsToCheck: [
      "GA4 setup",
      "GTM container",
      "Conversion events",
      "Pixel firing",
      "Form and booking tracking",
      "Source attribution",
      "Reporting clarity",
    ],
    commonMistakes: [
      "Tracking pageviews but not meaningful actions",
      "Counting duplicate or broken conversion events",
      "Running ads without validating post-click tracking",
    ],
    expectedOutcomes: [
      "Cleaner conversion visibility",
      "More reliable campaign and website decisions",
      "Less guesswork around what is working",
    ],
    relatedOffers: ["analytics_tracking", "client_dashboard", "google_ads_ad_readiness"],
    recommendedNextStep: "free_audit",
    followUpQuestion:
      "What are you trying to track most clearly: form submissions, booked calls, purchases, calls, ad conversions, or lead quality?",
  },
  ai_assistant_adoption: {
    key: "ai_assistant_adoption",
    title: "AI Assistant Adoption Framework",
    problemStatement:
      "An AI assistant should be designed around a business job, not added as a generic chat widget.",
    consultantFrame:
      "Opzix starts by defining what the assistant should do: answer questions, qualify leads, collect intake details, route conversations, support customers, or trigger a handoff.",
    howOpzixHelps: [
      "Define the assistant's business job",
      "Map qualifying questions and escalation rules",
      "Connect conversation context to CRM, email, booking, or support tools",
      "Design safe answer boundaries and handoff logic",
      "Measure whether the assistant improves the customer journey",
    ],
    firstThingsToCheck: [
      "Primary assistant job",
      "Audience questions",
      "Knowledge boundaries",
      "Lead or support routing",
      "Human handoff",
      "Success metrics",
    ],
    commonMistakes: [
      "Launching a generic bot with no workflow",
      "Trying to replace human judgment instead of improving intake and routing",
      "Collecting conversation data without a follow-up path",
    ],
    expectedOutcomes: [
      "Clearer visitor guidance",
      "Better lead qualification or support routing",
      "Less repetitive manual answering",
    ],
    relatedOffers: ["ai_assistant_chatbot", "crm_email_automation", "support_ticket_flow"],
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "What should AI help with first: answering questions, qualifying leads, booking appointments, support, or routing inquiries?",
  },
  ecommerce_growth: {
    key: "ecommerce_growth",
    title: "Ecommerce Growth Framework",
    problemStatement:
      "Ecommerce growth usually depends on product discovery, product-page confidence, checkout trust, tracking, and retention.",
    consultantFrame:
      "Opzix separates storefront clarity from operational and tracking issues so growth work does not stop at prettier product pages.",
    howOpzixHelps: [
      "Review product and category discovery",
      "Improve product-page confidence and proof",
      "Reduce cart and checkout friction",
      "Validate tracking and attribution",
      "Connect email/SMS, inventory, CRM, or fulfillment handoffs",
    ],
    firstThingsToCheck: [
      "Product discovery",
      "Product-page clarity",
      "Trust signals",
      "Cart and checkout",
      "Shipping/returns clarity",
      "Retention capture",
      "Tracking",
    ],
    commonMistakes: [
      "Driving more traffic to weak product pages",
      "Ignoring mobile filtering and product confidence",
      "Treating checkout as separate from tracking and follow-up",
    ],
    expectedOutcomes: [
      "Clearer buying paths",
      "Better product confidence",
      "More reliable ecommerce measurement",
    ],
    relatedOffers: ["ecommerce_storefront", "ecommerce_audit", "analytics_tracking"],
    recommendedNextStep: "free_audit",
    followUpQuestion:
      "Where does the ecommerce path feel weakest: product discovery, product pages, cart, checkout, tracking, or follow-up?",
  },
  business_systems: {
    key: "business_systems",
    title: "Business Systems Framework",
    problemStatement:
      "Business systems connect the customer journey with the operations behind it.",
    consultantFrame:
      "Opzix maps how a customer moves from first touch to conversion, follow-up, delivery, reporting, and repeat action, then identifies which parts need to be built or connected.",
    howOpzixHelps: [
      "Map the customer journey and internal workflow",
      "Identify disconnected tools and handoffs",
      "Connect website, CRM, forms, automation, dashboards, or backend systems",
      "Define tracking and ownership rules",
      "Build a practical roadmap instead of a random feature list",
    ],
    firstThingsToCheck: [
      "Customer journey",
      "Lead or order handoff",
      "Tool stack",
      "Data ownership",
      "Reporting needs",
      "Manual work",
    ],
    commonMistakes: [
      "Buying tools before mapping the workflow",
      "Building features that do not support the next customer action",
      "Letting data live in disconnected places",
    ],
    expectedOutcomes: [
      "A clearer operating system",
      "Better handoffs",
      "More useful data and fewer disconnected workflows",
    ],
    relatedOffers: ["business_systems", "backend_integrations", "client_dashboard"],
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Are you trying to build something new, fix an existing workflow, or connect tools that already exist?",
  },
  website_launch: {
    key: "website_launch",
    title: "Website Launch Framework",
    problemStatement:
      "If there is no website yet, the first step is not design. The first step is mapping the offer, customer journey, lead capture, tracking, and follow-up path.",
    consultantFrame:
      "Opzix treats a new website as the first version of a growth system: message, page structure, conversion path, tracking, and operational handoff.",
    howOpzixHelps: [
      "Clarify the offer and audience",
      "Plan the landing page or website architecture",
      "Design lead capture, booking, or ecommerce paths",
      "Set up launch tracking",
      "Connect follow-up or CRM workflows",
      "Define what should come after launch",
    ],
    firstThingsToCheck: [
      "Offer clarity",
      "Audience",
      "Core pages",
      "Primary CTA",
      "Lead capture",
      "Tracking",
      "Follow-up",
    ],
    commonMistakes: [
      "Starting with visuals before the offer is clear",
      "Launching without tracking",
      "Collecting leads without a follow-up plan",
    ],
    expectedOutcomes: [
      "A clearer launch scope",
      "A website built around the first useful customer action",
      "Tracking and follow-up from day one",
    ],
    relatedOffers: ["website_development", "booking_intake_flow", "analytics_tracking"],
    recommendedNextStep: "strategy_call",
    followUpQuestion:
      "Are you launching a simple landing page, a full service website, an ecommerce site, or a connected system with CRM/booking/automation?",
  },
};

export function getZoraSolutionFramework(key: ZoraSolutionFrameworkKey) {
  return OPZIX_SOLUTION_FRAMEWORKS[key];
}

export function isZoraSolutionFrameworkKey(value: unknown): value is ZoraSolutionFrameworkKey {
  return typeof value === "string" && value in OPZIX_SOLUTION_FRAMEWORKS;
}
