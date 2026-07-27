import type { Metadata } from "next";
import Image from "next/image";
import Section from "@/components/Section";
import PageViewTracker from "@/components/PageViewTracker";
import StrategyCallTrackedButton from "@/components/StrategyCallTrackedButton";
import TrackedLink from "@/components/TrackedLink";
import { platformModules } from "@/content/industries";
import { Check, GitBranch } from "lucide-react";

export const metadata: Metadata = {
  title: "The Opzix Platform | AI, Analytics, Scheduling and Automation",
  description:
    "Explore the reusable technology behind Opzix business systems, including AI assistants, analytics, scheduling, automation, dashboards, lead capture, and integrations.",
  alternates: {
    canonical: "/platform",
  },
  openGraph: {
    title: "The Opzix Platform | AI, Analytics, Scheduling and Automation",
    description:
      "Explore the reusable technology behind Opzix business systems, including AI assistants, analytics, scheduling, automation, dashboards, lead capture, and integrations.",
    url: "/platform",
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
      name: "Platform",
      item: "https://opzix.io/platform",
    },
  ],
};

const architecture = [
  {
    label: "Customer Experience",
    copy: "Public journeys, lead paths, ecommerce flows, booking moments, and customer-facing AI designed to work as one platform experience.",
  },
  {
    label: "Operational Workflows",
    copy: "Automation, scheduling, CRM handoff, notifications, dashboards, and integrations shaped around how the business actually runs.",
  },
  {
    label: "Industry Adaptation",
    copy: "The same platform architecture adapts across ecommerce, service businesses, real estate, and future verticals.",
  },
];

export default function PlatformPage() {
  return (
    <>
      <PageViewTracker eventName="platform_page_viewed" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Section bgColor="secondary" padded className="hero-atmosphere">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Software-first platform thinking
            </p>
            <h1 className="heading-1 max-w-5xl">
              Most agencies build websites.
              <br />
              Opzix builds business platforms.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-secondary md:text-xl">
              The Opzix Platform connects customer experience, AI, analytics,
              automation, scheduling, integrations, and operational workflows
              into one system that helps businesses grow with confidence.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <StrategyCallTrackedButton
                source="platform_page"
                serviceRequested="Opzix Platform Implementation"
                eventName="platform_module_clicked"
                eventPayload={{ module: "strategy_call", cta_location: "hero" }}
              >
                Discuss Your Platform
              </StrategyCallTrackedButton>
              <TrackedLink
                href="#modules"
                eventName="platform_module_clicked"
                payload={{ module: "module_overview", cta_location: "hero" }}
                className="btn btn-secondary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
              >
                Explore Capabilities
              </TrackedLink>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-brand-blue/20 opacity-45 blur-3xl"
            />
            <div className="relative min-h-[22rem] overflow-hidden rounded-xl border border-brand-cyan/25 bg-dark-deep shadow-card-glow md:min-h-[30rem]">
              <Image
                src="/opzix-platform-command-center.png"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover object-[58%_center]"
                style={{
                  filter: "brightness(0.82) contrast(1.04) saturate(0.96)",
                }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,16,36,0.38)_0%,rgba(7,16,36,0.16)_45%,rgba(7,16,36,0.04)_100%)]" />
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-5 md:grid-cols-3">
          {architecture.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-dark-border bg-white/[0.035] p-5"
            >
              <p className="font-bold text-primary">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-secondary">
                {item.copy}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="primary" id="modules">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Platform Capabilities
          </p>
          <h2 className="heading-2 mt-4">
            Reusable platform capabilities for connected business growth.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Each capability solves a specific business problem and can be
            adapted across ecommerce, service business, real estate, and future
            industry solutions.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {platformModules.map((module) => {
            const Icon = module.icon;

            return (
              <TrackedLink
                key={module.slug}
                href={`#${module.slug}`}
                eventName="platform_module_clicked"
                payload={{
                  module: module.slug,
                  cta_location: "platform_module_grid",
                }}
                className="card block h-full p-6"
              >
                <div id={module.slug} className="scroll-mt-28">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">
                    {module.title}
                  </h3>
                  <p className="mt-3 leading-7 text-secondary">
                    {module.description}
                  </p>
                  <div className="mt-5 rounded-lg border border-dark-border bg-white/[0.035] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                      Business problem
                    </p>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      {module.problem}
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {module.industries?.map((industry) => (
                      <span
                        key={industry}
                        className="rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan"
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              </TrackedLink>
            );
          })}
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              How It Powers Solutions
            </p>
            <h2 className="heading-2 mt-4">
              The same foundation can support different customer journeys.
            </h2>
            <p className="mt-5 text-lg leading-8 text-secondary">
              Opzix does not package every capability as a generic public
              product. Modules are reusable systems that become part of scoped
              implementations for the business and industry at hand.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              "Ecommerce systems connect audits, storefront UX, analytics, AI shopping assistance, and operations workflows.",
              "Service business systems connect lead pages, intake, AI qualification, scheduling, CRM, and dashboards.",
              "Real estate systems connect IDX property search, buyer and seller journeys, community intelligence, scheduling, analytics, lead management, and follow-up.",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-lg border border-dark-border bg-dark-card p-5 text-secondary"
              >
                <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                <p className="leading-7">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid gap-8 rounded-xl border border-brand-cyan/30 bg-brand-blue/10 p-6 md:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <GitBranch className="h-10 w-10 text-brand-cyan" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Connected Architecture
            </p>
            <h2 className="heading-2 mt-3">
              Build the system around the workflow, then connect the tools.
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-secondary">
              The platform is the reusable foundation behind Opzix business
              systems: AI, analytics, scheduling, lead capture, automation,
              dashboards, customer experience infrastructure, diagnostics, and
              integrations.
            </p>
          </div>
          <TrackedLink
            href="/industries/real-estate"
            eventName="industry_card_clicked"
            payload={{
              industry: "real_estate",
              cta_location: "platform_real_estate",
            }}
            className="btn btn-secondary px-6 py-3 text-base w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
          >
            View Real Estate
          </TrackedLink>
        </div>
      </Section>
    </>
  );
}
