export type OpzixConsultingPlaybook = {
  key: string;
  offerKey: string;
  openingConsultantFrame: string;
  discoveryQuestions: Array<{
    key: string;
    question: string;
    expectedShortAnswers: string[];
  }>;
  responseBranches: Record<
    string,
    {
      whenUserSays: string[];
      consultantResponse: string;
      nextQuestion?: string;
      recommendedNextStep?: "free_audit" | "strategy_call" | "ask_followup";
    }
  >;
  examples: string[];
};

export type ConsultingPlaybookResponse = {
  message: string;
  playbookKey: string;
  offerKey: string;
  discoveryQuestionKey?: string;
  lastZoraQuestion?: string;
  lastExpectedAnswerSet?: string[];
  recommendedNextStep?: "free_audit" | "strategy_call" | "ask_followup";
};

export const OPZIX_CONSULTING_PLAYBOOKS: OpzixConsultingPlaybook[] = [
  {
    key: "dashboard_playbook",
    offerKey: "dashboards_portals",
    openingConsultantFrame:
      "Dashboards are most useful when they are designed around a decision, not just charts.",
    discoveryQuestions: [
      {
        key: "audience",
        question: "Who is the dashboard for: internal staff, managers, clients, customers, or a mix?",
        expectedShortAnswers: ["internal staff", "team", "employees", "operations", "managers", "clients", "customers", "mix"],
      },
    ],
    responseBranches: {
      internal_staff: {
        whenUserSays: ["internal staff", "team", "employees", "operations", "staff"],
        consultantResponse:
          "For internal staff, the dashboard should help the team see what needs attention without switching tools. That might include new leads, unassigned inquiries, bookings, support tickets, audit activity, campaign performance, ecommerce metrics, or operational tasks. The goal is not just reporting; it is faster decisions and fewer dropped handoffs.",
        nextQuestion:
          "What would your internal staff need to see first: leads, bookings, tasks, support tickets, sales activity, or performance metrics?",
      },
      clients: {
        whenUserSays: ["clients", "customers", "client portal", "customer portal"],
        consultantResponse:
          "For clients or customers, the dashboard should make status and progress clear. That might include project updates, reports, documents, tickets, analytics, or next steps. The goal is transparency without requiring manual follow-up.",
        nextQuestion: "What would clients need to check most often?",
      },
      managers: {
        whenUserSays: ["managers", "leadership", "owners", "executives"],
        consultantResponse:
          "For managers, the dashboard should show the few metrics and exceptions that drive decisions: lead volume, response speed, sales activity, campaign performance, support load, revenue signals, or operational bottlenecks.",
        nextQuestion: "Which decisions should managers be able to make from the dashboard?",
      },
    },
    examples: ["internal staff", "clients", "managers"],
  },
  {
    key: "ai_assistant_playbook",
    offerKey: "ai_assistants_chatbots",
    openingConsultantFrame:
      "An AI assistant works best when it is designed around a specific job, not just placed on a website as a generic chat box.",
    discoveryQuestions: [
      {
        key: "first_job",
        question:
          "What would you want the AI assistant to handle first: lead qualification, customer questions, booking, support, or internal workflow help?",
        expectedShortAnswers: ["lead qualification", "qualify leads", "customer questions", "booking", "support", "routing", "internal workflow"],
      },
    ],
    responseBranches: {
      lead_qualification: {
        whenUserSays: ["lead qualification", "qualify leads", "sales questions"],
        consultantResponse:
          "Then the AI assistant should be designed as a qualification layer, not just a chat widget. It should ask the right intake questions, identify intent, collect contact details, and route strong prospects to a form, CRM, or booking flow.",
        nextQuestion: "What makes a lead qualified for your business?",
      },
      booking: {
        whenUserSays: ["booking", "appointments", "book calls", "calendar"],
        consultantResponse:
          "Then the assistant should qualify the visitor before it pushes them to a calendar, and pass context into the booking or follow-up flow so the call starts warmer.",
        nextQuestion: "What should someone answer before they are invited to book?",
      },
      support: {
        whenUserSays: ["support", "customer support", "help requests"],
        consultantResponse:
          "Then the assistant should separate routine questions from issues that need a human. It can collect context, answer safe questions, and route unresolved or sensitive cases into a support workflow.",
        nextQuestion: "What support questions come up most often?",
      },
    },
    examples: ["lead qualification", "booking", "support"],
  },
  {
    key: "lead_capture_playbook",
    offerKey: "lead_capture",
    openingConsultantFrame:
      "Lead capture is not just a form. It is the system that turns visitor interest into usable contact information and context.",
    discoveryQuestions: [
      {
        key: "capture_goal",
        question:
          "Are you trying to capture more leads, qualify them better, or make sure they reach the right person after submission?",
        expectedShortAnswers: ["more leads", "qualify", "reach the right person", "routing", "follow up"],
      },
    ],
    responseBranches: {
      qualify: {
        whenUserSays: ["qualify", "better leads", "quality"],
        consultantResponse:
          "Then I would focus the capture path on intent and fit, not just contact details. The form, chat, or booking flow should collect enough context to route the lead without making the first step feel heavy.",
        nextQuestion: "What information tells you whether a lead is worth fast follow-up?",
      },
      routing: {
        whenUserSays: ["routing", "right person", "sales team", "operations"],
        consultantResponse:
          "Then the lead capture system needs ownership rules. Each submission should carry context, source, and next-step routing so the right person knows what to do.",
        nextQuestion: "Who should own new leads after they submit?",
      },
    },
    examples: ["qualify them better", "right person", "sales team"],
  },
  {
    key: "tracking_playbook",
    offerKey: "analytics_tracking",
    openingConsultantFrame:
      "Tracking is useful when it tells the business which actions and channels are actually producing outcomes.",
    discoveryQuestions: [
      {
        key: "tracking_goal",
        question: "What are you trying to track first: forms, booked calls, purchases, ad conversions, or lead source quality?",
        expectedShortAnswers: ["forms", "booked calls", "purchases", "ad conversions", "lead source"],
      },
    ],
    responseBranches: {
      forms: {
        whenUserSays: ["forms", "form submissions", "leads"],
        consultantResponse:
          "For forms, I would validate the submit event, source attribution, hidden fields, confirmation state, and whether the CRM receives the same context analytics sees.",
        nextQuestion: "Do form submissions currently land in a CRM, email inbox, or spreadsheet?",
      },
      ads: {
        whenUserSays: ["ad conversions", "ads", "google ads"],
        consultantResponse:
          "For ad conversions, I would check the landing-page event, primary conversion, secondary signals, Google Ads import, and whether the tracked action is actually a qualified business outcome.",
        nextQuestion: "What action should count as the primary conversion?",
      },
    },
    examples: ["forms", "ad conversions"],
  },
  {
    key: "google_ads_playbook",
    offerKey: "google_ads_ad_readiness",
    openingConsultantFrame:
      "Google Ads works better when the offer, landing page, tracking, and follow-up path are ready before spend increases.",
    discoveryQuestions: [
      {
        key: "ads_stage",
        question:
          "Are you trying to launch ads for the first time, fix underperforming ads, or make sure tracking is set up correctly?",
        expectedShortAnswers: ["first time", "launch", "underperforming", "tracking", "fix ads"],
      },
    ],
    responseBranches: {
      first_time: {
        whenUserSays: ["first time", "launch", "new ads"],
        consultantResponse:
          "Then I would not start with ads alone. I would first make sure the landing page, offer, tracking, and follow-up path are ready. Otherwise, paid traffic can expose the leak faster without fixing it.",
        nextQuestion: "Where are you sending the ads: homepage, landing page, ecommerce product page, or booking page?",
      },
      tracking: {
        whenUserSays: ["tracking", "conversion tracking", "set up correctly"],
        consultantResponse:
          "Then I would start with the conversion events and reporting path. Google Ads needs a clean primary conversion, useful secondary conversions, and a landing path that makes those events meaningful.",
        nextQuestion: "What should count as the main conversion: form submission, booked call, purchase, or qualified lead?",
      },
    },
    examples: ["first time launching ads", "tracking"],
  },
  {
    key: "website_landing_page_playbook",
    offerKey: "landing_pages",
    openingConsultantFrame:
      "A landing page should match one audience, one offer, and one action.",
    discoveryQuestions: [
      {
        key: "traffic_source",
        question: "Where would traffic come from: ads, email, social, search, or referrals?",
        expectedShortAnswers: ["ads", "email", "social", "search", "referrals"],
      },
    ],
    responseBranches: {
      ads: {
        whenUserSays: ["ads", "google ads", "paid traffic"],
        consultantResponse:
          "For paid traffic, I would build the landing page around message match, proof, CTA clarity, conversion tracking, and follow-up. The page should make one next step obvious.",
        nextQuestion: "What action should the page drive: form, booking, call, purchase, or quote request?",
      },
    },
    examples: ["ads", "booking page"],
  },
  {
    key: "ecommerce_storefront_playbook",
    offerKey: "ecommerce_storefronts",
    openingConsultantFrame:
      "An ecommerce storefront has to help shoppers find, trust, and buy the right product.",
    discoveryQuestions: [
      {
        key: "store_stage",
        question: "Are you launching a new store, rebuilding one, or improving an existing storefront?",
        expectedShortAnswers: ["new store", "rebuilding", "improving", "existing"],
      },
    ],
    responseBranches: {
      improving: {
        whenUserSays: ["improving", "existing", "not converting"],
        consultantResponse:
          "Then I would review product discovery, product-page confidence, cart and checkout friction, tracking, and post-purchase or abandoned-cart follow-up before prescribing a rebuild.",
        nextQuestion: "Where do shoppers seem to lose momentum: finding products, product pages, cart, or checkout?",
      },
    },
    examples: ["existing store", "improving"],
  },
  {
    key: "crm_followup_playbook",
    offerKey: "crm_email_automation",
    openingConsultantFrame:
      "CRM and follow-up systems should make sure every real inquiry has context, ownership, and a next step.",
    discoveryQuestions: [
      {
        key: "lead_destination",
        question: "Where do leads go right now after someone submits a form or asks for help?",
        expectedShortAnswers: ["crm", "email", "spreadsheet", "netsuite", "salesforce", "hubspot"],
      },
    ],
    responseBranches: {
      crm: {
        whenUserSays: ["crm", "hubspot", "salesforce", "netsuite"],
        consultantResponse:
          "Then I would check what fields are required, how leads are tagged, who owns follow-up, and what happens when the CRM rejects or duplicates a record.",
        nextQuestion: "What information has to arrive with each lead?",
      },
    },
    examples: ["CRM", "NetSuite"],
  },
  {
    key: "backend_integrations_playbook",
    offerKey: "backend_integrations",
    openingConsultantFrame:
      "Integrations should be scoped around data ownership, sync direction, triggers, and exception handling.",
    discoveryQuestions: [
      {
        key: "systems",
        question: "Which systems need to connect, and what data should move first?",
        expectedShortAnswers: ["Shopify", "BigCommerce", "NetSuite", "orders", "customers", "inventory"],
      },
    ],
    responseBranches: {
      systems: {
        whenUserSays: ["Shopify", "BigCommerce", "NetSuite", "ERP", "CRM"],
        consultantResponse:
          "Good. For named systems, I would map the source of truth, sync direction, required fields, trigger timing, and error handling before building the connection.",
        nextQuestion: "What should sync first: orders, customers, products, inventory, leads, or reporting data?",
      },
    },
    examples: ["Shopify to NetSuite", "orders"],
  },
  {
    key: "conversion_optimization_playbook",
    offerKey: "conversion_optimization",
    openingConsultantFrame:
      "Conversion optimization should start with where intent is being lost, not random page changes.",
    discoveryQuestions: [
      {
        key: "dropoff",
        question: "Where does the conversion problem seem to happen: page, form, cart, checkout, booking, or follow-up?",
        expectedShortAnswers: ["page", "form", "cart", "checkout", "booking", "follow-up"],
      },
    ],
    responseBranches: {
      form: {
        whenUserSays: ["form", "lead form"],
        consultantResponse:
          "For form drop-off, I would review the offer context, field count, trust signals, mobile usability, confirmation message, and CRM handoff.",
        nextQuestion: "Is the issue fewer submissions, low-quality submissions, or missed follow-up after submission?",
      },
    },
    examples: ["form", "checkout"],
  },
];

