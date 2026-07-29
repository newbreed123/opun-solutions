import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarCheck,
  Check,
  Globe,
  Heart,
  Home,
  LayoutGrid,
  MessageSquare,
  Search,
  ServerCog,
  ShoppingCart,
  Users,
  Zap,
} from "lucide-react";

export type IndustryCapability = {
  title: string;
  description: string;
  industries?: string[];
};

export type IndustryDirectoryCard = {
  slug: string;
  title: string;
  subtitle: string;
  problems: string[];
  solutions: string[];
  href: string;
  icon: LucideIcon;
};

export type RealEstateGrowthPlatformTier = {
  slug: string;
  name: string;
  positioning: string;
  idealCustomer: string;
  goal: string;
  implementation: string;
  launchLabel: string;
  launchPrice: string;
  platformLabel: string;
  platformPrice: string;
  investmentNote?: string;
  recommendationLabel?: string;
  recommendationSummary?: string;
  recommendationCopy?: string;
  ctaLabel?: string;
  inspirationNote?: string;
  modules: string[];
  outcomes: string[];
};

export type RealEstatePlatformModule = {
  slug: string;
  title: string;
  problem: string;
  solution: string;
  benefit: string;
  whatItDoes: string;
  whyItMatters: string;
  businessOutcome: string;
  icon: LucideIcon;
};

export const homepageIndustryCards = [
  {
    slug: "ecommerce",
    name: "Ecommerce",
    headline: "Ecommerce Growth Systems",
    copy: "Connect storefront experience, conversion paths, analytics, automation, and backend operations into a stronger ecommerce platform.",
    capabilities: [
      "Storefront experience",
      "Conversion optimization",
      "Ecommerce audits",
      "AI shopping assistants",
      "Analytics",
      "Operational integrations",
    ],
    cta: "Explore Ecommerce Solutions",
    href: "/services/ecommerce-solutions",
    icon: ShoppingCart,
  },
  {
    slug: "service-businesses",
    name: "Service Businesses",
    headline: "Lead and Operations Systems for Service Businesses",
    copy: "Connect lead capture, intake, scheduling, automation, CRM handoff, and visibility so service teams can grow with less manual work.",
    capabilities: [
      "Lead-generation platforms",
      "Booking and intake",
      "CRM automation",
      "AI assistants",
      "Tracking",
      "Dashboards",
    ],
    cta: "Explore Service Business Solutions",
    href: "/solutions/lead-generation-systems",
    icon: Users,
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    headline: "MLS-Powered Real Estate Platforms",
    copy: "Consumer search, AI guidance, operational intelligence, CRM, analytics, and customer journeys built on one connected platform.",
    capabilities: [],
    cta: "Explore Real Estate",
    href: "/industries/real-estate",
    icon: Home,
  },
];

