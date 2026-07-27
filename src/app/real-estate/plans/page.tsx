import type { Metadata } from "next";
import Section from "@/components/Section";
import PageViewTracker from "@/components/PageViewTracker";
import RealEstatePricingFaq, {
  type RealEstatePricingFaqItem,
} from "@/components/RealEstatePricingFaq";
import StrategyCallTrackedButton from "@/components/StrategyCallTrackedButton";
import TrackedLink from "@/components/TrackedLink";
import VisibilityTracker from "@/components/VisibilityTracker";
import { realEstateGrowthPlatformTiers } from "@/content/industries";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Real Estate Platform Editions | MLS, AI, CRM and Analytics | Opzix",
  description:
    "Compare Opzix Real Estate Platform Editions with MLS-powered infrastructure, AI, CRM workflows, analytics, automation, support, and continuous platform improvements.",
  alternates: {
    canonical: "/real-estate/plans",
  },
  openGraph: {
    title: "Real Estate Platform Editions | Opzix",
    description:
      "Choose the Opzix real estate operating platform edition that fits your business today and can upgrade as it grows.",
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
      name: "Platform Editions",
      item: "https://opzix.io/real-estate/plans",
    },
  ],
};

const customerJourneySteps = [
  "Attract",
  "Qualify",
  "Convert",
  "Operate",
  "Scale",
];

const editionJourneyMap: Record<
  string,
  {
    stage: string;
    copy: string;
  }
> = {
  launch: {
    stage: "Attract + Qualify",
    copy: "Launch the public experience, property-search foundation, and lead capture paths needed to start turning attention into usable context.",
  },
  growth: {
    stage: "Qualify + Convert",
    copy: "Deepen buyer and seller journeys with stronger lead intelligence, automation, routing, and follow-up visibility.",
  },
  performance: {
    stage: "Convert + Operate",
    copy: "Add more advanced AI, community intelligence, analytics, and custom workflows for a more sophisticated operating model.",
  },
  brokerage: {
    stage: "Operate + Scale",
    copy: "Extend the platform into team workflows, dashboards, reporting, routing, integrations, and brokerage-level operating visibility.",
  },
};

const whyAgentsChooseOpzix = [
  {
    title: "One Platform Foundation",
    copy: "Every edition runs on the same platform foundation, with deeper capabilities unlocked as the business matures.",
  },
  {
    title: "MLS-Powered Infrastructure",
    copy: "Property experiences are designed around approved IDX paths, structured data, and modern real estate workflows.",
  },
  {
    title: "Continuous Improvements",
    copy: "The monthly platform subscription supports updates, maintenance, support, monitoring, and ongoing improvements.",
  },
  {
    title: "AI and Automation Layer",
    copy: "AI, lead qualification, follow-up automation, and operational workflows can deepen as the platform evolves.",
  },
  {
    title: "Operating Visibility",
    copy: "Analytics, dashboards, lead intelligence, and reporting help turn activity into clearer business decisions.",
  },
];

const comparisonRows = [
  {
    label: "Customer Journey",
    values: [
      "Foundation",
      "Expanded",
      "Advanced",
      "Enterprise",
    ],
  },
  {
    label: "Lead Intelligence",
    values: [
      "Basic",
      "Advanced",
      "Advanced",
      "Enterprise",
    ],
  },
  {
    label: "AI",
    values: [
      "Foundation",
      "Buyer Advisor",
      "Expanded",
      "Organization-wide",
    ],
  },
  {
    label: "Operations",
    values: [
      "Basic",
      "Automation",
      "Intelligence",
      "Team Operations",
    ],
  },
  {
    label: "Analytics",
    values: [
      "Basic",
      "Performance",
      "Market Intelligence",
      "Brokerage Reporting",
    ],
  },
  {
    label: "CRM",
    values: [
      "Foundation",
      "Automation",
      "Intelligence",
      "Enterprise Operations",
    ],
  },
  {
    label: "Platform Scope",
    values: [
      "Foundation",
      "Conversion System",
      "Market Intelligence System",
      "Operating Platform",
    ],
  },
];