export const OPZIX_CONSULTING_PLAYBOOKS_BY_KEY = OPZIX_CONSULTING_PLAYBOOKS.reduce(
  (playbooks, playbook) => {
    playbooks[playbook.key] = playbook;
    return playbooks;
  },
  {} as Record<string, OpzixConsultingPlaybook>,
);

export const OPZIX_PLAYBOOK_BY_OFFER_KEY = OPZIX_CONSULTING_PLAYBOOKS.reduce(
  (playbooks, playbook) => {
    playbooks[playbook.offerKey] = playbook;
    return playbooks;
  },
  {} as Record<string, OpzixConsultingPlaybook>,
);

const offerKeyAliases: Record<string, string> = {
  ai_assistant_chatbot: "ai_assistants_chatbots",
  client_dashboard: "dashboards_portals",
  analytics_tracking: "analytics_tracking",
  backend_integrations: "backend_integrations",
  crm_email_automation: "crm_email_automation",
  conversion_optimization: "conversion_optimization",
  ecommerce_storefront: "ecommerce_storefronts",
  website_development: "website_development",
  booking_intake_flow: "booking_intake_flows",
  support_ticket_flow: "support_ticket_flows",
  google_ads_ad_readiness: "google_ads_ad_readiness",
};

export function consultingOfferKeyForLegacyOffer(key?: string) {
  if (!key) return undefined;
  return offerKeyAliases[key] || key;
}

