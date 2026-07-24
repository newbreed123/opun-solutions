import type { Metadata } from "next";
import Section from "@/components/Section";
import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import ProofBar from "@/components/ProofBar";
import TrackedLink from "@/components/TrackedLink";
import { STRATEGY_CALL_URL } from "@/lib/booking";
import { industryDirectoryCards } from "@/content/industries";
import { Check, MessageSquare, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Industries | Ecommerce, Service Businesses and Real Estate | Opzix",
  description:
    "Explore the industries Opzix builds AI-powered business systems for, including ecommerce, service businesses, and real estate professionals.",
  alternates: {
    canonical: "/industries",
  },
};

const differentiation = [
  {
    title: "Built for real operations",
    description:
      "Opzix designs around how leads, customers, teams, and backend systems actually move.",
    icon: ShieldCheck,
  },
  {
    title: "Industry-specific journeys",
    description:
      "Each industry gets workflows, content, and handoffs shaped around its customers.",
    icon: MessageSquare,
  },
  {
    title: "Reusable platform foundation",
    description:
      "AI, analytics, scheduling, dashboards, lead capture, and integrations can be reused across vertical solutions.",
    icon: Zap,
  },
];

export default function Industries() {
  return (
    <>
      <Section bgColor="secondary" padded>
        <div className="grid items-center gap-10 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.32em] text-brand-cyan">
              Industries
            </p>
            <h1 className="heading-1 mb-6 leading-tight">
              Industry Solutions Built on Connected Business Systems
            </h1>
            <p className="body-lg mb-8 text-secondary">
              Opzix builds AI-powered systems for ecommerce brands, service
              businesses, and real estate professionals. The platform stays
              consistent; the workflows, customer journeys, and operational
              needs change by industry.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href={STRATEGY_CALL_URL}
                variant="primary"
                size="lg"
                trackingSource="services_page"
                serviceRequested="Industry-Specific Business Systems"
              >
                Book Strategy Call
              </Button>
              <Button href="/platform" variant="secondary" size="lg">
                Explore Platform
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-dark-border bg-dark-card p-6 shadow-card-glow">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              How to Read the Site
            </p>
            <div className="space-y-4">
              {[
                ["Solutions", "What Opzix builds."],
                ["Industries", "Who Opzix builds for."],
                ["Platform", "The reusable technology behind the systems."],
              ].map(([label, copy]) => (
                <div
                  key={label}
                  className="rounded-lg border border-dark-border bg-white/[0.035] p-4"
                >
                  <p className="font-bold text-primary">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-secondary">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="primary" id="overview">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Industry Focus
          </p>
          <h2 className="heading-2 mt-4">Industries We Build For</h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Each solution combines shared Opzix capabilities with the specific
            lead, sales, customer experience, and operations patterns of that
            market.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {industryDirectoryCards.map((industry) => {
            const Icon = industry.icon;

            return (
              <div key={industry.slug} className="card p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="heading-4">{industry.title}</h3>
                    <p className="mt-2 leading-7 text-secondary">
                      {industry.subtitle}
                    </p>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <p className="mb-3 font-semibold text-primary">
                          Common needs
                        </p>
                        <ul className="space-y-3">
                          {industry.problems.map((problem) => (
                            <li
                              key={problem}
                              className="flex gap-3 text-sm text-secondary"
                            >
                              <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                              <span>{problem}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-3 font-semibold text-primary">
                          System components
                        </p>
                        <ul className="space-y-3">
                          {industry.solutions.map((solution) => (
                            <li
                              key={solution}
                              className="flex gap-3 text-sm text-secondary"
                            >
                              <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                              <span>{solution}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <TrackedLink
                      href={industry.href}
                      eventName="industry_card_clicked"
                      payload={{
                        industry: industry.slug,
                        cta_location: "industries_index",
                      }}
                      className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-cyan hover:text-primary"
                    >
                      Explore {industry.title} <span className="ml-2">-&gt;</span>
                    </TrackedLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Why Opzix
          </p>
          <h2 className="heading-2 mt-4">
            One platform foundation, shaped to the industry.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {differentiation.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="card p-6">
                <Icon className="mb-5 h-8 w-8 text-brand-cyan" />
                <h3 className="text-xl font-bold text-primary">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-secondary">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <section className="border-t border-dark-border bg-dark-bg py-12 md:py-16">
        <div className="container-wide">
          <ProofBar />
        </div>
      </section>

      <CTASection
        headline="Not sure which industry system fits your business?"
        subheadline="Book a strategy call and we will map the highest-impact improvements across your website, lead flow, analytics, automation, and operations."
        buttonLabel="Book Strategy Call"
        buttonHref={STRATEGY_CALL_URL}
        trackingSource="services_page"
        serviceRequested="Industry-Specific Business Systems"
      />
    </>
  );
}