export const industryDirectoryCards: IndustryDirectoryCard[] = [
  {
    slug: "ecommerce",
    title: "Ecommerce Brands",
    subtitle:
      "Storefront, checkout, analytics, and operations built for real online businesses.",
    problems: [
      "Poor product discovery",
      "Low checkout confidence",
      "Shipping and fulfillment complexity",
      "Weak analytics and tracking",
    ],
    solutions: [
      "Storefront development",
      "Ecommerce audits",
      "Conversion optimization",
      "AI shopping assistants",
      "Analytics and tracking",
      "Backend integrations",
    ],
    href: "/services/ecommerce-solutions",
    icon: ShoppingCart,
  },
  {
    slug: "service-businesses",
    title: "Service Businesses",
    subtitle:
      "Lead, intake, scheduling, and operations systems for teams that sell through conversations.",
    problems: [
      "Weak lead flow",
      "Manual intake and follow-up",
      "Disconnected booking and CRM tools",
      "Limited visibility into lead quality",
    ],
    solutions: [
      "Lead-generation platforms",
      "Booking and intake flows",
      "CRM and email automation",
      "AI assistants",
      "Tracking and dashboards",
      "Workflow integrations",
    ],
    href: "/solutions/lead-generation-systems",
    icon: MessageSquare,
  },
  {
    slug: "care-agencies",
    title: "Care Agencies & Healthcare Services",
    subtitle:
      "Clear service presentation and better client intake for care teams.",
    problems: [
      "Confusing service presentation",
      "Poor inquiry flow",
      "Manual booking processes",
      "Lack of structured communication",
    ],
    solutions: [
      "Clear service platforms",
      "Client intake forms",
      "Booking flow improvements",
      "Automation support",
      "Better user experience for families",
    ],
    href: "/case-studies/care-agency-growth",
    icon: Heart,
  },
  {
    slug: "local-services",
    title: "Local Service Businesses",
    subtitle: "Connected systems that turn local demand into reliable leads.",
    problems: [
      "Low online conversion",
      "Poor visibility into leads",
      "No tracking",
      "Manual follow-ups",
    ],
    solutions: [
      "Conversion-focused customer journeys",
      "Lead capture systems",
      "Google Ads and conversion tracking",
      "Automation for follow-up",
    ],
    href: "/solutions/lead-generation-systems",
    icon: Globe,
  },
  {
    slug: "professional-services",
    title: "Professional Services",
    subtitle:
      "Modern positioning, trust, and client flow for growing advisory firms.",
    problems: [
      "Outdated digital experience",
      "Weak positioning",
      "Low trust online",
      "Inconsistent client flow",
    ],
    solutions: [
      "Clean, modern customer platforms",
      "Clear positioning",
      "Conversion-focused structure",
      "Lead capture and CRM connection",
    ],
    href: "/solutions/lead-generation-systems",
    icon: BarChart3,
  },
  {
    slug: "real-estate",
    title: "Real Estate Professionals",
    subtitle:
      "Modern real estate platforms for property discovery, buyer and seller journeys, scheduling, and operational visibility.",
    problems: [
      "Generic templates",
      "Disconnected property search",
      "Weak seller lead capture",
      "Limited analytics and follow-up visibility",
    ],
    solutions: [
      "MLS-powered Search",
      "AI Buyer Advisor",
      "Home valuation funnels",
      "Community Intelligence",
      "Lead Intelligence",
      "Automation and Analytics",
    ],
    href: "/industries/real-estate",
    icon: Home,
  },
];

