import Image from "next/image";
import Button from "@/components/Button";
import Section from "@/components/Section";
import TrackedLink from "@/components/TrackedLink";
import { STRATEGY_CALL_URL } from "@/lib/booking";
import { homepageIndustryCards } from "@/content/industries";
import { BarChart3, Check, Network, Sparkles, Workflow } from "lucide-react";

const coreIdeas = [
  {
    title: "Connected Experiences",
    question: "How do customers move from interest to action?",
    copy: "Opzix connects customer journeys, storefronts, lead paths, booking flows, and industry workflows so the public experience works as part of the platform.",
    icon: Network,
  },
  {
    title: "AI Guidance",
    question: "What happens when visitors need help?",
    copy: "AI assistants guide questions, capture intent, and route people toward the right next step without replacing human judgment.",
    icon: Sparkles,
  },
  {
    title: "Automation",
    question: "What happens after the lead appears?",
    copy: "Intake, scheduling, CRM handoff, notifications, and follow-up can work together instead of living in separate tools.",
    icon: Workflow,
  },
  {
    title: "Business Intelligence",
    question: "How do teams know what is working?",
    copy: "Analytics and dashboards turn conversations, leads, bookings, and operational signals into clearer decisions.",
    icon: BarChart3,
  },
];

const differences = [
  "Starts with the business platform, not a redesign checklist.",
  "Connects AI, analytics, automation, and operations around business growth.",
  "Builds reusable platform capabilities that can adapt by industry.",
];

const platformFoundations = [
  "AI-first Architecture",
  "API-driven Platform",
  "MLS Grid Data Consumer",
  "RESO Web API",
  "Operational Intelligence",
  "Industry-specific Workflows",
];

const heroAudienceLinks = [
  {
    label: "Real Estate",
    href: "/industries/real-estate",
    industry: "real-estate",
  },
  {
    label: "Service Businesses",
    href: "/solutions/lead-generation-systems",
    industry: "service-businesses",
  },
  {
    label: "Ecommerce",
    href: "/services/ecommerce-solutions",
    industry: "ecommerce",
  },
];

const heroPlatformSignals = [
  "AI Systems",
  "Analytics",
  "Automation",
  "Integrations",
  "Operational Workflows",
];

