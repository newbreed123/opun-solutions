import type { OpzixBrainConcept, OpzixBrainEntry } from "./types";

export const OPZIX_BRAIN_CONCEPTS: Record<OpzixBrainConcept, OpzixBrainEntry> = {
  tracking_visibility: {
    concept: "tracking_visibility",
    title: "Tracking Visibility",
    shortDefinition:
      "Tracking visibility means knowing which traffic sources, campaigns, pages, forms, and customer actions are actually producing leads, sales, bookings, or appointments.",
    whyItMatters:
      "Without tracking, the business is making decisions from opinion instead of evidence. You may spend money on campaigns that do not convert, redesign pages that are not the real bottleneck, or miss the exact point where customers are dropping off.",
    businessRisk:
      "Poor tracking causes wasted ad spend, unclear ROI, weak prioritization, and disagreement over what is actually working.",
    whatGoodLooksLike:
      "Good tracking connects traffic source, page behavior, conversion events, form submissions, bookings, purchases, and follow-up outcomes into one clear view.",
    commonMistakes: [
      "Installing analytics but never defining the events that matter.",
      "Counting traffic without tying it to leads, sales, bookings, or revenue.",
      "Losing source attribution once a form, booking tool, checkout, or CRM handoff begins.",
    ],
    whatOpzixWouldValidate: [
      "GA4 / analytics setup",
      "conversion events",
      "form tracking",
      "booking tracking",
      "ecommerce events",
      "CRM/source attribution",
      "dashboard visibility",
    ],
    relatedConcepts: ["conversion_path", "lead_capture", "crm_routing"],
    industryVariants: {
      ecommerce_dtc: {
        explanation:
          "For ecommerce, tracking should show product views, add-to-cart, checkout starts, purchases, revenue by source, and abandoned-cart behavior.",
        examples: ["product view to purchase path", "revenue by campaign", "cart abandonment"],
        whatToValidate: ["purchase events", "checkout events", "product events", "email/SMS attribution"],
      },
      real_estate: {
        explanation:
          "For real estate, tracking should show which sources create seller leads, buyer inquiries, booked calls, home valuation requests, and follow-up outcomes.",
        examples: ["seller valuation requests", "buyer inquiries", "Zillow or organic source quality"],
        whatToValidate: ["lead source fields", "booking events", "CRM attribution", "follow-up outcome"],
      },
      healthcare_care: {
        explanation:
          "For healthcare and care, tracking should show referral sources, intake requests, service-page engagement, phone clicks, form completions, and response handoff.",
        examples: ["service-line interest", "intake starts", "phone clicks"],
        whatToValidate: ["intake events", "call tracking", "referral source", "routing status"],
      },
      service_business: {
        explanation:
          "For service businesses, tracking should show which landing pages, forms, calls, booking paths, and campaigns produce qualified leads.",
        examples: ["quote requests", "call clicks", "booked consultations"],
        whatToValidate: ["form events", "call events", "booking events", "qualified lead status"],
      },
    },
  },
  conversion_path: {
    concept: "conversion_path",
    title: "Conversion Path",
    shortDefinition:
      "A conversion path is the sequence a visitor follows from first landing on the site to taking the action the business wants.",
    whyItMatters:
      "Conversion problems usually come from the path, not one isolated button. Visitors need clarity, trust, relevance, and a low-friction next step before they act.",
    businessRisk:
      "A weak conversion path turns traffic into abandoned carts, incomplete forms, unbooked calls, or confused visits that never become revenue.",
    whatGoodLooksLike:
      "A good path helps the visitor understand the offer, evaluate trust, choose the right action, and complete that action without unnecessary friction.",
    commonMistakes: [
      "Sending every visitor to the same generic page.",
      "Optimizing button color before checking the full customer journey.",
      "Asking for commitment before the page has answered the visitor's main objection.",
    ],
    whatOpzixWouldValidate: [
      "landing-page match",
      "CTA sequence",
      "mobile path",
      "form or checkout steps",
      "trust placement",
      "drop-off points",
    ],
    relatedConcepts: ["offer_clarity", "trust_signals", "tracking_visibility"],
    industryVariants: {
      ecommerce_dtc: {
        explanation:
          "For ecommerce, the conversion path runs through product discovery, product confidence, cart, checkout, and post-purchase or abandoned-cart follow-up.",
        examples: ["category to product page", "cart to checkout", "checkout to purchase"],
        whatToValidate: ["filters", "product page clarity", "cart friction", "checkout events"],
      },
      real_estate: {
        explanation:
          "For real estate, the path should separate buyer intent, seller intent, local proof, capture, booking, and CRM follow-up.",
        examples: ["home valuation path", "showing request", "buyer consultation"],
        whatToValidate: ["buyer/seller CTAs", "booking flow", "CRM handoff"],
      },
      healthcare_care: {
        explanation:
          "For healthcare and care, the path usually runs from service or provider discovery to appointment, intake, referral, or care coordination.",
        examples: ["provider directory", "appointment request", "care intake form"],
        whatToValidate: ["service clarity", "intake friction", "routing latency"],
      },
    },
  },
  offer_clarity: {
    concept: "offer_clarity",
    title: "Offer Clarity",
    shortDefinition:
      "Offer clarity means a visitor quickly understands who the business helps, what outcome is being offered, why it is credible, and what to do next.",
    whyItMatters:
      "Traffic only has a fair chance when the first promise is clear. If the visitor has to decode the offer, they are more likely to compare, hesitate, or leave.",
    businessRisk:
      "Weak offer clarity makes good traffic look bad, lowers conversion rates, and causes teams to spend money fixing the wrong part of the funnel.",
    whatGoodLooksLike:
      "A clear offer states the audience, outcome, proof, differentiator, and next action without forcing the visitor to infer the value.",
    commonMistakes: [
      "Leading with a broad slogan instead of a concrete outcome.",
      "Using the same message for every audience.",
      "Hiding proof, pricing context, or next-step clarity too far from the CTA.",
    ],
    whatOpzixWouldValidate: [
      "headline",
      "primary CTA",
      "audience specificity",
      "proof near the CTA",
      "first objection handling",
      "landing-page match to traffic source",
    ],
    relatedConcepts: ["conversion_path", "trust_signals", "lead_capture"],
    industryVariants: {
      ecommerce_dtc: {
        explanation:
          "For ecommerce, offer clarity should explain why this product, why this brand, and why the shopper should buy now.",
        examples: ["hero promise", "product benefit", "shipping/returns promise"],
        whatToValidate: ["headline", "product positioning", "CTA copy"],
      },
      service_business: {
        explanation:
          "For service businesses, offer clarity should make the problem, service, outcome, and consultation path obvious.",
        examples: ["service page headline", "quote CTA", "local proof"],
        whatToValidate: ["service specificity", "CTA clarity", "proof near forms"],
      },
    },
  },
  lead_capture: {
    concept: "lead_capture",
    title: "Lead Capture",
    shortDefinition:
      "Lead capture is the moment visitor intent becomes usable contact information and context for follow-up.",
    whyItMatters:
      "A website can create interest and still lose the opportunity if the form, chat, booking, or call path is unclear or asks for too much too soon.",
    businessRisk:
      "Poor lead capture creates fewer inquiries, lower-quality context, slower follow-up, and confusion about what the prospect actually needs.",
    whatGoodLooksLike:
      "Good lead capture collects enough information to route the inquiry while keeping the first action easy, clear, and trustworthy.",
    commonMistakes: [
      "Using long forms before trust is established.",
      "Collecting leads without source or service context.",
      "Failing to show what happens after the visitor submits.",
    ],
    whatOpzixWouldValidate: [
      "form fields",
      "CTA context",
      "source capture",
      "confirmation state",
      "CRM handoff",
      "lead quality signals",
    ],
    relatedConcepts: ["follow_up_speed", "crm_routing", "booking_flow"],
    industryVariants: {
      real_estate: {
        explanation:
          "For real estate, capture should distinguish buyer, seller, valuation, showing, and referral intent.",
        examples: ["seller valuation", "buyer consultation", "showing request"],
        whatToValidate: ["intent fields", "CRM tags", "booking path"],
      },
      healthcare_care: {
        explanation:
          "For healthcare and care, capture should support intake and referral context without creating unnecessary patient friction.",
        examples: ["care inquiry", "referral partner form", "appointment request"],
        whatToValidate: ["intake fields", "routing rules", "response expectations"],
      },
      service_business: {
        explanation:
          "For service businesses, capture should separate urgent requests, quotes, consultations, and general questions.",
        examples: ["quote form", "call request", "booking form"],
        whatToValidate: ["field length", "urgency tags", "owner assignment"],
      },
    },
  },
  follow_up_speed: {
    concept: "follow_up_speed",
    title: "Follow-Up Speed",
    shortDefinition:
      "Follow-up speed is how quickly a real inquiry gets a useful response after a form, call, chat, booking request, or cart signal.",
    whyItMatters:
      "Intent cools quickly. The longer someone waits, the more likely they are to compare other options, forget the original need, or choose a competitor.",
    businessRisk:
      "Slow follow-up wastes demand the business already earned and can make ads, SEO, and website work look less effective than they are.",
    whatGoodLooksLike:
      "A high-intent inquiry is acknowledged immediately, routed to the right owner, and followed by a relevant next action within minutes.",
    commonMistakes: [
      "Letting form submissions sit in a shared inbox.",
      "Sending generic auto-replies with no next step.",
      "Measuring lead volume but not response time or booked outcome.",
    ],
    whatOpzixWouldValidate: [
      "notification timing",
      "lead owner",
      "CRM task creation",
      "email/SMS response path",
      "missed lead handling",
      "response-time reporting",
    ],
    relatedConcepts: ["crm_routing", "lead_capture", "booking_flow"],
    industryVariants: {
      healthcare_care: {
        explanation:
          "For care and healthcare, delayed follow-up can feel like an operational reliability problem at the exact moment trust matters.",
        examples: ["intake request", "referral inquiry", "appointment request"],
        whatToValidate: ["routing latency", "patient coordinator alerts", "follow-up status"],
      },
      real_estate: {
        explanation:
          "For real estate, speed-to-lead matters because buyers and sellers often contact more than one agent in the same session.",
        examples: ["portal lead", "valuation request", "showing inquiry"],
        whatToValidate: ["instant alerts", "CRM assignment", "SMS/email sequence"],
      },
      local_service: {
        explanation:
          "For local services, the first credible response often wins because search visitors are actively comparing nearby providers.",
        examples: ["quote request", "emergency call", "appointment inquiry"],
        whatToValidate: ["call routing", "response SLA", "booking handoff"],
      },
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
      "Weak routing creates lost leads, duplicate outreach, unclear sales ownership, and reporting that cannot explain what happened.",
    whatGoodLooksLike:
      "New contacts are tagged by source and intent, assigned correctly, given a next task, and visible in the right pipeline stage.",
    commonMistakes: [
      "Sending every inquiry into the same generic list.",
      "Skipping source, service, urgency, or location tags.",
      "Treating form submission as the end of the journey instead of the start of a workflow.",
    ],
    whatOpzixWouldValidate: [
      "CRM fields",
      "source attribution",
      "assignment rules",
      "pipeline stages",
      "handoff alerts",
      "follow-up automations",
    ],
    relatedConcepts: ["lead_capture", "follow_up_speed", "booking_flow"],
    industryVariants: {
      service_business: {
        explanation:
          "For service businesses, routing should separate quote requests, urgent requests, booked appointments, and unqualified inquiries.",
        examples: ["quote pipeline", "urgent request owner", "consultation booked"],
        whatToValidate: ["assignment rules", "pipeline stages", "task creation"],
      },
      healthcare_care: {
        explanation:
          "For healthcare and care, routing should respect service line, location, intake urgency, and compliance-sensitive handling.",
        examples: ["intake coordinator", "location routing", "referral partner"],
        whatToValidate: ["service tags", "routing alerts", "handoff status"],
      },
      real_estate: {
        explanation:
          "For real estate, routing should separate buyer, seller, valuation, showing, investor, and referral partner intent.",
        examples: ["buyer lead", "seller valuation", "showing request"],
        whatToValidate: ["lead type tags", "agent assignment", "source attribution"],
      },
    },
  },
  product_discovery: {
    concept: "product_discovery",
    title: "Product Discovery",
    shortDefinition:
      "Product discovery is how easily shoppers can find the right product, category, size, variant, spec, or solution.",
    whyItMatters:
      "If shoppers cannot find the right option quickly, they rarely reach the point where price, reviews, or checkout matter.",
    businessRisk:
      "Weak discovery lowers conversion, hides products that should sell, and makes paid traffic less efficient.",
    whatGoodLooksLike:
      "Good discovery uses search, categories, filters, product cards, and product pages to help shoppers narrow choices with confidence.",
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
    relatedConcepts: ["conversion_path", "trust_signals", "tracking_visibility"],
    industryVariants: {
      ecommerce_dtc: {
        explanation:
          "For ecommerce, product discovery should reduce choice friction and help shoppers understand fit before checkout.",
        examples: ["size filters", "category pages", "recommendations"],
        whatToValidate: ["search", "filters", "product cards", "mobile UX"],
      },
      industrial_b2b_catalog: {
        explanation:
          "For industrial catalogs, discovery should support specs, part numbers, compatibility, documentation, and reorder workflows.",
        examples: ["SKU search", "spec filters", "quote path"],
        whatToValidate: ["part search", "spec data", "compatibility details"],
      },
      marketplace_retail: {
        explanation:
          "For marketplace or enterprise retail, discovery depends on search relevance, department hierarchy, availability, and filtering at scale.",
        examples: ["department navigation", "local availability", "brand filters"],
        whatToValidate: ["search relevance", "availability cues", "filter behavior"],
      },
    },
  },
  booking_flow: {
    concept: "booking_flow",
    title: "Booking Flow",
    shortDefinition:
      "A booking flow is the path from interest to a scheduled appointment, consultation, demo, reservation, or intake conversation.",
    whyItMatters:
      "A visitor can be interested and still abandon if scheduling feels confusing, invasive, or disconnected from the offer.",
    businessRisk:
      "Poor booking flows create missed appointments, low-quality calls, no-shows, and lost prospects who were ready to act.",
    whatGoodLooksLike:
      "The user knows what they are booking, how long it takes, who it is for, what happens next, and receives confirmation quickly.",
    commonMistakes: [
      "Asking too many questions before showing availability.",
      "Using generic calendar language that does not match the offer.",
      "Failing to pass booking context into the CRM or operations system.",
    ],
    whatOpzixWouldValidate: [
      "CTA wording",
      "calendar or intake steps",
      "qualification fields",
      "confirmation message",
      "CRM handoff",
      "no-show prevention",
    ],
    relatedConcepts: ["lead_capture", "crm_routing", "follow_up_speed"],
    industryVariants: {
      real_estate: {
        explanation:
          "For real estate, booking should distinguish buyer consultation, seller valuation, showing request, and discovery call.",
        examples: ["showing request", "valuation call", "buyer consultation"],
        whatToValidate: ["calendar context", "lead type", "CRM assignment"],
      },
      healthcare_care: {
        explanation:
          "For healthcare and care, booking should make provider, location, service, availability, and intake expectations clear.",
        examples: ["appointment request", "intake call", "provider availability"],
        whatToValidate: ["provider routing", "intake fields", "confirmation"],
      },
      restaurant_hospitality: {
        explanation:
          "For hospitality, booking should clarify availability, party size, location, confirmation, and special requests.",
        examples: ["reservation", "event inquiry", "room booking"],
        whatToValidate: ["availability", "confirmation", "handoff"],
      },
    },
  },
  trust_signals: {
    concept: "trust_signals",
    title: "Trust Signals",
    shortDefinition:
      "Trust signals are the proof elements that help a visitor feel safe taking the next step.",
    whyItMatters:
      "Visitors hesitate when a page asks for money, time, or personal information before earning confidence.",
    businessRisk:
      "Missing proof increases comparison shopping, form abandonment, cart abandonment, and low-quality inquiries.",
    whatGoodLooksLike:
      "Good trust signals place relevant reviews, credentials, policies, guarantees, case evidence, or recognizable proof near decision points.",
    commonMistakes: [
      "Hiding reviews and proof far below the CTA.",
      "Using generic testimonials that do not match the visitor's concern.",
      "Forgetting operational trust signals like shipping, returns, certifications, or response expectations.",
    ],
    whatOpzixWouldValidate: [
      "review placement",
      "testimonial relevance",
      "policy clarity",
      "credentials",
      "case proof",
      "CTA support",
    ],
    relatedConcepts: ["offer_clarity", "conversion_path", "lead_capture"],
    industryVariants: {
      ecommerce_dtc: {
        explanation:
          "For ecommerce, trust includes reviews, return clarity, shipping timelines, payment confidence, and product proof.",
        examples: ["reviews", "returns", "shipping timelines"],
        whatToValidate: ["review placement", "policy copy", "checkout trust"],
      },
      healthcare_care: {
        explanation:
          "For healthcare and care, trust depends on credentials, service clarity, compliance-aware language, staff proof, and intake expectations.",
        examples: ["provider credentials", "care services", "intake expectations"],
        whatToValidate: ["credentials", "service proof", "intake clarity"],
      },
      service_business: {
        explanation:
          "For service businesses, trust should show local proof, reviews, credentials, project examples, and clear expectations.",
        examples: ["reviews", "certifications", "case examples"],
        whatToValidate: ["proof near CTA", "local credibility", "risk reducers"],
      },
    },
  },
  ai_assistant: {
    concept: "ai_assistant",
    title: "AI Assistant",
    shortDefinition:
      "An AI assistant helps answer common questions, qualify intent, guide users to the right next step, and pass useful context to the business.",
    whyItMatters:
      "A good assistant reduces friction when visitors need answers, but it should support the customer journey instead of forcing every conversation into a sales pitch.",
    businessRisk:
      "A weak assistant repeats scripts, misclassifies users, routes people too early, or creates more operational noise for the team.",
    whatGoodLooksLike:
      "A good assistant understands context, answers direct questions, deepens the current topic, and triggers clear actions only when appropriate.",
    commonMistakes: [
      "Using the assistant as a menu tree instead of a consultant.",
      "Routing based on generated text instead of explicit action events.",
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
    relatedConcepts: ["lead_capture", "crm_routing", "follow_up_speed"],
    industryVariants: {
      service_business: {
        explanation:
          "For service businesses, an assistant should qualify the request, collect context, and route serious prospects to booking or follow-up.",
        examples: ["quote qualification", "booking guidance", "service FAQs"],
        whatToValidate: ["qualification logic", "booking action", "CRM handoff"],
      },
      healthcare_care: {
        explanation:
          "For care and healthcare, an assistant should support service navigation and intake routing without overstepping compliance boundaries.",
        examples: ["service navigation", "intake support", "location routing"],
        whatToValidate: ["safe language", "routing", "handoff expectations"],
      },
      ecommerce_dtc: {
        explanation:
          "For ecommerce, an assistant should answer fit, shipping, return, and product questions while escalating high-intent issues cleanly.",
        examples: ["product fit questions", "shipping answers", "returns support"],
        whatToValidate: ["product guidance", "support handoff", "cart recovery"],
      },
    },
  },
  bottleneck: {
    concept: "bottleneck",
    title: "Bottleneck",
    shortDefinition:
      "A bottleneck is the part of the customer journey or business process that limits growth.",
    whyItMatters:
      "If the business fixes the wrong thing, it can spend money on traffic, design, or tools while the real constraint stays in place.",
    businessRisk:
      "Misreading the bottleneck leads to wasted spend, scattered priorities, and fixes that do not improve leads, sales, or operations.",
    whatGoodLooksLike:
      "A clear bottleneck diagnosis shows where intent slows down: before the visitor acts, during the action, or after the handoff.",
    commonMistakes: [
      "Assuming traffic is the problem before checking the conversion path.",
      "Redesigning pages before checking lead capture or follow-up.",
      "Treating every symptom as a separate problem.",
    ],
    whatOpzixWouldValidate: ["customer journey", "traffic source", "conversion path", "lead capture", "CRM handoff", "follow-up"],
    relatedConcepts: ["customer_journey", "conversion_path", "lead_capture"],
    industryVariants: {},
  },
  customer_journey: {
    concept: "customer_journey",
    title: "Customer Journey",
    shortDefinition:
      "The customer journey is the path a person takes from first awareness to trust, action, follow-up, and eventual purchase or service delivery.",
    whyItMatters:
      "Growth systems break when each step is optimized alone and the handoffs between pages, forms, tools, and teams are ignored.",
    businessRisk:
      "A broken journey creates confusing pages, lost leads, unclear reporting, and slow follow-up.",
    whatGoodLooksLike:
      "A good journey gives the visitor clear information, a relevant next step, and a clean handoff after they act.",
    commonMistakes: ["Mapping pages but not handoffs.", "Ignoring what happens after form submission.", "Using one path for every audience."],
    whatOpzixWouldValidate: ["entry points", "offer match", "CTA path", "forms", "booking", "CRM and follow-up"],
    relatedConcepts: ["conversion_path", "offer_clarity", "follow_up_speed"],
    industryVariants: {},
  },
  landing_page: {
    concept: "landing_page",
    title: "Landing Page",
    shortDefinition:
      "A landing page gives one audience one clear path to one action, such as booking, requesting a quote, downloading a guide, or buying a product.",
    whyItMatters:
      "Unlike a homepage, a landing page removes distraction and makes paid or campaign traffic easier to understand and measure.",
    businessRisk:
      "Sending campaign traffic to a broad page can lower conversion, weaken tracking, and make ads look worse than they are.",
    whatGoodLooksLike:
      "A good landing page has message match, a clear offer, trust proof, one primary CTA, and conversion tracking.",
    commonMistakes: ["Using the homepage for every campaign.", "Adding too many CTAs.", "Forgetting tracking or follow-up."],
    whatOpzixWouldValidate: ["headline", "offer", "traffic match", "CTA", "proof", "tracking events"],
    relatedConcepts: ["offer_clarity", "conversion_path", "tracking_visibility"],
    industryVariants: {},
  },
  analytics_dashboard: {
    concept: "analytics_dashboard",
    title: "Analytics Dashboard",
    shortDefinition:
      "An analytics dashboard shows the metrics, events, and exceptions a team needs to make decisions without jumping between scattered tools.",
    whyItMatters:
      "Dashboards are useful when they reduce uncertainty and help teams act faster, not when they simply display charts.",
    businessRisk:
      "Weak dashboards create report clutter, missed issues, and disagreement over what is working.",
    whatGoodLooksLike:
      "A good dashboard is role-based, tied to decisions, and shows the actions or metrics that need attention.",
    commonMistakes: ["Tracking too many metrics.", "Building charts without decisions.", "Mixing unreliable data sources."],
    whatOpzixWouldValidate: ["data source", "decision owner", "metrics", "roles", "alerts", "reporting cadence"],
    relatedConcepts: ["tracking_visibility", "backend_integration", "crm_routing"],
    industryVariants: {},
  },
  automation_workflow: {
    concept: "automation_workflow",
    title: "Automation Workflow",
    shortDefinition:
      "An automation workflow moves information or tasks through a process without requiring every step to be handled manually.",
    whyItMatters:
      "Good automation reduces delay and dropped handoffs, but only when the workflow is clear before it is automated.",
    businessRisk:
      "Automating a messy process can scale errors, duplicate records, and make ownership less clear.",
    whatGoodLooksLike:
      "A good workflow has clear triggers, ownership, conditions, exceptions, and reporting.",
    commonMistakes: ["Automating before mapping the process.", "Skipping error handling.", "Not assigning ownership."],
    whatOpzixWouldValidate: ["trigger", "handoff", "owner", "data fields", "exceptions", "notifications"],
    relatedConcepts: ["crm_routing", "follow_up_speed", "backend_integration"],
    industryVariants: {},
  },
  backend_integration: {
    concept: "backend_integration",
    title: "Backend Integration",
    shortDefinition:
      "A backend integration connects systems such as ecommerce platforms, CRMs, ERPs, forms, dashboards, and operational tools so data can move reliably.",
    whyItMatters:
      "Teams lose time and accuracy when important data has to be copied manually between systems.",
    businessRisk:
      "Poor integrations create duplicate records, missing orders, inventory mismatch, and unreliable reporting.",
    whatGoodLooksLike:
      "A good integration defines source of truth, sync direction, required fields, triggers, and error handling.",
    commonMistakes: ["Connecting tools before mapping data ownership.", "Ignoring sync failures.", "Treating every field as equal."],
    whatOpzixWouldValidate: ["systems", "source of truth", "field map", "sync direction", "trigger", "exceptions"],
    relatedConcepts: ["automation_workflow", "analytics_dashboard", "crm_routing"],
    industryVariants: {},
  },
  support_ticket_flow: {
    concept: "support_ticket_flow",
    title: "Support Ticket Flow",
    shortDefinition:
      "A support ticket flow turns customer questions into trackable requests with categories, ownership, routing, status, and escalation.",
    whyItMatters:
      "Support breaks down when requests arrive through scattered channels and no one can see ownership or status.",
    businessRisk:
      "Weak support flow leads to slow replies, repeated questions, frustrated customers, and hidden operational problems.",
    whatGoodLooksLike:
      "A good support flow captures context, routes by issue type, escalates when needed, and reports response visibility.",
    commonMistakes: ["Using inboxes as ticket systems.", "No category or priority rules.", "No escalation path."],
    whatOpzixWouldValidate: ["intake", "categories", "ownership", "priority", "status", "reporting"],
    relatedConcepts: ["ai_assistant", "crm_routing", "analytics_dashboard"],
    industryVariants: {},
  },
  ecommerce_storefront: {
    concept: "ecommerce_storefront",
    title: "Ecommerce Storefront",
    shortDefinition:
      "An ecommerce storefront is the online shopping experience where customers find products, evaluate trust, add to cart, and complete checkout.",
    whyItMatters:
      "The storefront connects product discovery, product confidence, checkout, tracking, and operational handoff.",
    businessRisk:
      "A weak storefront can waste traffic, hide products, lower trust, and create checkout or fulfillment issues.",
    whatGoodLooksLike:
      "A good storefront makes products easy to find, understand, trust, and buy on mobile and desktop.",
    commonMistakes: ["Treating design separately from checkout.", "Ignoring product discovery.", "Missing ecommerce tracking."],
    whatOpzixWouldValidate: ["navigation", "product pages", "trust", "cart", "checkout", "tracking"],
    relatedConcepts: ["product_discovery", "conversion_path", "tracking_visibility"],
    industryVariants: {},
  },
  google_ads_readiness: {
    concept: "google_ads_readiness",
    title: "Google Ads Readiness",
    shortDefinition:
      "Google Ads readiness means the offer, landing page, tracking, conversion path, and follow-up system are prepared before ad spend increases.",
    whyItMatters:
      "Paid traffic can expose a weak landing path faster; it does not automatically fix the offer, page, or tracking.",
    businessRisk:
      "Running ads without readiness can waste spend, produce unclear data, and generate leads the team cannot follow up on.",
    whatGoodLooksLike:
      "Good readiness includes a focused landing page, conversion tracking, clear CTA, source attribution, and a follow-up path.",
    commonMistakes: ["Launching ads before tracking.", "Sending all traffic to the homepage.", "Counting low-quality actions as conversions."],
    whatOpzixWouldValidate: ["landing page", "offer match", "primary conversion", "secondary events", "tracking", "follow-up"],
    relatedConcepts: ["landing_page", "tracking_visibility", "conversion_path"],
    industryVariants: {},
  },
};