export const realEstateIndustry = {
  slug: "real-estate",
  name: "Real Estate",
  eyebrow: "OPZIX FOR REAL ESTATE",
  headline: "The Modern Operating Platform for Real Estate Professionals",
  summary:
    "Opzix helps agents, teams, and brokerages combine MLS-powered property search, AI assistance, buyer and seller journeys, CRM, automation, analytics, operational intelligence, and lead management into one connected platform.",
  metadata: {
    title: "Real Estate Operating Platform | MLS, AI, CRM and Analytics | Opzix",
    description:
      "Opzix builds connected real estate operating platforms with MLS-powered property search, AI assistance, CRM, automation, analytics, and operational intelligence.",
  },
  challenges: [
    "Generic templates make agent experiences feel interchangeable.",
    "Disconnected IDX or property search can separate discovery from lead capture and follow-up.",
    "Seller lead capture is often limited to a static contact form.",
    "Follow-up depends on manual coordination across inboxes, calendars, and CRMs.",
    "Analytics rarely connect community engagement, property interest, AI conversations, forms, and bookings.",
    "Prospects get little conversational guidance when they are not ready to call yet.",
  ],
  capabilities: [
    {
      title: "MLS-powered Search",
      description:
        "Create branded property discovery experiences powered by approved MLS Grid IDX integrations.",
      icon: Search,
    },
    {
      title: "AI Buyer Advisor",
      description:
        "Help buyers clarify location, budget, property type, lifestyle needs, and next steps.",
      icon: MessageSquare,
    },
    {
      title: "AI Seller Assistance",
      description:
        "Guide homeowners through valuation, preparation, timing, and consultation pathways.",
      icon: Home,
    },
    {
      title: "Home Valuation Funnels",
      description:
        "Capture seller intent through structured valuation and consultation journeys.",
      icon: BarChart3,
    },
    {
      title: "Community Intelligence",
      description:
        "Build rich community pages covering lifestyle, local businesses, parks, schools, healthcare, market context, and relocation information.",
      icon: Globe,
    },
    {
      title: "Lead Intelligence",
      description:
        "Route buyer, seller, relocation, and listing-interest leads into the appropriate workflow.",
      icon: Users,
    },
    {
      title: "Scheduling",
      description:
        "Allow prospects to book consultations without leaving the branded experience.",
      icon: CalendarCheck,
    },
    {
      title: "Business Intelligence",
      description:
        "Track lead sources, search engagement, AI conversations, form completion, bookings, and conversion performance.",
      icon: LayoutGrid,
    },
    {
      title: "CRM and Automation",
      description:
        "Connect lead activity to email follow-up, CRM workflows, notifications, and internal operations.",
      icon: ServerCog,
    },
  ],
  platformComponents: [
    "Zora AI",
    "Analytics",
    "Scheduling",
    "Lead Capture",
    "Automation",
    "Dashboards",
    "Integrations",
    "Content and community tools",
  ],
  audience: [
    "Individual real estate agents",
    "High-producing agents",
    "Real estate teams",
    "Boutique brokerages",
    "Luxury agents",
    "Relocation-focused agents",
    "New-construction specialists",
  ],
  journey: [
    "Visitor lands on a community or property page",
    "Explores listings or local information",
    "Asks the AI assistant a question",
    "Identifies as a buyer or seller",
    "Completes a lead or valuation flow",
    "Books a consultation",
    "Enters a follow-up workflow",
    "Activity appears in the dashboard",
  ],
  process: [
    "Strategy and Compliance",
    "Brand and Customer Journey",
    "Website and Community Experience",
    "MLS-powered Search",
    "AI and Lead Systems",
    "Analytics and Automation",
    "Launch and Optimization",
  ],
  flagship: {
    title: "Real Estate Platform Demonstration",
    description:
      "Opzix is currently developing BrittanyFlannigan.com as an example implementation of its real estate platform, including community intelligence, buyer and seller journeys, lead capture, analytics, and IDX property search planning.",
  },
};

