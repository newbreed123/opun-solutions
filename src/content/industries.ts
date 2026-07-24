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

export const homepageIndustryCards = [
  {
    slug: "ecommerce",
    name: "Ecommerce",
    headline: "Ecommerce Growth Systems",
    copy: "Improve conversion, customer experience, analytics, automation, and backend operations across the ecommerce journey.",
    capabilities: [
      "Storefront development",
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
    copy: "Generate qualified leads, automate intake, improve scheduling, and create better visibility across the customer journey.",
    capabilities: [
      "Lead-generation websites",
      "Booking and intake",
      "CRM automation",
      "AI assistants",
      "Tracking",
      "Dashboards",
    ],
    cta: "Explore Service Business Solutions",
    href: "/industries",
    icon: Users,
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    headline: "Modern Real Estate Growth Platforms",
    copy: "Combine property search infrastructure, AI assistance, seller funnels, community intelligence, lead routing, scheduling, and analytics in one connected system.",
    capabilities: [
      "MLS-ready infrastructure",
      "AI buyer and seller assistance",
      "Home valuation funnels",
      "Community intelligence",
      "Lead capture",
      "Scheduling",
      "Analytics",
    ],
    cta: "Explore Real Estate Solutions",
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
      "Lead-generation websites",
      "Booking and intake flows",
      "CRM and email automation",
      "AI assistants",
      "Tracking and dashboards",
      "Workflow integrations",
    ],
    href: "/industries",
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
      "Clear service-based websites",
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
    subtitle: "Websites and systems that turn local demand into reliable leads.",
    problems: [
      "Low website conversions",
      "Poor visibility into leads",
      "No tracking",
      "Manual follow-ups",
    ],
    solutions: [
      "Conversion-focused websites",
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
      "Outdated websites",
      "Weak positioning",
      "Low trust online",
      "Inconsistent client flow",
    ],
    solutions: [
      "Clean, modern websites",
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
      "MLS-ready property search infrastructure",
      "AI buyer and seller assistance",
      "Home valuation funnels",
      "Community intelligence",
      "Lead capture and routing",
      "Scheduling and analytics",
    ],
    href: "/industries/real-estate",
    icon: Home,
  },
];

export const realEstateIndustry = {
  slug: "real-estate",
  name: "Real Estate",
  eyebrow: "OPZIX FOR REAL ESTATE",
  headline: "The Modern Growth Platform for Real Estate Professionals",
  summary:
    "Opzix helps agents, teams, and brokerages combine modern websites, property search, AI assistance, seller lead generation, community intelligence, scheduling, and analytics into one connected digital platform.",
  metadata: {
    title: "Real Estate Growth Platforms | MLS, AI, Leads and Analytics | Opzix",
    description:
      "Opzix builds connected real estate platforms with property search, AI assistance, seller funnels, community intelligence, scheduling, automation, and analytics.",
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
      title: "MLS and Property Search",
      description:
        "Create branded property discovery experiences connected to licensed listing data and compliant search infrastructure.",
      icon: Search,
    },
    {
      title: "AI Buyer Assistance",
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
      title: "Lead Capture and Routing",
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
      title: "Analytics and Intelligence",
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
    "Lead Engine",
    "Automation",
    "Dashboards",
    "Integrations",
    "Content and community systems",
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
    "MLS or Property Data Integration",
    "AI and Lead Systems",
    "Analytics and Automation",
    "Launch and Optimization",
  ],
  flagship: {
    title: "First Real Estate Platform Implementation",
    description:
      "Opzix is currently developing BrittanyFlannigan.com as the first production implementation of its real estate platform architecture, including community intelligence, buyer and seller journeys, lead capture, analytics, and MLS integration planning.",
  },
};

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
    title: "Website and Ecommerce Infrastructure",
    description:
      "Next.js website, ecommerce, content, and conversion infrastructure built for performance and maintainability.",
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