const includedItems = [
  {
    title: "MLS Infrastructure",
    copy: "Property search foundations planned around approved IDX and MLS data paths.",
  },
  {
    title: "AI Platform",
    copy: "AI-ready customer guidance and qualification workflows that can deepen over time.",
  },
  {
    title: "Hosting",
    copy: "Managed hosting foundation for the real estate platform experience.",
  },
  {
    title: "Security",
    copy: "Security updates that support a professional public experience as the platform evolves.",
  },
  {
    title: "Platform Updates",
    copy: "Ongoing improvements to the shared platform foundation.",
  },
  {
    title: "Infrastructure Updates",
    copy: "Platform infrastructure improvements that keep the experience stable as the product evolves.",
  },
  {
    title: "Analytics",
    copy: "Visibility into core activity, lead paths, bookings, and platform usage.",
  },
  {
    title: "Technical Support",
    copy: "Support for platform operation, configuration, and issue resolution.",
  },
  {
    title: "Operational Monitoring",
    copy: "Monitoring and review of important platform and workflow signals.",
  },
  {
    title: "Customer Journey Framework",
    copy: "Reusable buyer, seller, inquiry, booking, and follow-up journey structure.",
  },
];

const upgradePath = [
  "Launch Edition",
  "Growth Edition",
  "Performance Edition",
  "Brokerage Edition",
];

const platformRoadmapItems = [
  "Platform improvements",
  "Security updates",
  "MLS enhancements",
  "AI improvements",
  "Performance optimization",
  "Infrastructure updates",
];

const planFeatureMessaging: Record<
  string,
  {
    whatItDoes: string;
    outcome: string;
  }
> = {
  "MLS Search": {
    whatItDoes:
      "Gives buyers a branded property discovery path connected to your customer journey.",
    outcome: "Property discovery becomes part of the platform.",
  },
  "Community Guides": {
    whatItDoes:
      "Turns local expertise into useful market and neighborhood context for buyers and sellers.",
    outcome: "More local trust.",
  },
  "Booking": {
    whatItDoes:
      "Lets high-intent buyers and sellers schedule a consultation from the platform.",
    outcome: "More conversations booked.",
  },
  "CRM": {
    whatItDoes:
      "Organizes inquiries, context, and next steps so follow-up has a home.",
    outcome: "Cleaner lead management.",
  },
  "Analytics Foundation": {
    whatItDoes:
      "Tracks core platform activity across visits, inquiries, bookings, and lead paths.",
    outcome: "Basic visibility into what is working.",
  },
  "Everything in Launch Edition": {
    whatItDoes:
      "Keeps the foundation in place while adding deeper qualification and conversion systems.",
    outcome: "A stronger platform base.",
  },
  "AI Buyer Advisor": {
    whatItDoes:
      "Guides buyers through questions, preferences, locations, property needs, and next steps.",
    outcome: "Clearer buyer intent.",
  },
  "Lead Intelligence": {
    whatItDoes:
      "Connects source, behavior, preferences, conversations, and form context into better lead signals.",
    outcome: "Better prioritization.",
  },
  "Automation": {
    whatItDoes:
      "Moves notifications, routing, reminders, and repeatable follow-up steps through the platform.",
    outcome: "Fewer missed opportunities.",
  },
  "Follow-up": {
    whatItDoes:
      "Keeps buyer and seller opportunities moving after the first inquiry or booking.",
    outcome: "More consistent client conversion.",
  },
  "Performance Visibility": {
    whatItDoes:
      "Shows which journeys, lead sources, and actions are creating business movement.",
    outcome: "Smarter conversion decisions.",
  },
  "Everything in Growth Edition": {
    whatItDoes:
      "Keeps qualification, automation, and follow-up systems in place while adding market intelligence.",
    outcome: "A deeper operating system.",
  },
  "Market Intelligence": {
    whatItDoes:
      "Turns local market context, content, and customer interest into stronger positioning.",
    outcome: "Stronger market presence.",
  },
  "Advanced Analytics": {
    whatItDoes:
      "Connects journey performance, lead quality, market interest, and conversion patterns.",
    outcome: "Better business intelligence.",
  },
  "Reputation": {
    whatItDoes:
      "Supports trust signals, reviews, testimonials, and credibility as part of the platform.",
    outcome: "More confidence from prospects.",
  },
  "Content Engine": {
    whatItDoes:
      "Builds market, community, buyer, seller, and educational content into the growth system.",
    outcome: "Compounding visibility.",
  },
  "AI Expansion": {
    whatItDoes:
      "Expands AI beyond basic guidance into richer buyer, seller, market, and workflow support.",
    outcome: "More intelligent customer and operational journeys.",
  },
  "Team Management": {
    whatItDoes:
      "Gives teams clearer ownership, activity visibility, and shared operating context.",
    outcome: "Cleaner team execution.",
  },
  "Routing": {
    whatItDoes:
      "Sends leads, tasks, and follow-up needs to the right person or workflow.",
    outcome: "Faster response and clearer ownership.",
  },
  "Dashboards": {
    whatItDoes:
      "Centralizes activity, pipeline, performance, and operational signals.",
    outcome: "Better management visibility.",
  },
  "Reporting": {
    whatItDoes:
      "Turns team, lead, appointment, and conversion activity into leadership reporting.",
    outcome: "Better brokerage decisions.",
  },
  "Brokerage Operations": {
    whatItDoes:
      "Supports organization-level workflows, agent visibility, reporting, routing, and operating rhythms.",
    outcome: "One platform for the business.",
  },
};