export const realEstateGrowthPlatformTiers: RealEstateGrowthPlatformTier[] = [
  {
    slug: "launch",
    name: "Launch Edition",
    positioning: "Build your platform foundation.",
    idealCustomer:
      "Independent agent launching a connected business.",
    goal: "Build the platform foundation for a real estate business that needs property discovery, booking, CRM, and analytics connected from the start.",
    implementation:
      "Launch Edition connects the public experience to the core operating tools needed to attract and qualify early opportunities.",
    launchLabel: "Setup Fee",
    launchPrice: "$500",
    platformLabel: "Monthly",
    platformPrice: "$200/month",
    investmentNote: "Approachable deployment path with sustainable recurring platform support.",
    ctaLabel: "Book a Strategy Session",
    modules: [
      "MLS Search",
      "Community Guides",
      "Booking",
      "CRM",
      "Analytics Foundation",
    ],
    outcomes: [
      "A credible digital foundation",
      "Clear buyer and seller inquiry paths",
      "A faster route from interest to consultation",
    ],
  },
  {
    slug: "growth",
    name: "Growth Edition",
    positioning: "Turn consistent leads into consistent clients.",
    idealCustomer:
      "Growing agents and teams ready to convert steady demand with better intelligence and follow-up.",
    goal: "Turn consistent lead flow into consistent client conversations with AI guidance, Lead Intelligence, automation, follow-up, and performance visibility.",
    implementation:
      "Growth Edition builds on the Launch foundation and deepens the qualification and conversion systems around real buyer and seller intent.",
    launchLabel: "Setup Fee",
    launchPrice: "$750",
    platformLabel: "Monthly",
    platformPrice: "$275/month",
    investmentNote: "Approachable pricing for agents ready to grow with more automation, AI, and marketing tools.",
    recommendationLabel: "Recommended Platform",
    recommendationSummary:
      "Ideal for agents ready to manage more buyer and seller demand through a long-term operating platform.",
    recommendationCopy:
      "Our recommendation for professionals who want more than a basic online presence and are ready to invest in lead visibility, automation, and continuous improvement.",
    ctaLabel: "Book a Strategy Session",
    modules: [
      "Everything in Launch Edition",
      "AI Buyer Advisor",
      "Lead Intelligence",
      "Automation",
      "Follow-up",
      "Performance Visibility",
    ],
    outcomes: [
      "More market-relevant demand capture",
      "Better seller and buyer lead quality",
      "Cleaner routing and follow-up visibility",
    ],
  },
  {
    slug: "performance",
    name: "Performance Edition",
    positioning: "Scale your market presence with intelligence.",
    idealCustomer:
      "Established agents investing in stronger market authority, intelligence, reputation, content, and AI expansion.",
    goal: "Scale your market presence with intelligence by connecting market insight, advanced analytics, reputation, content, and expanded AI capabilities.",
    implementation:
      "Performance Edition expands the operating platform from lead conversion into market authority, deeper intelligence, and long-term visibility.",
    launchLabel: "Setup Fee",
    launchPrice: "Custom",
    platformLabel: "Monthly",
    platformPrice: "Custom",
    investmentNote: "Scoped through consultation around strategy, data, AI, and support needs.",
    inspirationNote: "Inspired by an in-progress reference design.",
    ctaLabel: "Book a Strategy Session",
    modules: [
      "Everything in Growth Edition",
      "Market Intelligence",
      "Advanced Analytics",
      "Reputation",
      "Content Engine",
      "AI Expansion",
    ],
    outcomes: [
      "Premium market positioning",
      "Deeper buyer and seller journey intelligence",
      "A differentiated business platform for serious market positioning",
    ],
  },
  {
    slug: "brokerage",
    name: "Brokerage Edition",
    positioning: "Operate an entire real estate business from one platform.",
    idealCustomer:
      "Brokerages and teams that need shared operations, routing, dashboards, reporting, and business-wide visibility.",
    goal: "Operate an entire real estate business from one platform with team management, routing, dashboards, reporting, and brokerage operations.",
    implementation:
      "Brokerage Edition extends the platform into organization-level workflows, team visibility, operational reporting, and brokerage management.",
    launchLabel: "Setup Fee",
    launchPrice: "Custom",
    platformLabel: "Monthly",
    platformPrice: "Custom",
    investmentNote: "Brokerage pricing is scoped privately around deployment complexity and operating needs.",
    ctaLabel: "Book a Strategy Session",
    modules: [
      "Team Management",
      "Routing",
      "Dashboards",
      "Reporting",
      "Brokerage Operations",
    ],
    outcomes: [
      "Brokerage-level visibility",
      "Cleaner team operating rhythms",
      "A custom platform roadmap for scale",
    ],
  },
];

