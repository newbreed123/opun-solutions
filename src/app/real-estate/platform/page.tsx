import type { Metadata } from "next";
import Section from "@/components/Section";
import PageViewTracker from "@/components/PageViewTracker";
import StrategyCallTrackedButton from "@/components/StrategyCallTrackedButton";
import TrackedLink from "@/components/TrackedLink";
import VisibilityTracker from "@/components/VisibilityTracker";
import {
  BarChart3,
  Bot,
  CalendarCheck,
  Check,
  Database,
  Home,
  Search,
  Users,
  Workflow,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How Opzix Works | Real Estate Website, CRM, AI and Follow-Up",
  description:
    "See how Opzix connects buyer journeys, seller journeys, IDX property search, AI, CRM, scheduling, automated follow-up, analytics, and authorized MLS experiences.",
  alternates: {
    canonical: "/real-estate/platform",
  },
  openGraph: {
    title: "How Opzix Works for Real Estate | Opzix",
    description:
      "Follow the connected buyer and seller journey inside the Opzix Real Estate Platform.",
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

const buyerJourney = [
  { title: "Visits Website", icon: Home },
  { title: "Searches Homes", icon: Search },
  { title: "AI Answers Questions", icon: Bot },
  { title: "Lead Captured", icon: Users },
  { title: "Appointment Booked", icon: CalendarCheck },
  { title: "Showing Scheduled", icon: CalendarCheck },
  { title: "Offer Submitted", icon: Workflow },
  { title: "Closed", icon: Check },
];

const sellerJourney = [
  "A homeowner visits your website.",
  "They request their home's value.",
  "AI answers their initial questions.",
  "Their information is captured automatically.",
  "Your follow-up begins.",
  "A listing consultation is scheduled.",
  "You stay informed throughout the process.",
];

const platformTools = [
  {
    title: "IDX Property Search",
    copy: "Keep buyers on your website longer with a property search experience that encourages conversations instead of sending them somewhere else.",
    icon: Search,
  },
  {
    title: "AI Assistant",
    copy: "Answer questions instantly, qualify interest, and guide buyers and sellers toward their next step even when you are unavailable.",
    icon: Bot,
  },
  {
    title: "CRM",
    copy: "Keep every conversation, inquiry, appointment, and client organized in one place so nothing falls through the cracks.",
    icon: Users,
  },
  {
    title: "Automated Follow-Up",
    copy: "Stay connected through email, text, reminders, and tasks so prospects hear from you at the right time.",
    icon: Workflow,
  },
  {
    title: "Analytics",
    copy: "See what is working, what is not, and where your next opportunity is coming from.",
    icon: BarChart3,
  },
  {
    title: "Scheduling",
    copy: "Allow buyers and sellers to book appointments directly from your website, eliminating phone tag.",
    icon: CalendarCheck,
  },
];

const liveExperienceSteps = [
  "Explore a real website",
  "Search available homes",
  "Talk with AI",
  "Book an appointment",
  "See the customer journey",
];

const interfacePreviews = [
  {
    title: "AI Conversation",
    eyebrow: "Buyer asks about homes",
    lines: ["Looking for 3 beds near schools", "AI qualifies timing and budget", "Consultation recommended"],
  },
  {
    title: "CRM",
    eyebrow: "Lead organized",
    lines: ["Buyer intent: high", "Source: MLS search", "Next step: call today"],
  },
  {
    title: "Seller Dashboard",
    eyebrow: "Listing opportunity",
    lines: ["Home valuation requested", "Seller timeline: 60 days", "Consultation booked"],
  },
  {
    title: "Analytics",
    eyebrow: "Business visibility",
    lines: ["Top community: Franklin", "Lead source: property search", "Bookings up this week"],
  },
  {
    title: "Listing Dashboard",
    eyebrow: "Property activity",
    lines: ["Saved by 14 buyers", "3 showing requests", "Follow-up queued"],
  },
  {
    title: "Buyer Portal",
    eyebrow: "Client experience",
    lines: ["Saved homes", "Questions answered", "Next showing scheduled"],
  },
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
            How Opzix Works
          </p>
          <h1 className="heading-1">See How One Buyer Becomes a Client.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-secondary md:text-xl">
            Every step happens inside one connected experience designed to help
            you spend less time managing software and more time serving people.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="real_estate_page"
              serviceRequested="Real Estate Operating Platform"
              industry="real_estate"
              eventName="real_estate_strategy_call_clicked"
              eventPayload={{ cta_location: "platform_hero" }}
            >
              Book a Real Estate Strategy Session
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
              Compare Plans
            </TrackedLink>
          </div>
        </div>
      </Section>

      <Section bgColor="primary" id="buyer-journey">
        <VisibilityTracker
          eventName="feature_section_viewed"
          payload={{ section: "buyer_journey", industry: "real_estate" }}
        />
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Buyer Journey
            </p>
            <h2 className="heading-2 mt-4">
              Understand the journey in five seconds.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              One platform. Every conversation. Every opportunity.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {buyerJourney.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-lg border border-dark-border bg-white/[0.035] p-4 text-center"
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-5 text-primary">
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section bgColor="secondary" id="seller-journey">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="grid gap-3 lg:order-1">
            {sellerJourney.map((step, index) => (
              <div
                key={step}
                className="flex gap-4 rounded-lg border border-dark-border bg-white/[0.035] p-4"
              >
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-sm font-bold text-brand-cyan">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-secondary">{step}</p>
              </div>
            ))}
          </div>
          <div className="lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Seller Journey
            </p>
            <h2 className="heading-2 mt-4">
              The same connected journey works for sellers.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Instead of wondering where your next listing will come from, you
              create a system that consistently generates and organizes seller
              opportunities.
            </p>
          </div>
        </div>
      </Section>

      <Section bgColor="primary" id="technology">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Technology That Works for You
          </p>
          <h2 className="heading-2 mt-4">
            The tools matter because they support the journey.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {platformTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <article key={tool.title} className="card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-primary">{tool.title}</h3>
                <p className="mt-3 text-sm leading-6 text-secondary">
                  {tool.copy}
                </p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section bgColor="secondary" id="experience">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Experience the Business You're Building
            </p>
            <h2 className="heading-2 mt-4">
              See what happens when every part of the business works together.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Do not just read about it. Follow how buyers and sellers move
              through the customer journey when the website, AI, CRM,
              scheduling, follow-up, and analytics are connected.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveExperienceSteps.map((item) => (
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

      <Section bgColor="primary" id="product-previews">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Product Preview
          </p>
          <h2 className="heading-2 mt-4">
            See the systems behind the confidence.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {interfacePreviews.map((preview) => (
            <article
              key={preview.title}
              className="overflow-hidden rounded-lg border border-dark-border bg-dark-card shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-center gap-2 border-b border-dark-border bg-white/[0.035] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-cyan" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                  {preview.eyebrow}
                </p>
                <h3 className="mt-2 text-xl font-bold text-primary">
                  {preview.title}
                </h3>
                <div className="mt-5 grid gap-3">
                  {preview.lines.map((line) => (
                    <div
                      key={line}
                      className="rounded-lg border border-dark-border bg-white/[0.035] px-4 py-3 text-sm text-secondary"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section bgColor="primary" id="mls">
        <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
            <Database className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Built for Authorized MLS Experiences
            </p>
            <h2 className="heading-2 mt-4">
              Designed around approved real estate data paths.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Opzix supports authorized IDX property search experiences and
              Brokerage Back Office workflows through MLS Grid. The platform is
              designed to respect MLS rules, licensing requirements, and
              brokerage policies while delivering a modern real estate
              experience.
            </p>
          </div>
        </div>
      </Section>

      <section className="hero-atmosphere py-16 md:py-20">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <h2 className="heading-2">
            Ready to stop managing disconnected software?
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            Book a strategy session or compare plans to choose the right
            platform foundation for your real estate business.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <StrategyCallTrackedButton
              source="real_estate_page"
              serviceRequested="Real Estate Operating Platform"
              industry="real_estate"
              eventName="real_estate_strategy_call_clicked"
              eventPayload={{ cta_location: "platform_final_cta" }}
            >
              Book a Real Estate Strategy Session
            </StrategyCallTrackedButton>
            <TrackedLink
              href="/real-estate/plans"
              eventName="real_estate_plan_preview_clicked"
              payload={{
                cta_location: "platform_final_cta",
                plan_name: "all",
                industry: "real_estate",
              }}
              className="btn btn-secondary sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none"
            >
              Compare Plans
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
