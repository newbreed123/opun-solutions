import type { Metadata } from "next";
import Section from "@/components/Section";
import PageViewTracker from "@/components/PageViewTracker";
import StrategyCallTrackedButton from "@/components/StrategyCallTrackedButton";
import TrackedLink from "@/components/TrackedLink";
import { platformModules } from "@/content/industries";
import { Check, GitBranch, Layers3 } from "lucide-react";

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
    label: "Solutions",
    copy: "AI assistants, lead generation systems, analytics, ecommerce systems, scheduling, dashboards, websites, and integrations.",
  },
  {
    label: "Industries",
    copy: "Ecommerce, service businesses, and real estate implementations shaped around their customer journeys.",
  },
  {
    label: "Platform",
    copy: "Reusable modules available within Opzix implementations, not a claim that every module is a standalone SaaS product.",
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
        <div className="grid items-center gap-10 lg:grid-cols-[1.06fr_0.94fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              The Opzix Platform
            </p>
            <h1 className="heading-1 max-w-5xl">
              One Connected Foundation for Customer Experience and Business
              Operations
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-secondary md:text-xl">
              The Opzix Platform brings together AI, analytics, scheduling,
              lead capture, automation, dashboards, and integrations so
              businesses can operate through connected systems instead of
              disconnected tools.
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
                View Modules
              </TrackedLink>
            </div>
          </div>

          <div className="rounded-xl border border-dark-border bg-dark-card p-6 shadow-card-glow">
            <div className="mb-6 flex items-center gap-4 border-b border-dark-border pb-4">
              <Layers3 className="h-9 w-9 text-brand-cyan" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-cyan">
                  Platform Model
                </p>
                <h2 className="mt-1 text-2xl font-bold text-primary">
                  Shared modules, custom implementation
                </h2>
              </div>
            </div>
            <div className="space-y-4">
              {architecture.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-dark-border bg-white/[0.035] p-4"
                >
                  <p className="font-bold text-primary">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-secondary">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="primary" id="modules">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Platform Modules
          </p>
          <h2 className="heading-2 mt-4">
            Reusable systems available within Opzix implementations.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Each module solves a specific business problem and can be adapted
            across ecommerce, service business, and real estate solutions.
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
              "Real estate systems connect community content, property search infrastructure, buyer and seller journeys, scheduling, analytics, and follow-up.",
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
              dashboards, web infrastructure, diagnostics, and integrations.
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