export const realEstatePlatformModules: RealEstatePlatformModule[] = [
  {
    slug: "website-experience",
    title: "Customer Experience Platform",
    problem: "Real estate sites often behave like static brochures.",
    solution:
      "A premium customer experience foundation that connects content, conversion paths, scheduling, analytics, and future property experiences.",
    benefit:
      "Agents launch with stronger business tools instead of a disconnected online presence.",
    whatItDoes:
      "Gives your business a polished platform experience built around property search, lead capture, appointments, and useful local content.",
    whyItMatters:
      "Your digital experience should help prospects take the next step instead of only proving you exist.",
    businessOutcome: "A stronger first impression and clearer inquiry paths.",
    icon: Globe,
  },
  {
    slug: "mls-integration",
    title: "MLS-powered Search",
    problem: "Property data often lives apart from the lead and follow-up journey.",
    solution:
      "Approved MLS Grid IDX planning that supports property search, lead intelligence, dashboards, and brokerage workflows.",
    benefit:
      "Property discovery can become part of the customer journey, not just a search box.",
    whatItDoes:
      "Allows buyers to search available homes directly from your website through an approved IDX path.",
    whyItMatters:
      "Visitors can keep exploring your brand instead of leaving for another real estate portal.",
    businessOutcome: "More buyer leads and stronger brand recognition.",
    icon: Search,
  },
  {
    slug: "property-search",
    title: "Property Search",
    problem: "Generic IDX search sends buyers into a dead end after browsing.",
    solution:
      "Branded search paths connected to property detail context, lead capture, AI guidance, and scheduling.",
    benefit:
      "Search behavior becomes a signal the agent or team can act on.",
    whatItDoes:
      "Turns browsing behavior, saved interest, and property questions into useful lead context.",
    whyItMatters:
      "Knowing what someone looked at helps you follow up with more relevant guidance.",
    businessOutcome: "Better buyer conversations.",
    icon: LayoutGrid,
  },
  {
    slug: "community-intelligence",
    title: "Community Intelligence",
    problem: "Neighborhood pages are often thin SEO pages with little buying context.",
    solution:
      "Market and lifestyle pages that combine local expertise, community context, buyer questions, and conversion paths.",
    benefit:
      "Agents can turn local authority into better buyer and seller conversations.",
    whatItDoes:
      "Creates detailed neighborhood guides covering schools, restaurants, parks, shopping, healthcare, lifestyle, and local insight.",
    whyItMatters:
      "Buyers spend more time learning from you before they decide who to contact.",
    businessOutcome: "Build trust earlier and become the local expert.",
    icon: Home,
  },
  {
    slug: "home-valuation",
    title: "Home Valuation",
    problem: "Seller leads are usually routed through a generic contact form.",
    solution:
      "Structured valuation and consultation journeys that capture property context, timing, and seller intent.",
    benefit:
      "The agent receives better seller context before the first conversation.",
    whatItDoes:
      "Guides homeowners through a structured path to request valuation guidance or a seller consultation.",
    whyItMatters:
      "Seller leads are stronger when you know the property, timing, and motivation before follow-up.",
    businessOutcome: "More useful seller conversations.",
    icon: BarChart3,
  },
  {
    slug: "buyer-journey",
    title: "Buyer Journey",
    problem: "Buyer interest gets scattered across listing views, questions, and forms.",
    solution:
      "A guided path from community research and property search into AI assistance, lead capture, scheduling, and follow-up.",
    benefit:
      "Buyers get clearer next steps and agents get better-qualified opportunities.",
    whatItDoes:
      "Guides buyers from community research and property search into questions, lead capture, and booking.",
    whyItMatters:
      "A clearer journey helps serious buyers move from browsing to conversation.",
    businessOutcome: "More qualified buyer opportunities.",
    icon: Users,
  },
  {
    slug: "seller-journey",
    title: "Seller Journey",
    problem: "Sellers need timing, preparation, valuation, and market guidance before they are ready to call.",
    solution:
      "Seller funnels, AI guidance, valuation paths, market context, and booking flows configured around seller intent.",
    benefit:
      "Seller demand is captured earlier and routed with more useful context.",
    whatItDoes:
      "Helps homeowners understand valuation, preparation, timing, and the next step to speak with you.",
    whyItMatters:
      "Many sellers need guidance before they are ready to request a listing appointment.",
    businessOutcome: "Capture seller intent earlier.",
    icon: Home,
  },
  {
    slug: "lead-capture",
    title: "Lead Capture",
    problem: "Many lead forms collect contact details without explaining intent.",
    solution:
      "Buyer, seller, valuation, listing, and consultation capture flows that preserve source and journey context.",
    benefit:
      "Follow-up becomes faster, more relevant, and easier to prioritize.",
    whatItDoes:
      "Collects contact details, intent, source, and next-step context from buyers and sellers.",
    whyItMatters:
      "A lead is easier to act on when you know what the person needs and where they came from.",
    businessOutcome: "Faster, more relevant follow-up.",
    icon: Users,
  },
  {
    slug: "crm",
    title: "CRM & Lead Management",
    problem: "Leads lose momentum when property, form, booking, and conversation context is fragmented.",
    solution:
      "CRM-ready lead routing and follow-up workflows connected to platform activity.",
    benefit:
      "Teams can see what happened before they respond.",
    whatItDoes:
      "Keeps buyer and seller inquiries organized with the context needed for follow-up.",
    whyItMatters:
      "You can see who contacted you, what they are looking for, and when to respond.",
    businessOutcome: "Faster follow-up and more relationships.",
    icon: ServerCog,
  },
  {
    slug: "scheduling",
    title: "Online Appointment Booking",
    problem: "Interested prospects often leave before a meeting is booked.",
    solution:
      "Native booking paths for strategy sessions, buyer consultations, seller consultations, and valuation discussions.",
    benefit:
      "The platform converts more high-intent moments into scheduled conversations.",
    whatItDoes:
      "Lets buyers and sellers book consultations directly from your website.",
    whyItMatters:
      "Interested visitors do not have to wait for a response before taking the next step.",
    businessOutcome: "More appointments and fewer missed opportunities.",
    icon: CalendarCheck,
  },
  {
    slug: "analytics",
    title: "Analytics Dashboard",
    problem: "Agents rarely know which pages, questions, and journeys produce real opportunities.",
    solution:
      "Tracking across community engagement, property interest, Zora conversations, forms, bookings, and source paths.",
    benefit:
      "Growth decisions can be based on funnel evidence instead of guesswork.",
    whatItDoes:
      "Shows how people use your website, including visits, appointment requests, valuation requests, popular communities, lead sources, AI conversations, and top pages.",
    whyItMatters:
      "Instead of guessing what is working, you can see where your business is coming from.",
    businessOutcome: "Smarter marketing decisions and more qualified leads.",
    icon: BarChart3,
  },
  {
    slug: "founder-dashboard",
    title: "Founder Dashboard",
    problem: "Platform learning disappears when activity is spread across separate tools.",
    solution:
      "Internal visibility into leads, appointments, Zora usage, scan activity, and product learning signals.",
    benefit:
      "Opzix can improve the platform continuously while customers receive a stronger operating model.",
    whatItDoes:
      "Gives internal teams a clearer view of leads, appointments, assistant usage, and platform activity.",
    whyItMatters:
      "Operational visibility helps support, improve, and prioritize the platform after launch.",
    businessOutcome: "Better support decisions and continuous improvement.",
    icon: LayoutGrid,
  },
  {
    slug: "automation",
    title: "Automation",
    problem: "Manual follow-up slows response time and makes lead quality hard to manage.",
    solution:
      "Reusable workflows for notifications, email follow-up, lead routing, reminders, and operational handoffs.",
    benefit:
      "The business keeps moving after the first inquiry.",
    whatItDoes:
      "Handles repeatable follow-up steps such as notifications, routing, reminders, and email sequences.",
    whyItMatters:
      "Less work depends on someone remembering the next step manually.",
    businessOutcome: "Save time and reduce missed follow-up.",
    icon: Zap,
  },
  {
    slug: "zora-ai",
    title: "AI Buyer Advisor",
    problem: "Generic chatbots answer questions but rarely improve the sales journey.",
    solution:
      "Buyer, seller, general, and operational assistant behavior configured around real estate intent.",
    benefit:
      "Prospects get useful guidance while the business captures better lead context.",
    whatItDoes:
      "Answers buyer and seller questions, captures leads, recommends next steps, and encourages visitors to book consultations.",
    whyItMatters:
      "Your website can keep helping potential clients while you are showing homes, meeting customers, or away from your desk.",
    businessOutcome: "More conversations, appointments, and opportunities.",
    icon: MessageSquare,
  },
];

