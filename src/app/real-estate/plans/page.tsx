import type { Metadata } from "next";
import Section from "@/components/Section";
import PageViewTracker from "@/components/PageViewTracker";
import StrategyCallTrackedButton from "@/components/StrategyCallTrackedButton";
import RealEstatePricingFaq, {
  type RealEstatePricingFaqItem,
} from "@/components/RealEstatePricingFaq";
import { Bot, Building2, Check, LineChart, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Real Estate Platform Plans | IDX, CRM, AI and Automation | Opzix",
  description:
    "Compare simple Opzix real estate platform plans for agents, growing teams, producers, and brokerages.",
  alternates: {
    canonical: "/real-estate/plans",
  },
  openGraph: {
    title: "Real Estate Platform Plans | Opzix",
    description:
      "Choose the Opzix real estate platform plan that fits your business stage.",
    url: "/real-estate/plans",
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
      name: "Plans",
      item: "https://opzix.io/real-estate/plans",
    },
  ],
};

const plans = [
  {
    slug: "launch",
    name: "Launch",
    audience: "Best for independent agents starting their business.",
    headline: "Start Getting More Calls",
    copy: "Build the foundation for a professional real estate business that helps you generate leads and convert more visitors into clients.",
    launchPrice: "$500",
    platformPrice: "$200/month",
    bullets: [
      "MLS Home Search",
      "AI Assistant",
      "Lead Capture",
      "CRM",
      "Community Guides",
    ],
  },
  {
    slug: "growth",
    name: "Growth",
    audience: "Best for agents with steady traffic and lead flow.",
    headline: "Turn Interest Into Clients",
    copy: "Everything in Launch, plus more automation, AI, and marketing tools to help you consistently grow your business.",
    launchPrice: "$750",
    platformPrice: "$275/month",
    featured: true,
    bullets: [
      "Everything in Launch",
      "AI Lead Advisor",
      "Marketing Automation",
      "Lead Intelligence",
      "Advanced Analytics",
    ],
  },
  {
    slug: "performance",
    name: "Performance",
    audience: "Best for top producers scaling market presence.",
    headline: "Scale Your Business With Confidence",
    copy: "Advanced AI, analytics, and business intelligence designed for high-performing agents and teams.",
    launchPrice: "Custom",
    platformPrice: "Custom",
    bullets: [
      "Everything in Growth",
      "Market Intelligence",
      "AI Content",
      "Advanced Reporting",
      "Custom Workflows",
    ],
  },
  {
    slug: "brokerage",
    name: "Brokerage",
    audience: "Best for teams and brokerages with shared operations.",
    headline: "Power Your Entire Brokerage",
    copy: "Manage agents, operations, reporting, and business growth from one centralized platform.",
    launchPrice: "Custom",
    platformPrice: "Custom",
    bullets: [
      "Team Management",
      "Agent Routing",
      "Brokerage Dashboard",
      "Reporting",
      "Multi-Agent Platform",
    ],
  },
];

const comparisonRows = [
  {
    capability: "MLS Home Search",
    launch: "✓",
    growth: "✓",
    performance: "✓",
    brokerage: "✓",
  },
  {
    capability: "CRM",
    launch: "✓",
    growth: "✓",
    performance: "✓",
    brokerage: "✓",
  },
  {
    capability: "Lead Capture",
    launch: "✓",
    growth: "✓",
    performance: "✓",
    brokerage: "✓",
  },
  {
    capability: "Community Guides",
    launch: "✓",
    growth: "✓",
    performance: "✓",
    brokerage: "✓",
  },
  {
    capability: "AI Buyer Advisor",
    launch: "—",
    growth: "✓",
    performance: "✓",
    brokerage: "✓",
  },
  {
    capability: "Lead Intelligence",
    launch: "—",
    growth: "✓",
    performance: "✓",
    brokerage: "✓",
  },
  {
    capability: "Automation",
    launch: "—",
    growth: "✓",
    performance: "✓",
    brokerage: "✓",
  },
  {
    capability: "Advanced Analytics",
    launch: "—",
    growth: "—",
    performance: "✓",
    brokerage: "✓",
  },
  {
    capability: "Content Engine",
    launch: "—",
    growth: "—",
    performance: "✓",
    brokerage: "✓",
  },
  {
    capability: "Team Management",
    launch: "—",
    growth: "—",
    performance: "—",
    brokerage: "✓",
  },
  {
    capability: "Brokerage Operations",
    launch: "—",
    growth: "—",
    performance: "—",
    brokerage: "✓",
  },
];

