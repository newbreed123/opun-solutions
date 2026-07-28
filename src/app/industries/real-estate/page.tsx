import type { Metadata } from "next";
import Section from "@/components/Section";
import PageViewTracker from "@/components/PageViewTracker";
import StrategyCallTrackedButton from "@/components/StrategyCallTrackedButton";
import TrackedLink from "@/components/TrackedLink";
import VisibilityTracker from "@/components/VisibilityTracker";
import {
  BarChart3,
  Check,
  Clock,
  Home,
  MessageSquare,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Opzix for Real Estate | Stop Missing Leads Across Disconnected Tools",
  description:
    "Opzix helps real estate professionals capture more inquiries, respond faster, organize follow-up, and run their business with confidence from one connected platform.",
  alternates: {
    canonical: "/industries/real-estate",
  },
  openGraph: {
    title: "Opzix for Real Estate | One Connected Platform",
    description:
      "Stop losing buyers and sellers between disconnected real estate tools. Opzix brings your website, IDX, AI, CRM, scheduling, follow-up, and analytics together.",
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

const disconnectedTools = [
  "Your website",
  "Your CRM",
  "Your follow-up",
  "Your AI",
  "Your IDX",
  "Your scheduling",
  "Your analytics",
  "Your marketing",
];

const missedLeadStories = [
  "The buyer who filled out a form but never heard back.",
  "The seller who requested a home value but never scheduled a consultation.",
  "The past client you meant to follow up with.",
  "The lead buried inside your CRM.",
  "The showing request you did not see until it was too late.",
];

const businessOutcomes = [
  {
    title: "More Conversations",
    copy: "Respond to buyers and sellers while their interest is highest.",
    icon: MessageSquare,
  },
  {
    title: "More Listing Opportunities",
    copy: "Turn website visitors into listing appointments with valuation tools, AI conversations, and consistent follow-up.",
    icon: Home,
  },
  {
    title: "Faster Follow-Up",
    copy: "Know exactly who needs your attention next without digging through multiple systems.",
    icon: Clock,
  },
  {
    title: "Better Business Decisions",
    copy: "Understand which marketing, communities, conversations, and campaigns are actually generating business.",
    icon: BarChart3,
  },
];

const mondayMorning = [
  "Three new buyer inquiries came in overnight.",
  "Every one received an instant AI response.",
  "Two booked consultations.",
  "A seller requested a home valuation.",
  "Your CRM already organized the conversations.",
  "You know exactly who needs your attention today.",
];

const onePlatformItems = [
  "One website",
  "One CRM",
  "One AI assistant",
  "One follow-up system",
  "One scheduling platform",
  "One analytics dashboard",
];

const confidenceItems = [
  "Know every lead is captured.",
  "Know every inquiry gets a response.",
  "Know every appointment is organized.",
  "Know exactly what is working.",
  "Know where your next opportunity is coming from.",
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
            Opzix for Real Estate
          </p>
          <h1 className="heading-1">Every Missed Lead Costs You Money.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-secondary md:text-xl">
            Every disconnected system creates another chance to lose a buyer,
            miss a seller, or forget a follow-up. Opzix brings every opportunity
            together into one place, so fewer leads fall through the cracks and
            more conversations turn into closings.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-brand-cyan">
            Every inquiry deserves a clear path to becoming a client.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="real_estate_page"
              serviceRequested="Real Estate Operating Platform"
              industry="real_estate"
              eventName="real_estate_strategy_call_clicked"
              eventPayload={{ cta_location: "hero" }}
            >
              Book a Real Estate Strategy Session
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
              See How It Works
            </TrackedLink>
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              One Connected Business
            </p>
            <h2 className="heading-2 mt-4">
              Your clients do not care what software you use.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              They care how fast you respond, how professional you look, and how
              easy you are to work with. Opzix helps you deliver all three
              through one connected business platform.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {disconnectedTools.map((tool) => (
              <div
                key={tool}
                className="rounded-lg border border-dark-border bg-white/[0.035] px-4 py-3 text-sm font-semibold text-secondary"
              >
                {tool}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Missed Leads
            </p>
            <h2 className="heading-2 mt-4">Every missed lead has a story.</h2>
            <p className="body-lg mt-5 text-secondary">
              Most agents do not lose business because they are not good
              agents. They lose business because their technology does not work
              together.
            </p>
          </div>
          <div className="grid gap-3">
            {missedLeadStories.map((story) => (
              <div
                key={story}
                className="flex gap-3 rounded-lg border border-dark-border bg-white/[0.035] p-4 text-secondary"
              >
                <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                <p className="text-sm leading-6">{story}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="primary" id="monday-morning">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Imagine Monday Morning
            </p>
            <h2 className="heading-2 mt-4">
              You start the day knowing exactly what happened.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Instead of spending your morning chasing technology, you are
              talking to clients.
            </p>
          </div>
          <div className="grid gap-3">
            {mondayMorning.map((item) => (
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

      <Section bgColor="primary" id="outcomes">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            What Changes
          </p>
          <h2 className="heading-2 mt-4">
            When everything works together, the business feels different.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {businessOutcomes.map((outcome) => {
            const Icon = outcome.icon;

            return (
              <article key={outcome.title} className="card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-primary">
                  {outcome.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-secondary">
                  {outcome.copy}
                </p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section bgColor="secondary" id="why-agents-choose-opzix">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Why Agents Choose Opzix
            </p>
            <h2 className="heading-2 mt-4">
              Your Business Should Feel Simpler.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Less software. Less switching between tabs. Less wondering if
              someone followed up. Less guessing where your next client is
              coming from. More conversations, more appointments, and more
              confidence.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {onePlatformItems.map((item) => (
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

      <Section bgColor="primary" id="confidence">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Run Your Business With Confidence
            </p>
            <h2 className="heading-2 mt-4">
              Stop wondering what slipped through the cracks.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {confidenceItems.map((item) => (
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

      <section className="hero-atmosphere py-16 md:py-20">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <h2 className="heading-2">
            Your Business Deserves Better Than Disconnected Software.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Imagine every buyer inquiry answered, every seller request
            organized, every lead followed up with, every appointment tracked,
            and every marketing decision backed by real data.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="real_estate_page"
              serviceRequested="Real Estate Operating Platform"
              industry="real_estate"
              eventName="real_estate_strategy_call_clicked"
              eventPayload={{ cta_location: "final_cta" }}
            >
              Book a Real Estate Strategy Session
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
              See How It Works
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