export const platformModules: Array<
  IndustryCapability & {
    slug: string;
    icon: LucideIcon;
    problem: string;
  }
> = [
  {
    slug: "zora-ai",
    title: "Zora AI",
    description:
      "AI assistants designed around customer questions, lead qualification, routing, and internal knowledge workflows.",
    problem:
      "Replaces generic chat widgets with guided conversations that collect useful context before handoff.",
    industries: ["Ecommerce", "Service Businesses", "Real Estate"],
    icon: MessageSquare,
  },
  {
    slug: "analytics-and-event-tracking",
    title: "Analytics and Event Tracking",
    description:
      "Measurement foundations for source, campaign, page, form, booking, scan, and assistant activity.",
    problem:
      "Gives teams clearer visibility into which journeys and campaigns are creating real opportunities.",
    industries: ["Ecommerce", "Service Businesses", "Real Estate"],
    icon: BarChart3,
  },
  {
    slug: "native-scheduling",
    title: "Native Scheduling",
    description:
      "Booking flows available within Opzix implementations, with Calendly fallback where native scheduling is disabled.",
    problem:
      "Reduces friction between lead interest and a booked next step.",
    industries: ["Service Businesses", "Real Estate", "Ecommerce"],
    icon: CalendarCheck,
  },
  {
    slug: "lead-capture-and-qualification",
    title: "Lead Capture and Qualification",
    description:
      "Forms, assistant prompts, valuation paths, audit requests, and inquiry flows structured around useful lead context.",
    problem:
      "Improves handoff quality so teams are not chasing incomplete or unqualified requests.",
    industries: ["Service Businesses", "Real Estate", "Ecommerce"],
    icon: Users,
  },
  {
    slug: "crm-and-email-automation",
    title: "CRM and Email Automation",
    description:
      "Reusable workflows that pass inquiry context into email, CRM, notifications, and follow-up systems.",
    problem:
      "Prevents leads and customer requests from getting stranded between tools.",
    industries: ["Ecommerce", "Service Businesses", "Real Estate"],
    icon: Zap,
  },
  {
    slug: "founder-and-operational-dashboards",
    title: "Founder and Operational Dashboards",
    description:
      "Internal views for lead activity, assistant conversations, audit scans, booking status, and operational signals.",
    problem:
      "Turns scattered activity into a clearer operating picture for the business owner or team.",
    industries: ["Ecommerce", "Service Businesses", "Real Estate"],
    icon: LayoutGrid,
  },
  {
    slug: "website-and-ecommerce-infrastructure",
    title: "Customer Experience and Ecommerce Infrastructure",
    description:
      "Next.js customer experience, ecommerce, content, and conversion infrastructure built for performance and maintainability.",
    problem:
      "Gives customer journeys a stronger foundation than a disconnected set of pages and plugins.",
    industries: ["Ecommerce", "Service Businesses", "Real Estate"],
    icon: Globe,
  },
  {
    slug: "backend-integrations",
    title: "Backend Integrations",
    description:
      "Connections across ecommerce platforms, payment systems, CRMs, calendars, email, databases, and custom APIs.",
    problem:
      "Keeps critical customer and operational data moving through the systems teams already use.",
    industries: ["Ecommerce", "Service Businesses", "Real Estate"],
    icon: ServerCog,
  },
  {
    slug: "audit-and-diagnostic-tools",
    title: "Audit and Diagnostic Tools",
    description:
      "Scanner and diagnostic systems that identify conversion, UX, tracking, platform, and operational gaps.",
    problem:
      "Helps prioritize what to improve before investing in rebuilds or new automation.",
    industries: ["Ecommerce", "Service Businesses"],
    icon: Check,
  },
];