export default function Home() {
  return (
    <>
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden border-b border-dark-border bg-dark-deep md:min-h-[calc(100svh-5rem)]">
        <Image
          src="/opzix-command-center-hero-v2.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[82%_center] md:object-[75%_center]"
          style={{
            filter: "brightness(0.78) contrast(1.06) saturate(0.98)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(3, 12, 31, 0.97) 0%, rgba(3, 12, 31, 0.88) 30%, rgba(3, 12, 31, 0.52) 58%, rgba(3, 12, 31, 0.22) 82%, rgba(3, 12, 31, 0.10) 100%)",
          }}
        />

        <div className="container-wide relative flex min-h-[calc(100svh-4rem)] items-center py-16 md:min-h-[calc(100svh-5rem)] md:py-20">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              AI-Powered Business Platforms
            </p>
            <h1 className="heading-1">
              Build the Platform Behind a Smarter Business
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-secondary md:text-xl">
              Opzix builds reusable operating platforms that connect customer
              experience, AI, automation, analytics, integrations, and
              operational workflows into one system.
            </p>
            <p className="mt-4 max-w-xl text-xs font-semibold uppercase tracking-[0.12em] text-secondary/85 md:text-sm md:tracking-[0.18em]">
              One platform. Multiple industries. Endless possibilities.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row md:mt-8">
              <Button href={STRATEGY_CALL_URL} variant="primary" size="lg">
                Book a Strategy Session
              </Button>
              <Button href="/platform" variant="secondary" size="lg">
                See How It Works
              </Button>
            </div>
            <div className="mt-8 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3 md:mt-12 md:gap-4 md:pt-6">
              {heroAudienceLinks.map((item) => (
                <TrackedLink
                  key={item.label}
                  href={item.href}
                  eventName="industry_card_clicked"
                  payload={{
                    industry: item.industry,
                    cta_location: "homepage_hero_audience",
                  }}
                  className="group inline-flex min-h-9 items-center text-sm font-semibold uppercase tracking-[0.16em] text-secondary hover:text-brand-cyan"
                >
                  {item.label}
                  <span className="ml-2 opacity-0 transition-opacity group-hover:opacity-100">
                    -&gt;
                  </span>
                </TrackedLink>
              ))}
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-6 top-[27%] hidden w-[18rem] rounded-2xl border border-white/14 bg-slate-950/28 p-5 text-primary shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl lg:block xl:right-12"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
                Platform Status
              </p>
              <span className="h-2.5 w-2.5 rounded-full bg-brand-cyan shadow-[0_0_18px_rgba(6,182,212,0.85)]" />
            </div>
            <div className="space-y-3">
              {heroPlatformSignals.map((signal) => (
                <div key={signal} className="flex items-center gap-3 text-sm text-secondary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section bgColor="primary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            What Opzix Connects
          </p>
          <h2 className="heading-2 mt-4">
            Four ideas, one connected business platform.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Customers see the experience. Your team gets the system behind it:
            AI, automation, analytics, and workflows working together.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {coreIdeas.map((idea) => {
            const Icon = idea.icon;

            return (
              <article key={idea.title} className="card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  {idea.question}
                </p>
                <h3 className="mt-3 text-xl font-bold text-primary">
                  {idea.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-secondary">
                  {idea.copy}
                </p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              Who It Helps
            </p>
            <h2 className="heading-2 mt-4">
              One platform philosophy, adapted by industry.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Opzix adapts the same platform thinking to industries with
              different customer journeys.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {homepageIndustryCards.map((industry) => {
              const Icon = industry.icon;

              return (
                <article key={industry.slug} className="card flex h-full flex-col p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                    {industry.name}
                  </p>
                  <h3 className="text-xl font-bold text-primary">
                    {industry.headline}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-secondary">
                    {industry.copy}
                  </p>
                  <TrackedLink
                    href={industry.href}
                    eventName="industry_card_clicked"
                    payload={{
                      industry: industry.slug,
                      cta_location: "homepage_industries",
                    }}
                    className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-cyan hover:text-primary"
                  >
                    {industry.cta} <span className="ml-2">-&gt;</span>
                  </TrackedLink>
                </article>
              );
            })}
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              Platform Foundations
            </p>
            <h2 className="heading-2 mt-4">Built on Trusted Technology</h2>
            <p className="body-lg mt-5 text-secondary">
              The credibility behind Opzix is architectural: connected systems,
              reusable platform modules, and industry-specific workflows built
              for serious business operations.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {platformFoundations.map((item) => (
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

      <Section bgColor="deep">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              Why It Feels Different
            </p>
            <h2 className="heading-2 mt-4">
              Most agencies deliver websites. Opzix delivers operating
              platforms.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Opzix is designed for founders and operators who need customer
              experience, AI, automation, analytics, and operations to move
              together.
            </p>
          </div>
          <div className="card p-6 md:p-8">
            <div className="grid gap-4">
              {differences.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-dark-border bg-white/[0.035] p-4 text-secondary">
                  <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                  <p className="leading-7">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <section className="hero-atmosphere py-16 md:py-20">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Next Step
          </p>
          <h2 className="heading-2 mt-4">
            See where a connected platform would change the business.
          </h2>
          <p className="body-lg mx-auto mt-5 max-w-3xl text-secondary">
            Start with a strategy session or explore the platform before going
            deeper into a specific industry.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button href={STRATEGY_CALL_URL} size="lg">
              Book a Strategy Session
            </Button>
            <Button href="/platform" variant="secondary" size="lg">
              Explore the Platform
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
