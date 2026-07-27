import type { Metadata } from "next";
import Section from "@/components/Section";
import PageViewTracker from "@/components/PageViewTracker";
import StrategyCallTrackedButton from "@/components/StrategyCallTrackedButton";
import TrackedLink from "@/components/TrackedLink";
import VisibilityTracker from "@/components/VisibilityTracker";
import {
  BarChart3,
  Brain,
  Check,
  Home,
  LayoutDashboard,
  MessageSquare,
  Network,
  Search,
  Users,
  Workflow,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Real Estate Operating System | MLS Search, AI, CRM and Analytics | Opzix",
  description:
    "Explore how the Opzix Real Estate Operating System connects MLS-powered Search, Community Intelligence, AI Buyer Advisor, Lead Intelligence, CRM, Automation, Analytics, Operations Dashboard, and Business Intelligence.",
  alternates: {
    canonical: "/real-estate/platform",
  },
  openGraph: {
    title: "Real Estate Operating System | Opzix",
    description:
      "See how Opzix connects the real estate customer journey from property discovery to business intelligence.",
    url: "/real-estate/platform",
    siteName: "Opzix",
    type: "website",
  },
};

const breadcrumbs = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://opzix.io/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Real Estate",
      item: "https://opzix.io/industries/real-estate",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Platform",
      item: "https://opzix.io/real-estate/platform",
    },
  ],
};

const operatingFlow = [
  {
    stage: "Journey",
    title: "Connected Customer Journey",
    copy: "The platform turns property discovery, buyer questions, seller intent, booking, CRM, automation, and reporting into one connected path.",
    icon: Network,
  },
  {
    stage: "Attract",
    title: "MLS-powered Search",
    copy: "Approved listing-data experiences help buyers search homes through your brand instead of immediately leaving for third-party portals.",
    icon: Search,
  },
  {
    stage: "Attract",
    title: "Community Intelligence",
    copy: "Neighborhood and market guidance gives buyers and sellers useful local context before they are ready to contact an agent.",
    icon: Home,
  },
  {
    stage: "Qualify",
    title: "AI Buyer Advisor",
    copy: "AI guidance helps visitors ask better questions, understand options, and move from anonymous browsing into clearer intent.",
    icon: MessageSquare,
  },
  {
    stage: "Qualify",
    title: "Lead Intelligence",
    copy: "Source, search behavior, preferences, conversations, forms, and saved actions become more useful lead context.",
    icon: Users,
  },
  {
    stage: "Convert",
    title: "CRM",
    copy: "Buyer, seller, valuation, consultation, and showing inquiries become organized records with follow-up paths.",
    icon: Brain,
  },
  {
    stage: "Convert",
    title: "Automation",
    copy: "Notifications, routing, reminders, booking handoffs, and follow-up workflows keep opportunities moving.",
    icon: Workflow,
  },
  {
    stage: "Operate",
    title: "Analytics",
    copy: "Traffic, communities, property activity, inquiries, bookings, and lead sources become measurable signals.",
    icon: BarChart3,
  },
  {
    stage: "Operate",
    title: "Operations Dashboard",
    copy: "Agents, teams, and brokerage leaders can see activity, pipeline movement, follow-up needs, and operating priorities.",
    icon: LayoutDashboard,
  },
  {
    stage: "Scale",
    title: "Business Intelligence",
    copy: "The platform turns customer and operational signals into clearer decisions about marketing, sales, staffing, and growth.",
    icon: BarChart3,
  },
];

const platformFoundation = [
  {
    title: "Customer Journey Layer",
    copy: "Buyer, seller, search, inquiry, booking, and follow-up paths are designed as one connected customer journey.",
  },
  {
    title: "Data and Intelligence Layer",
    copy: "MLS-powered Search, Community Intelligence, AI Buyer Advisor, Lead Intelligence, Analytics, and Business Intelligence share context.",
  },
  {
    title: "Operational Workflow Layer",
    copy: "CRM, Automation, Operations Dashboard, routing, reminders, and reporting support the work after a lead raises their hand.",
  },
];