const growthServiceCategories = [
  {
    category: "Marketing & Visibility",
    services: [
      {
        title: "Google Ads Management",
        whatItDoes:
          "Reaches buyers and sellers exactly when they are searching online for homes and agents in your market.",
        whyItMatters:
          "You can reach people who are already looking for an agent instead of waiting for them to find you.",
        outcome: "More qualified leads.",
      },
      {
        title: "Google Business Profile Management",
        whatItDoes:
          "Helps more local clients discover your business through Google Search and Maps.",
        whyItMatters:
          "Many clients choose an agent after searching locally.",
        outcome: "More local inquiries.",
      },
      {
        title: "Advanced SEO",
        whatItDoes:
          "Helps you show up when buyers and sellers are actively searching online.",
        whyItMatters:
          "Search works better when your platform answers the questions real prospects are already asking.",
        outcome: "More relevant organic traffic.",
      },
      {
        title: "Social Media Strategy",
        whatItDoes:
          "Turns listings, neighborhoods, client education, and market activity into a more consistent visibility plan.",
        whyItMatters:
          "Social content is more useful when it supports a larger lead and relationship strategy.",
        outcome: "More consistent market visibility.",
      },
    ],
  },
  {
    category: "AI & Automation",
    services: [
      {
        title: "Internal AI Business Assistant",
        whatItDoes:
          "Your private AI assistant helps organize your day, summarize leads, prepare appointments, and answer business questions so you can spend more time with clients.",
        whyItMatters:
          "You can spend less time managing information and more time serving clients.",
        outcome: "Save time and stay organized.",
      },
      {
        title: "AI Lead Qualification",
        whatItDoes:
          "Asks the right questions to understand whether someone is a buyer, seller, relocation prospect, or listing opportunity.",
        whyItMatters:
          "Qualified context helps you prioritize serious opportunities faster.",
        outcome: "Better lead quality.",
      },
      {
        title: "Email Automation",
        whatItDoes:
          "Sends helpful follow-up based on what the person asked for and where they are in the journey.",
        whyItMatters:
          "Helpful follow-up should not depend on remembering every manual task.",
        outcome: "Faster follow-up.",
      },
      {
        title: "SMS Automation",
        whatItDoes:
          "Adds timely text reminders, confirmations, and follow-up prompts where a quick message makes sense.",
        whyItMatters:
          "Some high-intent leads respond faster through simple, timely messages.",
        outcome: "Fewer missed opportunities.",
      },
      {
        title: "Workflow Automation",
        whatItDoes:
          "Keeps lead capture, booking, alerts, reminders, and follow-up steps moving without extra manual work.",
        whyItMatters:
          "Disconnected manual steps make it easier for leads to stall.",
        outcome: "Cleaner operations.",
      },
    ],
  },
  {
    category: "Growth & Intelligence",
    services: [
      {
        title: "Monthly Growth Reviews",
        whatItDoes:
          "Looks at what is working each month and helps choose the next move for better leads and stronger follow-up.",
        whyItMatters:
          "Growth is easier to improve when decisions are tied to what the data shows.",
        outcome: "Smarter monthly priorities.",
      },
      {
        title: "Market Intelligence",
        whatItDoes:
          "Turns market trends and local insight into content your buyers and sellers can actually use.",
        whyItMatters:
          "Clients trust agents who can explain the market clearly.",
        outcome: "Stronger authority.",
      },
      {
        title: "Advanced Analytics",
        whatItDoes:
          "Shows where leads are coming from, which pages are working, and which actions are turning into appointments.",
        whyItMatters:
          "You can see what is producing real opportunities instead of relying on guesswork.",
        outcome: "Better return on investment.",
      },
      {
        title: "Reputation Management",
        whatItDoes:
          "Helps strengthen reviews, testimonials, trust signals, and local credibility.",
        whyItMatters:
          "Many prospects look for proof before they decide who to contact.",
        outcome: "More confidence from new clients.",
      },
      {
        title: "Content Strategy",
        whatItDoes:
          "Plans useful content around neighborhoods, buyers, sellers, market education, and local authority.",
        whyItMatters:
          "Content performs better when it supports the questions and decisions prospects actually have.",
        outcome: "More useful engagement.",
      },
    ],
  },
  {
    category: "Brokerage Services",
    services: [
      {
        title: "Brokerage Intelligence",
        whatItDoes:
          "Helps brokerage leaders see team activity, leads, appointments, reporting, and business signals in one place.",
        whyItMatters:
          "Brokerage leaders need a clearer picture of what is happening across the business.",
        outcome: "Better operating decisions.",
      },
      {
        title: "Agent Dashboards",
        whatItDoes:
          "Gives agents a clearer view of their leads, next steps, activity, and performance signals.",
        whyItMatters:
          "Agents work better when their priorities are visible and easy to act on.",
        outcome: "More consistent follow-up.",
      },
      {
        title: "Lead Routing",
        whatItDoes:
          "Sends each inquiry to the right agent, team, pipeline, or follow-up workflow.",
        whyItMatters:
          "A good lead can lose momentum when ownership is unclear.",
        outcome: "Faster response times.",
      },
      {
        title: "Operational Reporting",
        whatItDoes:
          "Shows activity, lead flow, appointments, routing, and follow-up status as the brokerage grows.",
        whyItMatters:
          "Teams can improve what they can actually see.",
        outcome: "Cleaner brokerage visibility.",
      },
      {
        title: "Custom Integrations",
        whatItDoes:
          "Connects the platform to the calendars, CRM tools, dashboards, email systems, and workflows your team already uses.",
        whyItMatters:
          "Important customer and operational data should move through the systems your team already uses.",
        outcome: "Less disconnected work.",
      },
    ],
  },
];

