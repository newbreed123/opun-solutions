import type { Metadata } from "next";
import Section from "@/components/Section";
import TrackedLink from "@/components/TrackedLink";
import PageViewTracker from "@/components/PageViewTracker";
import StrategyCallTrackedButton from "@/components/StrategyCallTrackedButton";
import { realEstateIndustry } from "@/content/industries";
import {
  ArrowDownRight,
  Building2,
  Check,
  GitBranch,
  LayoutGrid,
} from "lucide-react";

export const metadata: Metadata = {
  title: realEstateIndustry.metadata.title,
  description: realEstateIndustry.metadata.description,
  alternates: {
    canonical: "/industries/real-estate",
  },
  openGraph: {
    title: realEstateIndustry.metadata.title,
    description: realEstateIndustry.metadata.description,
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
      name: "Industries",
      item: "https://opzix.io/industries",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Real Estate",
      item: "https://opzix.io/industries/real-estate",
    },
  ],
};

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
        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              {realEstateIndustry.eyebrow}
            </p>
            <h1 className="heading-1 max-w-5xl">
              {realEstateIndustry.headline}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-secondary md:text-xl">
              {realEstateIndustry.summary}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <StrategyCallTrackedButton
                source="real_estate_page"
                serviceRequested="Real Estate Growth Platform"
                industry="real_estate"
                eventName="real_estate_strategy_call_clicked"
                eventPayload={{ cta_location: "hero" }}
              >
                Discuss Your Real Estate Platform
              </StrategyCallTrackedButton>
              <TrackedLink
                href="/platform"
                eventName="industry_card_clicked"
                payload={{
                  industry: "real_estate",
                  cta_location: "real_estate_hero_platform",
                }}
                className="btn btn-secondary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
              >
                Explore Platform Capabilities
              </TrackedLink>
            </div>
          </div>

          <div className="rounded-xl border border-dark-border bg-dark-card p-6 shadow-card-glow">
            <div className="mb-6 flex items-center justify-between border-b border-dark-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-cyan">
                  Platform Architecture
                </p>
                <h2 className="mt-2 text-2xl font-bold text-primary">
                  Property journey to operations
                </h2>
              </div>
              <Building2 className="h-8 w-8 text-brand-cyan" />
            </div>
            <div className="grid gap-3">
              {[
                "Community and property discovery",
                "Buyer and seller AI guidance",
                "Lead capture and consultation booking",
                "Analytics, CRM, and follow-up visibility",
              ].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-lg border border-dark-border bg-white/[0.035] p-4 text-secondary"
                >
                  <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">
              MLS data usage depends on licensing, attribution, compliance, and
              implementation scope for each project.
            </p>
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              The Problem
            </p>
            <h2 className="heading-2 mt-4">
              A Website Alone Is Not a Real Estate Growth System
            </h2>
            <p className="mt-5 text-lg leading-8 text-secondary">
              Many real estate sites create a polished first impression but
              leave the actual growth system disconnected: property discovery,
              seller intent, AI guidance, scheduling, follow-up, and analytics
              all live in separate places.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {realEstateIndustry.challenges.map((challenge) => (
              <div key={challenge} className="card p-5">
                <p className="text-sm leading-6 text-secondary">{challenge}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="secondary">
        <SectionIntro
          eyebrow="Platform Capabilities"
          title="Real estate growth infrastructure, not a generic template."
          description="Each capability is designed to connect prospect intent with the next useful action for the agent, team, or brokerage."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {realEstateIndustry.capabilities.map((capability) => {
            const Icon = capability.icon;

            return (
              <div key={capability.title} className="card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-primary">
                  {capability.title}
                </h3>
                <p className="mt-3 leading-7 text-secondary">
                  {capability.description}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Built on the Opzix Platform
          </p>
          <h2 className="heading-2 mt-4">
            Shared technology adapted to real estate workflows.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            The real estate solution uses reusable Opzix modules for AI,
            analytics, scheduling, lead capture, automation, dashboards,
            integrations, and content systems.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-4">
          {realEstateIndustry.platformComponents.map((component, index) => (
            <div
              key={component}
              className="rounded-lg border border-dark-border bg-dark-card p-5 text-center"
            >
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-sm font-bold text-brand-cyan">
                {index + 1}
              </div>
              <p className="font-semibold text-primary">{component}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Who It Is For
            </p>
            <h2 className="heading-2 mt-4">
              Built for professionals who need a stronger digital operating
              layer.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {realEstateIndustry.audience.map((audience) => (
              <div
                key={audience}
                className="flex min-h-11 items-center gap-3 rounded-lg border border-dark-border bg-white/[0.035] px-4 py-3 text-secondary"
              >
                <Check className="h-4 w-4 flex-none text-brand-cyan" />
                <span className="font-semibold">{audience}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="secondary">
        <SectionIntro
          eyebrow="Example Customer Journey"
          title="From discovery to booked consultation."
          description="The goal is to connect attention, intent, qualification, scheduling, and follow-up into one visible path."
        />
        <div className="mx-auto mt-12 max-w-5xl">
          {realEstateIndustry.journey.map((step, index) => (
            <div key={step}>
              <div className="grid gap-4 rounded-lg border border-dark-border bg-dark-card p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-sm font-bold text-brand-cyan">
                  {index + 1}
                </div>
                <p className="font-semibold text-primary">{step}</p>
                <ArrowDownRight className="hidden h-5 w-5 text-brand-cyan sm:block" />
              </div>
              {index < realEstateIndustry.journey.length - 1 ? (
                <div className="ml-5 h-5 w-px bg-brand-cyan/30" />
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Implementation Approach
            </p>
            <h2 className="heading-2 mt-4">
              Staged around strategy, compliance awareness, and operational
              rollout.
            </h2>
            <p className="mt-5 text-lg leading-8 text-secondary">
              Opzix maps the customer journey and implementation architecture.
              Brokerage, advertising, fair housing, MLS, and legal compliance
              decisions remain with the client and their qualified advisors or
              licensing partners.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {realEstateIndustry.process.map((step, index) => (
              <div key={step} className="card p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-sm font-bold text-brand-cyan">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-primary">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid gap-8 rounded-xl border border-brand-cyan/30 bg-brand-blue/10 p-6 md:p-8 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-brand-cyan/30 bg-dark-card text-brand-cyan">
            <GitBranch className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Flagship Implementation
            </p>
            <h2 className="heading-2 mt-4">
              {realEstateIndustry.flagship.title}
            </h2>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-secondary">
              {realEstateIndustry.flagship.description}
            </p>
            <p className="mt-5 text-sm leading-6 text-muted">
              This is not yet presented as a completed case study. Published
              results should wait until launch status, approval, baseline
              metrics, and outcome data are verifiable.
            </p>
          </div>
        </div>
      </Section>

      <section className="hero-atmosphere py-16 md:py-20">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <LayoutGrid className="mx-auto mb-5 h-9 w-9 text-brand-cyan" />
          <h2 className="heading-2">Build More Than a Real Estate Website</h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Create a connected real estate platform designed to attract, guide,
            qualify, and convert buyers and sellers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="real_estate_page"
              serviceRequested="Real Estate Growth Platform"
              industry="real_estate"
              eventName="real_estate_strategy_call_clicked"
              eventPayload={{ cta_location: "final_cta" }}
            >
              Book a Real Estate Strategy Session
            </StrategyCallTrackedButton>
            <TrackedLink
              href="/contact?source=services"
              eventName="industry_card_clicked"
              payload={{
                industry: "real_estate",
                cta_location: "final_contact",
              }}
              className="btn btn-secondary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
            >
              Contact Opzix
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
        {eyebrow}
      </p>
      <h2 className="heading-2 mt-4">{title}</h2>
      <p className="body-lg mx-auto mt-5 text-secondary">{description}</p>
    </div>
  );
}
