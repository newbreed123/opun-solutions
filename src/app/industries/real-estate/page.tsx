import type { Metadata } from "next";
import Section from "@/components/Section";
import PageViewTracker from "@/components/PageViewTracker";
import StrategyCallTrackedButton from "@/components/StrategyCallTrackedButton";
import TrackedLink from "@/components/TrackedLink";
import VisibilityTracker from "@/components/VisibilityTracker";
import { realEstateIndustry } from "@/content/industries";
import { BarChart3, Check, Home, MessageSquare, TrendingUp, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Real Estate Operating Platform | MLS, AI, CRM and Analytics | Opzix",
  description:
    "Opzix builds MLS-powered real estate operating platforms that connect property search, buyer and seller experiences, AI guidance, CRM, analytics, automation, and operational intelligence.",
  alternates: {
    canonical: "/industries/real-estate",
  },
  openGraph: {
    title: "Real Estate Operating Platform | Opzix",
    description:
      "Build a smarter real estate business platform with MLS-powered property search, AI guidance, CRM, analytics, automation, and operational intelligence.",
    url: "/industries/real-estate",
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
  ],
};

const outcomePillars = [
  {
    slug: "attract",
    label: "Attract",
    title: "Make Property Discovery Part of Your Platform",
    copy: "Give buyers and sellers useful reasons to stay with your brand instead of scattering across disconnected portals and pages.",
    items: ["MLS-powered search", "Community guides", "SEO", "Property discovery"],
    icon: TrendingUp,
  },
  {
    slug: "qualify",
    label: "Qualify",
    title: "Understand Buyer and Seller Intent Earlier",
    copy: "Use AI guidance and customer intelligence to turn anonymous browsing into clearer lead context.",
    items: ["AI Buyer Advisor", "Lead scoring", "Buyer preferences", "Saved searches"],
    icon: MessageSquare,
  },
  {
    slug: "convert",
    label: "Convert",
    title: "Turn High-Intent Moments Into Conversations",
    copy: "Connect the moments when people raise their hand to the booking, follow-up, and seller paths that move business forward.",
    items: ["Showing requests", "Consultation booking", "Seller funnels", "Lead capture"],
    icon: Users,
  },
  {
    slug: "operate",
    label: "Operate",
    title: "Run the Business With Better Visibility",
    copy: "Give agents, teams, and brokerages a clearer operating picture across leads, activity, reporting, and automation.",
    items: ["CRM", "Analytics", "Dashboard", "Automation"],
    icon: BarChart3,
  },
];

const disconnectedStack = [
  "Website",
  "CRM",
  "Forms",
  "Calendly",
  "Email",
  "IDX",
  "Analytics",
];

const connectedStack = [
  "Property search",
  "AI guidance",
  "Lead intelligence",
  "Booking",
  "CRM workflows",
  "Analytics",
  "Automation",
];

const platformFoundation = [
  "MLS Grid data",
  "RESO Web API",
  "AI workflows",
  "Customer intelligence",
  "Operational dashboards",
  "Automation",
];

const planPreview = [
  {
    slug: "problem",
    name: "Business Problem",
    tagline: "Disconnected tools lose opportunities.",
    bestFor: "Agents, teams, and brokerages trying to turn attention into real conversations while managing too many separate systems.",
    outcome:
      "Real estate needs a connected customer journey where search, AI guidance, lead intelligence, CRM, automation, analytics, and follow-up work together.",
    cta: "See How the Platform Works",
  },
  {
    slug: "platform",
    name: "Platform Solution",
    tagline: "The operating platform connects the journey.",
    bestFor: "Real estate professionals who want to understand how Opzix turns the buyer and seller journey into an operational platform.",
    outcome:
      "The next step is the platform page, where the journey becomes MLS-powered search, Community Intelligence, AI Buyer Advisor, Lead Intelligence, CRM, automation, analytics, and Business Intelligence.",
    cta: "Explore the Platform",
  },
];