const journeyStages = [
  "Attract",
  "Qualify",
  "Convert",
  "Operate",
  "Scale",
];

export default function RealEstatePlatformPage() {
  return (
    <>
      <PageViewTracker
        eventName="feature_section_viewed"
        payload={{ section: "real_estate_platform_page", industry: "real_estate" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Section bgColor="secondary" padded className="hero-atmosphere">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Real Estate Operating System
          </p>
          <h1 className="heading-1">
            The Operating System Behind the Real Estate Journey
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-secondary md:text-xl">
            Opzix connects MLS-powered Search, Community Intelligence, AI Buyer
            Advisor, Lead Intelligence, CRM, Automation, Analytics, Operations
            Dashboard, and Business Intelligence into one operating flow.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="real_estate_page"
              serviceRequested="Real Estate Operating Platform"
              industry="real_estate"
              eventName="real_estate_strategy_call_clicked"
              eventPayload={{ cta_location: "platform_hero" }}
            >
              Book a Strategy Session
            </StrategyCallTrackedButton>
            <TrackedLink
              href="/real-estate/plans"
              eventName="real_estate_plan_preview_clicked"
              payload={{
                cta_location: "platform_hero",
                plan_name: "all",
                industry: "real_estate",
              }}
              className="btn btn-secondary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
            >
              Compare Editions
            </TrackedLink>
          </div>
        </div>
      </Section>

      <Section bgColor="primary" id="operating-flow">
        <VisibilityTracker
          eventName="feature_section_viewed"
          payload={{ section: "real_estate_operating_flow", industry: "real_estate" }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Operating Flow
          </p>
          <h2 className="heading-2 mt-4">
            One connected customer journey, powered by platform systems.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            The platform is not a loose collection of features. Each capability
            supports the movement from attraction to qualification, conversion,
            operations, and business intelligence.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-3">
          {journeyStages.map((stage) => (
            <div
              key={stage}
              className="rounded-full border border-brand-cyan/30 bg-brand-blue/10 px-4 py-2 text-sm font-semibold text-brand-cyan"
            >
              {stage}
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {operatingFlow.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-lg border border-dark-border bg-white/[0.035] p-5"
              >
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                        {String(index + 1).padStart(2, "0")} / {item.stage}
                      </p>
                      {index < operatingFlow.length - 1 ? (
                        <span className="text-xs font-semibold text-muted">
                          -&gt;
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-secondary">
                      {item.copy}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <Section bgColor="secondary" id="platform-foundation">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Platform Foundation
            </p>
            <h2 className="heading-2 mt-4">
              From customer journey to Business Intelligence.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Opzix connects the front-end experience, intelligence layer, and
              operating workflows so customer activity can become business
              visibility instead of scattered data.
            </p>
          </div>
          <div className="grid gap-4">
            {platformFoundation.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-dark-border bg-white/[0.035] p-5"
              >
                <div className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                  <div>
                    <h3 className="text-lg font-bold text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      {item.copy}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <section className="hero-atmosphere py-16 md:py-20">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <h2 className="heading-2">Ready to compare Platform Editions?</h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Once the operating flow is clear, the next step is choosing the
            edition that matches your current business maturity and upgrade path.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <TrackedLink
              href="/real-estate/plans"
              eventName="real_estate_plan_preview_clicked"
              payload={{
                cta_location: "platform_final_cta",
                plan_name: "all",
                industry: "real_estate",
              }}
              className="btn btn-primary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
            >
              Compare Editions
            </TrackedLink>
            <StrategyCallTrackedButton
              source="real_estate_page"
              serviceRequested="Real Estate Operating Platform"
              industry="real_estate"
              eventName="real_estate_strategy_call_clicked"
              eventPayload={{ cta_location: "platform_final_cta" }}
              variant="secondary"
            >
              Book a Strategy Session
            </StrategyCallTrackedButton>
          </div>
        </div>
      </section>
    </>
  );
}