export function playbookForOfferKey(key?: string) {
  const consultingOfferKey = consultingOfferKeyForLegacyOffer(key);
  return consultingOfferKey ? OPZIX_PLAYBOOK_BY_OFFER_KEY[consultingOfferKey] : undefined;
}

export function buildPlaybookOpeningForOffer(key?: string): ConsultingPlaybookResponse | undefined {
  const playbook = playbookForOfferKey(key);
  const firstQuestion = playbook?.discoveryQuestions[0];

  if (!playbook || !firstQuestion) return undefined;

  return {
    message: `${playbook.openingConsultantFrame}\n\n${firstQuestion.question}`,
    playbookKey: playbook.key,
    offerKey: playbook.offerKey,
    discoveryQuestionKey: firstQuestion.key,
    lastZoraQuestion: firstQuestion.question,
    lastExpectedAnswerSet: firstQuestion.expectedShortAnswers,
    recommendedNextStep: "ask_followup",
  };
}

export function buildPlaybookBranchResponse(input: {
  playbookKey?: string;
  message: string;
}): ConsultingPlaybookResponse | undefined {
  if (!input.playbookKey) return undefined;

  const playbook = OPZIX_CONSULTING_PLAYBOOKS_BY_KEY[input.playbookKey];
  if (!playbook) return undefined;

  const normalizedMessage = normalize(input.message);
  const branch = Object.entries(playbook.responseBranches).find(([, candidate]) =>
    candidate.whenUserSays.some((phrase) => normalizedMessage.includes(normalize(phrase))),
  );

  if (!branch) return undefined;

  const [, response] = branch;
  const discoveryQuestion = response.nextQuestion
    ? {
        key: branch[0],
        question: response.nextQuestion,
        expectedShortAnswers: [],
      }
    : playbook.discoveryQuestions[0];

  return {
    message: [response.consultantResponse, response.nextQuestion].filter(Boolean).join("\n\n"),
    playbookKey: playbook.key,
    offerKey: playbook.offerKey,
    discoveryQuestionKey: discoveryQuestion?.key,
    lastZoraQuestion: response.nextQuestion,
    lastExpectedAnswerSet: discoveryQuestion?.expectedShortAnswers,
    recommendedNextStep: response.recommendedNextStep || "ask_followup",
  };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