const optionalAddOnRows = [
  {
    category: "Marketing Services",
    launch: true,
    growth: true,
    performance: true,
    brokerage: true,
  },
  {
    category: "AI Services",
    launch: false,
    growth: true,
    performance: true,
    brokerage: true,
  },
  {
    category: "Business Intelligence",
    launch: false,
    growth: true,
    performance: true,
    brokerage: true,
  },
  {
    category: "Brokerage Operations",
    launch: false,
    growth: false,
    performance: true,
    brokerage: true,
  },
];

const optionalAddOnDetails = [
  {
    category: "Marketing & Visibility",
    icon: TrendingUp,
    services: [
      "Google Ads Management",
      "Google Business Profile Management",
      "Advanced SEO",
      "Social Media Strategy",
    ],
  },
  {
    category: "AI & Automation",
    icon: Bot,
    services: [
      "Internal AI Business Assistant",
      "AI Lead Qualification",
      "Email Automation",
      "SMS Automation",
      "Workflow Automation",
    ],
  },
  {
    category: "Business Intelligence",
    icon: LineChart,
    services: [
      "Monthly Growth Reviews",
      "Market Intelligence",
      "Advanced Analytics",
      "Reputation Management",
      "Content Strategy",
    ],
  },
  {
    category: "Brokerage Operations",
    icon: Building2,
    services: [
      "Brokerage Intelligence",
      "Agent Dashboards",
      "Lead Routing",
      "Operational Reporting",
      "Custom Integrations",
    ],
  },
];

const everythingIncluded = [
  "IDX Website",
  "Community Guides",
  "Booking",
  "CRM",
  "Analytics",
  "AI Buyer Advisor",
  "Lead Intelligence",
  "Automation",
  "Follow-up",
  "Performance Visibility",
  "Market Intelligence",
  "Advanced Analytics",
  "Content Engine",
  "Dashboards",
  "Team Management",
  "Routing",
  "Reporting",
  "Brokerage Operations",
];

const platformEvolution = [
  "Platform improvements",
  "Security updates",
  "MLS enhancements",
  "AI improvements",
  "Performance optimization",
  "Infrastructure updates",
];

const pricingFaqItems: RealEstatePricingFaqItem[] = [
  {
    id: "which-plan",
    question: "Which plan should I start with?",
    answer:
      "Launch is for a clean foundation, Growth is for agents ready to convert more leads, Performance is for top producers who need deeper automation, and Brokerage is for teams that need shared operations.",
  },
  {
    id: "upgrade",
    question: "Can I upgrade later?",
    answer:
      "Yes. The platform is designed so your plan can grow as your business needs more AI, CRM depth, automation, reporting, or team operations.",
  },
  {
    id: "monthly",
    question: "Why is there a monthly platform subscription?",
    answer:
      "The subscription supports the living platform: hosting, product improvements, security updates, MLS enhancements, AI improvements, performance optimization, and infrastructure updates.",
  },
  {
    id: "strategy",
    question: "Do I need to choose before booking a call?",
    answer:
      "No. A strategy session helps match your current business stage to the right plan and launch scope.",
  },
  {
    id: "domain",
    question: "Can I keep my current domain?",
    answer:
      "Yes. Existing domains can usually be connected to the new platform during launch planning.",
  },
  {
    id: "migration",
    question: "Will you migrate my existing website?",
    answer:
      "Yes. Existing content, pages, domains, and lead paths can be reviewed during strategy so the launch plan accounts for what should move, improve, or be rebuilt.",
  },
];