const pricingFaqItems: RealEstatePricingFaqItem[] = [
  {
    id: "platform-launch",
    question: "Why is Platform Launch separate?",
    answer:
      "The Platform Launch Fee covers implementation, configuration, quality assurance, and launch assistance. The Monthly Platform covers the ongoing platform, hosting, support, maintenance, and improvements.",
  },
  {
    id: "upgrade-later",
    question: "Can I upgrade later?",
    answer:
      "Yes. Launch Edition can grow into Growth, Performance, or Brokerage as your business needs more lead intelligence, AI, automation, reporting, or team workflows.",
  },
  {
    id: "growth-services-anytime",
    question: "Can I add Growth Services anytime?",
    answer:
      "Yes. Growth Services are optional professional services layered onto the platform when you want strategic help with marketing, content, automation, AI optimization, CRM integrations, or brokerage operations.",
  },
  {
    id: "google-ads",
    question: "Do I need Google Ads immediately?",
    answer:
      "No. Ads work best after the platform has a clear offer, tracking, lead capture, and follow-up path. Strategy determines the right timing.",
  },
  {
    id: "internal-ai",
    question: "Can I add Internal AI later?",
    answer:
      "Yes. Internal AI can be added later when your team needs support with knowledge, operations, routing, or repeatable workflows.",
  },
  {
    id: "brokerage-upgrade",
    question: "Can teams upgrade to Brokerage?",
    answer:
      "Yes. Teams can move into Brokerage when they need shared workflows, agent dashboards, custom reporting, lead routing, or deeper integrations.",
  },
  {
    id: "idx-search",
    question: "How does MLS-powered Search work?",
    answer:
      "MLS-powered Search is configured around approved MLS Grid and IDX integration paths where available. Market access, approval, and exact data paths are confirmed during strategy.",
  },
  {
    id: "own-platform",
    question: "Do I own my platform?",
    answer:
      "You own your brand assets, content, and business data according to the final agreement. The Opzix platform, shared modules, infrastructure, and reusable product capabilities remain part of the maintained Opzix platform.",
  },
  {
    id: "migrate-existing",
    question: "Can I migrate from another website?",
    answer:
      "Yes. Existing content, domains, analytics context, and lead paths can be reviewed during strategy so the deployment plan accounts for what should move, improve, or be rebuilt on the platform.",
  },
  {
    id: "ai-later",
    question: "Can I add AI later?",
    answer:
      "Yes. AI can start simple and deepen over time. Higher editions can add more advanced buyer, seller, lead qualification, internal assistant, and operational workflows.",
  },
  {
    id: "multiple-agents",
    question: "Can brokerages manage multiple agents?",
    answer:
      "Brokerage Edition is designed for multi-agent workflows such as routing, reporting, dashboards, team visibility, roles, and custom integration planning.",
  },
  {
    id: "business-grows",
    question: "What happens if my business grows?",
    answer:
      "The platform is designed to upgrade as your needs mature. Customers can move into deeper editions when they need more automation, reporting, AI, brokerage workflows, or custom platform depth.",
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
            Real Estate Platform Editions
          </p>
          <h1 className="heading-1">
            Choose the Edition That Fits Your Real Estate Business
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-secondary md:text-xl">
            Each edition maps to a different level of business maturity, from
            attracting and qualifying new opportunities to operating and scaling
            a connected real estate platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="pricing"
              serviceRequested="Real Estate Platform Edition"
              industry="real_estate"
              eventName="strategy_session_clicked"
              eventPayload={{ cta_location: "plans_hero" }}
            >
              Book a Strategy Session
            </StrategyCallTrackedButton>
            <a
              href="#comparison"
              className="btn btn-secondary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
            >
              Compare Editions
            </a>
          </div>
        </div>
      </Section>

      <Section bgColor="primary" id="plans">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Platform Editions
          </p>
          <h2 className="heading-2 mt-4">
            Choose the edition that matches your operating stage.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            You are choosing the right level of platform depth for how your
            business currently attracts, qualifies, converts, operates, and
            scales.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-5">
          {customerJourneySteps.map((step) => (
            <div
              key={step}
              className="rounded-lg border border-dark-border bg-white/[0.035] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-secondary"
            >
              {step}
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {realEstateGrowthPlatformTiers.map((tier) => {
            const isRecommended = Boolean(tier.recommendationLabel);
            const journeyMaturity = editionJourneyMap[tier.slug];

            return (
              <article
                key={tier.slug}
                id={tier.slug}
                data-platform-plan={tier.slug}
                data-recommended-platform={isRecommended ? "true" : undefined}
                className={`card relative scroll-mt-28 p-6 transition-shadow ${
                  isRecommended
                    ? "border-brand-cyan/60 shadow-[0_0_38px_rgba(56,189,248,0.16)] ring-1 ring-brand-cyan/20"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">
                      {tier.name}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-primary">
                      {tier.positioning}
                    </h2>
                  </div>
                  {tier.recommendationLabel ? (
                    <span className="inline-flex w-fit flex-none rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan">
                      {tier.recommendationLabel}
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 text-sm leading-6 text-secondary">
                  {tier.goal}
                </p>

                {journeyMaturity ? (
                  <div className="mt-5 rounded-lg border border-brand-cyan/25 bg-brand-cyan/[0.07] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                      Journey maturity
                    </p>
                    <p className="mt-2 text-lg font-bold text-primary">
                      {journeyMaturity.stage}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      {journeyMaturity.copy}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 rounded-lg border border-dark-border bg-white/[0.035] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                    Business Stage
                  </p>
                  <p className="mt-2 text-sm leading-6 text-secondary">
                    {tier.idealCustomer}
                  </p>
                </div>

                <div className="mt-4 rounded-lg border border-dark-border bg-white/[0.035] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                    Business transformation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-secondary">
                    {tier.implementation}
                  </p>
                </div>

                {tier.recommendationLabel ? (
                  <div className="mt-5 rounded-lg border border-brand-cyan/25 bg-brand-cyan/[0.07] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                      {tier.recommendationLabel}
                    </p>
                    {tier.recommendationSummary ? (
                      <p className="mt-2 text-sm font-semibold leading-6 text-primary">
                        {tier.recommendationSummary}
                      </p>
                    ) : null}
                    {tier.recommendationCopy ? (
                      <p className="mt-2 text-sm leading-6 text-secondary">
                        {tier.recommendationCopy}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InvestmentDetail
                    label={tier.launchLabel}
                    price={tier.launchPrice}
                  />
                  <InvestmentDetail
                    label={tier.platformLabel}
                    price={tier.platformPrice}
                  />
                </div>
                {tier.investmentNote ? (
                  <p className="mt-3 text-xs leading-5 text-muted">
                    {tier.investmentNote}
                  </p>
                ) : null}

                <div className="mt-6 rounded-lg border border-dark-border bg-white/[0.035] p-4">
                  <p className="text-sm font-bold text-primary">
                    Capabilities unlocked
                  </p>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {tier.modules.map((module) => {
                      const featureMessaging = planFeatureMessaging[module];

                      return (
                        <li
                          key={module}
                          className="rounded-lg border border-dark-border bg-white/[0.035] p-3 text-sm text-secondary"
                        >
                          <div className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                            <div>
                              <p className="font-semibold text-primary">
                                {module}
                              </p>
                              {featureMessaging ? (
                                <>
                                  <p className="mt-1 leading-6">
                                    {featureMessaging.whatItDoes}
                                  </p>
                                  <p className="mt-2 text-xs leading-5 text-brand-cyan">
                                    {featureMessaging.outcome}
                                  </p>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-6">
                  <StrategyCallTrackedButton
                    source="pricing"
                    serviceRequested={`Real Estate ${tier.name} Platform`}
                    industry="real_estate"
                    eventName="plan_selected"
                    eventPayload={{
                      plan: tier.slug,
                      plan_name: tier.name,
                      cta_location: "plan_card",
                      industry: "real_estate",
                    }}
                    additionalEvents={
                      isRecommended
                        ? [
                            {
                              eventName: "recommended_plan_clicked",
                              payload: {
                                plan: tier.slug,
                                plan_name: tier.name,
                                cta_location: "plan_card",
                                industry: "real_estate",
                              },
                            },
                          ]
                        : []
                    }
                    size={isRecommended ? "lg" : "md"}
                  >
                    {tier.ctaLabel || "Book a Strategy Session"}
                  </StrategyCallTrackedButton>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-lg border border-dark-border bg-white/[0.035] px-6 py-5 text-center">
          <p className="text-lg font-bold text-primary">
            Customers subscribe to platform maturity, not a single launch moment.
          </p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Each edition starts with a deployment and continues through monthly
            platform support, updates, analytics, automation, and long-term
            improvement.
          </p>
        </div>
      </Section>

      <Section bgColor="secondary" id="why-agents-choose-opzix">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Platform Model
          </p>
          <h2 className="heading-2 mt-4">
            One platform foundation, deeper capabilities by edition.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {whyAgentsChooseOpzix.map((item) => (
            <article key={item.title} className="card p-5">
              <p className="text-lg font-bold text-primary">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-secondary">{item.copy}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section bgColor="primary" id="pricing-philosophy">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Commercial Model
          </p>
          <h2 className="heading-2 mt-4">
            You're investing in a platform, not a project.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Traditional web work often ends at launch. Opzix delivers a
            maintained operating platform that evolves through updates,
            automation, analytics, AI, support, and continuous improvements.
            The recurring subscription exists because the platform keeps
            operating after deployment.
          </p>
        </div>
      </Section>

      <Section bgColor="primary" id="comparison">
        <VisibilityTracker
          eventName="comparison_viewed"
          payload={{
            comparison: "real_estate_platform_categories",
            industry: "real_estate",
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Platform Comparison
          </p>
          <h2 className="heading-2 mt-4">
            Compare the editions by platform maturity.
          </h2>
        </div>
        <div className="mt-12 grid gap-4">
          {comparisonRows.map((row) => (
            <article key={row.label} className="card p-5">
              <h3 className="text-lg font-bold text-primary">{row.label}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {realEstateGrowthPlatformTiers.map((tier, index) => (
                  <div
                    key={`${row.label}-${tier.slug}`}
                    className="rounded-lg border border-dark-border bg-white/[0.035] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                      {tier.name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      {row.values[index]}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section bgColor="secondary" id="included">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Platform Foundation
          </p>
          <h2 className="heading-2 mt-4">Every Opzix Platform Includes</h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Regardless of edition, every customer joins the same platform
            foundation. Higher editions unlock deeper capabilities rather than
            entirely different systems.
          </p>
        </div>
        <ul className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {includedItems.map((item) => (
            <li
              key={item.title}
              className="rounded-lg border border-dark-border bg-white/[0.035] p-5 text-sm font-semibold text-primary"
            >
              <Check className="mb-4 h-5 w-5 text-brand-cyan" />
              <p>{item.title}</p>
              <p className="mt-2 text-xs font-normal leading-5 text-secondary">
                {item.copy}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section bgColor="deep" id="upgrade-path">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Why Customers Upgrade
          </p>
          <h2 className="heading-2 mt-4">
            Upgrade because the business evolves.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Customers do not upgrade because the original edition expires. They
            upgrade when they need deeper lead intelligence, more automation,
            stronger reporting, richer AI, or brokerage workflows.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-4">
          {upgradePath.map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-dark-border bg-white/[0.035] px-4 py-4 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                {index + 1}
              </p>
              <p className="mt-2 text-sm font-bold text-primary">{step}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="primary" id="growth-services">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Growth Services
          </p>
          <h2 className="heading-2 mt-4">
            Optional professional services layered onto the platform.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Platform customers are never forced into Growth Services. These are
            optional strategic engagements for Google Ads, SEO, content,
            automation consulting, AI optimization, CRM integrations, and
            brokerage consulting when the platform is ready for more.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {growthServiceCategories.map((category) => (
            <article key={category.category} className="card p-6">
              <h3 className="text-xl font-bold text-primary">
                {category.category}
              </h3>
              <div className="mt-5 grid gap-4">
                {category.services.map((service) => (
                  <div
                    key={service.title}
                    className="rounded-lg border border-dark-border bg-white/[0.035] p-4"
                  >
                    <p className="text-sm font-bold text-primary">
                      {service.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      {service.whatItDoes}
                    </p>
                    <div className="mt-4 grid gap-2 border-t border-dark-border pt-4">
                      <p className="text-xs leading-5 text-secondary">
                        <span className="font-semibold text-brand-cyan">
                          Why it matters:
                        </span>{" "}
                        {service.whyItMatters}
                      </p>
                      <p className="text-xs leading-5 text-secondary">
                        <span className="font-semibold text-primary">
                          Business outcome:
                        </span>{" "}
                        {service.outcome}
                      </p>
                    </div>
                    <TrackedLink
                      href="/real-estate/platform"
                      eventName="growth_service_clicked"
                      payload={{
                        service: service.title,
                        category: category.category,
                        industry: "real_estate",
                      }}
                      className="mt-3 inline-flex min-h-8 items-center text-sm font-semibold text-brand-cyan hover:text-primary"
                    >
                      See How It Works
                    </TrackedLink>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section bgColor="secondary" id="continuous-platform-evolution">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Continuous Platform Evolution
            </p>
            <h2 className="heading-2 mt-4">
              Every edition benefits as the platform improves.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              The monthly subscription supports a living platform: shared
              improvements, security updates, MLS enhancements, AI improvements,
              performance optimization, and infrastructure updates that compound
              across editions.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {platformRoadmapItems.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-lg border border-dark-border bg-white/[0.035] p-4 text-secondary"
              >
                <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                <p className="text-sm leading-6">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="secondary" id="faq">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            FAQ
          </p>
          <h2 className="heading-2 mt-4">Common platform questions</h2>
        </div>
        <RealEstatePricingFaq items={pricingFaqItems} />
      </Section>

      <section id="book-strategy-session" className="hero-atmosphere py-16 md:py-20">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <h2 className="heading-2">Ready to choose the right platform?</h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            A strategy session helps match your goals to the right platform,
            deployment scope, monthly subscription, and optional Growth Services.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="pricing"
              serviceRequested="Real Estate Platform Edition"
              industry="real_estate"
              eventName="strategy_session_clicked"
              eventPayload={{ cta_location: "plans_final_cta" }}
            >
              Book a Strategy Session
            </StrategyCallTrackedButton>
            <a
              href="#comparison"
              className="btn btn-secondary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
            >
              Compare Editions
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function InvestmentDetail({ label, price }: { label: string; price: string }) {
  return (
    <div className="rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold leading-7 text-primary">{price}</p>
    </div>
  );
}