export default function RealEstateIndustryPage() {
  return (
    <>
      <PageViewTracker
        eventName="real_estate_page_viewed"
        payload={{ industry: "real_estate" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Section bgColor="secondary" padded className="hero-atmosphere">
        <VisibilityTracker
          eventName="feature_section_viewed"
          payload={{ section: "real_estate_hero", industry: "real_estate" }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            {realEstateIndustry.eyebrow}
          </p>
          <h1 className="heading-1">
            The Platform Behind Modern Real Estate Businesses
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-secondary md:text-xl">
            MLS-powered property search, buyer and seller experiences, AI
            guidance, CRM, analytics, automation, and operational intelligence
            all in one connected platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="real_estate_page"
              serviceRequested="Real Estate Operating Platform"
              industry="real_estate"
              eventName="real_estate_strategy_call_clicked"
              eventPayload={{ cta_location: "hero" }}
            >
              Book a Strategy Session
            </StrategyCallTrackedButton>
            <TrackedLink
              href="/real-estate/platform"
              eventName="real_estate_platform_clicked"
              payload={{
                cta_location: "hero",
                industry: "real_estate",
              }}
              className="btn btn-secondary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
            >
              Explore the Platform
            </TrackedLink>
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Disconnected to Connected
            </p>
            <h2 className="heading-2 mt-4">
              Stop running a real estate business through scattered tools.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Most agents are forced to stitch together a website, IDX, forms,
              calendar links, CRM, email, and analytics. Opzix turns those
              pieces into one operating platform.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-xl border border-dark-border bg-white/[0.035] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Before Opzix
              </p>
              <div className="mt-5 grid gap-2">
                {disconnectedStack.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-sm font-semibold text-secondary"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden text-2xl font-bold text-brand-cyan md:block">
              -&gt;
            </div>
            <div className="rounded-xl border border-brand-cyan/35 bg-brand-blue/10 p-5 shadow-[0_24px_80px_rgba(56,189,248,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
                With Opzix
              </p>
              <div className="mt-5 grid gap-2">
                {connectedStack.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg border border-brand-cyan/20 bg-dark-card/70 px-4 py-3 text-sm font-semibold text-primary"
                  >
                    <Check className="h-4 w-4 flex-none text-brand-cyan" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="secondary" id="outcomes">
        <VisibilityTracker
          eventName="feature_section_viewed"
          payload={{ section: "four_pillars", industry: "real_estate" }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Platform Outcomes
          </p>
          <h2 className="heading-2 mt-4">
            Built around the real customer journey.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {outcomePillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article key={pillar.slug} className="card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  {pillar.label}
                </p>
                <h3 className="mt-3 text-xl font-bold text-primary">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-secondary">
                  {pillar.copy}
                </p>
                <ul className="mt-5 space-y-2">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-secondary">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Platform Foundation
            </p>
            <h2 className="heading-2 mt-4">Built on MLS Grid + RESO</h2>
            <p className="body-lg mt-5 text-secondary">
              Opzix combines approved listing-data infrastructure, AI workflows,
              customer intelligence, dashboards, and automation into one
              connected real estate platform with clear data paths and
              operational visibility.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {platformFoundation.map((item) => (
              <div
                key={item}
                className="flex min-h-16 items-center gap-3 rounded-lg border border-dark-border bg-white/[0.035] px-4 py-3"
              >
                <Check className="h-4 w-4 flex-none text-brand-cyan" />
                <p className="text-sm font-semibold leading-6 text-primary">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="primary" id="platform-next-step">
        <VisibilityTracker
          eventName="feature_section_viewed"
          payload={{ section: "platform_next_step", industry: "real_estate" }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Next Step
          </p>
          <h2 className="heading-2 mt-4">
            See how the operating platform connects the journey.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            This page explains why real estate needs a connected platform. The
            platform page shows how MLS-powered Search, Community Intelligence,
            AI Buyer Advisor, Lead Intelligence, CRM, Automation, Analytics, and
            Business Intelligence work as one operating system.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {planPreview.map((plan) => (
            <article key={plan.slug} className="card flex h-full flex-col p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                {plan.name}
              </p>
              <h3 className="mt-3 text-xl font-bold text-primary">{plan.tagline}</h3>
              <p className="mt-4 text-sm font-semibold text-primary">Best for</p>
              <p className="mt-2 text-sm leading-6 text-secondary">{plan.bestFor}</p>
              <p className="mt-4 text-sm font-semibold text-primary">
                What it helps you do
              </p>
              <p className="mt-2 flex-1 text-sm leading-6 text-secondary">
                {plan.outcome}
              </p>
              <TrackedLink
                href="/real-estate/platform"
                eventName="real_estate_platform_clicked"
                payload={{
                  cta_location: "real_estate_next_step",
                  industry: "real_estate",
                }}
                className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-cyan hover:text-primary"
              >
                {plan.cta} <span className="ml-2">-&gt;</span>
              </TrackedLink>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <TrackedLink
            href="/real-estate/platform"
            eventName="real_estate_platform_clicked"
            payload={{
              cta_location: "platform_next_step",
              industry: "real_estate",
            }}
            className="btn btn-secondary px-6 py-3 text-base w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
          >
            Explore the Platform
          </TrackedLink>
        </div>
      </Section>

      <Section bgColor="secondary" id="flagship">
        <VisibilityTracker
          eventName="feature_section_viewed"
          payload={{ section: "brittany_flagship", industry: "real_estate" }}
        />
        <div className="grid gap-8 rounded-xl border border-brand-cyan/30 bg-brand-blue/10 p-6 md:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-brand-cyan/30 bg-dark-card text-brand-cyan">
            <Home className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Product Preview
            </p>
            <h2 className="heading-2 mt-4">
              Example Real Estate Platform Implementation
            </h2>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-secondary">
              BrittanyFlannigan.com is an in-progress example implementation of
              the Opzix Real Estate Platform, showing how buyer and seller
              journeys, community intelligence, lead capture, scheduling,
              analytics, and IDX property search planning can work together.
            </p>
            <p className="mt-4 text-sm leading-6 text-muted">
              Published performance claims should wait until launch status,
              approval, baseline metrics, and measurable outcomes are available.
            </p>
          </div>
          <TrackedLink
            href="/case-studies"
            eventName="brittany_implementation_clicked"
            payload={{
              cta_location: "flagship_section",
              industry: "real_estate",
            }}
            className="btn btn-secondary px-6 py-3 text-base w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
          >
            View the Preview
          </TrackedLink>
        </div>
      </Section>

      <section className="hero-atmosphere py-16 md:py-20">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <h2 className="heading-2">
            Find the platform that matches where your business is going.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Compare the plan paths or book a strategy session to choose the
            right foundation for more buyers, more listings, and better
            follow-up.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="real_estate_page"
              serviceRequested="Real Estate Operating Platform"
              industry="real_estate"
              eventName="real_estate_strategy_call_clicked"
              eventPayload={{ cta_location: "final_cta" }}
            >
              Book a Strategy Session
            </StrategyCallTrackedButton>
            <TrackedLink
              href="/real-estate/platform"
              eventName="real_estate_platform_clicked"
              payload={{
                cta_location: "final_cta",
                industry: "real_estate",
              }}
              className="btn btn-secondary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
            >
              Explore the Platform
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