export default function RealEstatePlansPage() {
  return (
    <>
      <PageViewTracker
        eventName="pricing_page_viewed"
        payload={{ page_name: "real_estate_plans", industry: "real_estate" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Section bgColor="secondary" padded className="hero-atmosphere">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Real Estate Platform Plans
          </p>
          <h1 className="heading-1">Choose the plan that fits your next stage.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-secondary md:text-xl">
            Start simple, then add deeper AI, CRM, marketing, automation, and
            team operations as your real estate business grows.
          </p>
          <div className="mt-8 flex justify-center">
            <StrategyCallTrackedButton
              source="pricing"
              serviceRequested="Real Estate Platform Plan"
              industry="real_estate"
              eventName="strategy_session_clicked"
              eventPayload={{ cta_location: "plans_hero" }}
            >
              Book a Strategy Session
            </StrategyCallTrackedButton>
          </div>
        </div>
      </Section>

      <Section bgColor="primary" id="plans">
        <div className="grid gap-5 lg:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.slug}
              id={plan.slug}
              className={`card flex h-full flex-col p-6 ${
                plan.featured
                  ? "border-brand-cyan/60 shadow-[0_0_38px_rgba(56,189,248,0.16)] ring-1 ring-brand-cyan/20"
                  : ""
              }`}
            >
              {plan.featured ? (
                <span className="mb-4 inline-flex w-fit rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan">
                  Recommended
                </span>
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                {plan.name} Plan
              </p>
              <h2 className="mt-2 text-2xl font-bold text-primary">
                {plan.name}
              </h2>
              <h3 className="mt-4 text-xl font-bold text-primary">
                {plan.headline}
              </h3>
              <p className="mt-3 text-sm leading-6 text-secondary">
                {plan.copy}
              </p>
              <p className="mt-3 text-xs font-semibold leading-5 text-brand-cyan">
                {plan.audience}
              </p>
              <div className="mt-6 rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                    Setup Fee
                  </p>
                  <p className="mt-1 text-lg font-bold text-primary">
                    {plan.launchPrice}
                  </p>
                </div>
                <div className="mt-4 border-t border-brand-cyan/20 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                    Monthly
                  </p>
                  <p className="mt-1 text-lg font-bold text-primary">
                    {plan.platformPrice}
                  </p>
                </div>
              </div>
              <ul className="mt-6 grid flex-1 gap-3">
                {plan.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 text-sm text-secondary">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <StrategyCallTrackedButton
                  source="pricing"
                  serviceRequested={`Real Estate ${plan.name} Plan`}
                  industry="real_estate"
                  eventName="plan_selected"
                  eventPayload={{
                    plan: plan.slug,
                    plan_name: plan.name,
                    cta_location: "plan_card",
                    industry: "real_estate",
                  }}
                  size={plan.featured ? "lg" : "md"}
                  className="!w-full !max-w-full min-w-0 !px-4 !py-3 !text-sm xl:!text-base"
                >
                  Book a Strategy Session
                </StrategyCallTrackedButton>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <ProfessionalServicesSection />

      <Section bgColor="secondary" id="comparison">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Compare Plans
          </p>
          <h2 className="heading-2 mt-4">Compare what each plan includes.</h2>
        </div>
        <div className="mt-10 overflow-x-auto rounded-lg border border-dark-border">
          <table className="min-w-[760px] w-full border-collapse bg-white/[0.025] text-left text-sm">
            <thead>
              <tr className="border-b border-dark-border text-primary">
                <th className="px-4 py-4 font-bold">Capability</th>
                {plans.map((plan) => (
                  <th key={plan.slug} className="px-4 py-4 text-center font-bold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.capability} className="border-b border-dark-border/70">
                  <td className="px-4 py-4 font-semibold text-primary">
                    {row.capability}
                  </td>
                  <td className="px-4 py-4 text-center text-secondary">{row.launch}</td>
                  <td className="px-4 py-4 text-center text-secondary">{row.growth}</td>
                  <td className="px-4 py-4 text-center text-secondary">{row.performance}</td>
                  <td className="px-4 py-4 text-center text-secondary">{row.brokerage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section bgColor="primary" id="continuous-platform-evolution">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Continuous Platform Evolution
          </p>
          <h2 className="heading-2 mt-4">
            Your Platform Gets Better Every Month
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {platformEvolution.map((item) => (
            <div
              key={item}
              className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-dark-border bg-white/[0.035] p-4 text-center text-secondary"
            >
              <Check className="mb-3 h-5 w-5 text-brand-cyan" />
              <p className="text-sm font-semibold leading-5">{item}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="primary" id="included">
        <details className="mx-auto max-w-5xl rounded-lg border border-dark-border bg-white/[0.035] p-6">
          <summary className="cursor-pointer text-xl font-bold text-primary">
            What's Included In Every Platform
          </summary>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {everythingIncluded.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-lg border border-dark-border bg-dark-card/70 p-4 text-sm text-secondary"
              >
                <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </details>
      </Section>

      <Section bgColor="secondary" id="faq">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            FAQ
          </p>
          <h2 className="heading-2 mt-4">Common plan questions</h2>
        </div>
        <RealEstatePricingFaq items={pricingFaqItems} />
      </Section>

      <section id="book-strategy-session" className="hero-atmosphere py-16 md:py-20">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <h2 className="heading-2">Still deciding?</h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            A strategy session helps match your goals to the right plan and
            launch scope.
          </p>
          <div className="mt-8 flex justify-center">
            <StrategyCallTrackedButton
              source="pricing"
              serviceRequested="Real Estate Platform Plan"
              industry="real_estate"
              eventName="strategy_session_clicked"
              eventPayload={{ cta_location: "plans_final_cta" }}
            >
              Book a Strategy Session
            </StrategyCallTrackedButton>
          </div>
        </div>
      </section>
    </>
  );
}

function ProfessionalServicesSection() {
  return (
    <Section bgColor="primary" id="professional-services">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
          Scale With Professional Services
        </p>
        <h2 className="heading-2 mt-4">Grow Beyond the Platform</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-secondary">
          Need more than software? Our team can help you build, automate,
          market, and grow your business with optional professional services.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted">
          Every Opzix plan includes everything you need to launch. Professional
          Services are completely optional and designed for businesses that want
          expert help growing faster.
        </p>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-dark-border">
        <table className="min-w-[760px] w-full border-collapse bg-white/[0.025] text-left text-sm">
          <thead>
            <tr className="border-b border-dark-border text-primary">
              <th className="px-4 py-4 font-bold">Service</th>
              {plans.map((plan) => (
                <th key={plan.slug} className="px-4 py-4 text-center font-bold">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {optionalAddOnRows.map((row) => (
              <tr key={row.category} className="border-b border-dark-border/70">
                <td className="px-4 py-4 font-semibold text-primary">
                  {row.category}
                </td>
                <AvailabilityCell available={row.launch} />
                <AvailabilityCell available={row.growth} />
                <AvailabilityCell available={row.performance} />
                <AvailabilityCell available={row.brokerage} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="mt-6 rounded-lg border border-dark-border bg-white/[0.035] p-5">
        <summary className="cursor-pointer text-lg font-bold text-primary">
          Explore Professional Services
        </summary>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {optionalAddOnDetails.map((group) => {
            const Icon = group.icon;

            return (
              <article
                key={group.category}
                className="rounded-lg border border-dark-border bg-dark-card/70 p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-bold text-primary">
                    {group.category}
                  </h3>
                </div>
                <ul className="mt-4 grid gap-3">
                  {group.services.map((service) => (
                    <li key={service} className="flex gap-3 text-sm text-secondary">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </details>
    </Section>
  );
}

function AvailabilityCell({ available }: { available: boolean }) {
  return (
    <td className="px-4 py-4 text-center text-secondary">
      {available ? (
        <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
          <Check className="h-4 w-4 text-brand-cyan" />
          <span>Available</span>
        </span>
      ) : (
        <span className="text-muted">-</span>
      )}
    </td>
  );
}
