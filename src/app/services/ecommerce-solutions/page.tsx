import Section from "@/components/Section";
import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import ExperienceProof from "@/components/ExperienceProof";
import {
  ShoppingCart,
  ShieldCheck,
  Truck,
  Zap,
  ServerCog,
  BarChart3,
  CreditCard,
  LayoutGrid,
  Check,
} from "lucide-react";

const problemCards = [
  {
    title: "Poor product discovery",
    description:
      "Product categories, collections, and navigation are disconnected, so shoppers struggle to find the right items quickly.",
  },
  {
    title: "Low checkout confidence",
    description:
      "Checkout flows are unclear, payment options feel restrictive, and shoppers leave before completing the purchase.",
  },
  {
    title: "Fraud and suspicious orders",
    description:
      "Order review and fraud checks are handled manually or inconsistently, creating risk and processing delays.",
  },
  {
    title: "Shipping workflow issues",
    description:
      "Shipping options, fulfillment steps, and delivery communication are not coordinated across the store and operations team.",
  },
  {
    title: "Manual order handling",
    description:
      "Order routing, fulfillment updates, and customer service work are slowed down by manual handoffs and disconnected tools.",
  },
  {
    title: "Weak analytics and tracking",
    description:
      "Marketing and operations lack reliable tracking, making it hard to understand what is actually working.",
  },
];

const coreSolutionCards = [
  {
    icon: LayoutGrid,
    title: "Storefront Development",
    description:
      "Product pages and navigation designed to turn browsers into buyers.",
  },
  {
    icon: CreditCard,
    title: "Checkout Optimization",
    description:
      "A checkout experience that reduces abandonment and keeps customers moving to purchase.",
  },
  {
    icon: ServerCog,
    title: "Backend Integrations",
    description:
      "Payments, inventory, and order systems connected so your store runs automatically.",
  },
];

const supportingSolutionCards = [
  {
    icon: ShoppingCart,
    title: "Product & Collection Structure",
    description:
      "Catalog and filters organized so customers find the right products quickly.",
  },
  {
    icon: ShieldCheck,
    title: "Fraud Prevention Workflows",
    description:
      "Order protection that catches fraud without blocking legitimate shoppers.",
  },
  {
    icon: Truck,
    title: "Shipping & Fulfillment Systems",
    description:
      "Shipping and fulfillment rules aligned to avoid delays and surprise costs.",
  },
  {
    icon: BarChart3,
    title: "Google Ads & Tracking",
    description:
      "Tracking set up so you know which campaigns actually drive sales.",
  },
  {
    icon: Zap,
    title: "Customer Support & AI Assistants",
    description:
      "Automated support that answers shoppers fast and keeps orders moving.",
  },
];

const technologyStack = [
  {
    category: "Ecommerce Platforms",
    tools: ["Shopify", "BigCommerce", "WooCommerce", "Squarespace"],
  },
  {
    category: "Development",
    tools: [
      "React / Next.js",
      "Supabase",
      "Stripe / PayPal",
      "AI chatbot tools",
    ],
  },
  {
    category: "Marketing & Tracking",
    tools: [
      "Google Ads",
      "Google Analytics / Tag Manager",
      "Klaviyo / email marketing",
    ],
  },
  {
    category: "Backend & Automation",
    tools: ["NetSuite knowledge", "Zapier / automation tools"],
  },
];

const processSteps = [
  "Audit the current store and operations",
  "Map customer journey and backend workflow",
  "Build storefront, automation, and integrations",
  "Launch tracking and conversion measurement",
  "Improve based on performance",
];

const packages = [
  {
    title: "Ecommerce Launch",
    description:
      "Build a strong ecommerce foundation with a clean storefront, structured products, and a checkout that converts.",
  },
  {
    title: "Ecommerce Growth",
    description:
      "Improve conversions, tracking, and operations with better visibility, marketing integration, and automation.",
  },
  {
    title: "Ecommerce Systems",
    description:
      "Full ecommerce operations build with integrations, workflows, dashboards, and backend system alignment.",
  },
];

export default function EcommerceSolutions() {
  return (
    <>
      <Section bgColor="secondary" padded={true}>
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="max-w-3xl">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-4">
              Ecommerce Solutions
            </p>
            <h1 className="heading-1 mb-6 leading-tight">
              <span className="block md:inline">
                Ecommerce Systems Built for Real Operations
              </span>
              <span className="block md:hidden">—</span>
              <span className="hidden md:inline"> — </span>
              <span className="block md:inline">Not Just Pretty Stores</span>
            </h1>
            <p className="body-lg text-secondary max-w-3xl mb-8">
              We design and build ecommerce systems that improve how your store
              sells, how orders are handled, and how your operations run
              day-to-day.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/contact" variant="primary" size="lg">
                Book Free Ecommerce Audit
              </Button>
              <Button href="#solutions" variant="secondary" size="lg">
                View What We Build
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-8 shadow-[0_40px_80px_rgba(0,102,255,0.12)]">
            <div className="rounded-3xl bg-dark-secondary border border-white/10 p-8">
              <p className="text-brand-blue uppercase tracking-[0.3em] text-xs font-semibold mb-4">
                Ecommerce Focus
              </p>
              <h2 className="heading-3 mb-4">
                Practical ecommerce work built around real operations.
              </h2>
              <p className="body-md text-secondary">
                From storefront design to shipping and backend systems, our work
                is intended to support the full commerce workflow.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Checkout and payment clarity",
                  "Operational workflow support",
                  "Fraud and order review",
                  "Tracking and measurement",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check size={18} className="text-brand-blue mt-1" />
                    <p className="body-sm text-secondary">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="primary" padded={true}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
              Problem
            </p>
            <h2 className="heading-2">
              Most Ecommerce Problems Are Bigger Than the Website
            </h2>
            <p className="body-lg text-secondary max-w-3xl mx-auto mt-4">
              Most ecommerce problems aren’t design issues — they’re system
              issues. Many stores struggle because product structure, checkout,
              fraud review, shipping, fulfillment, tracking, and backend systems
              are disconnected.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {problemCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8 shadow-xl shadow-black/5"
              >
                <h3 className="heading-4 mb-3 text-white">{card.title}</h3>
                <p className="body-md text-secondary">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        bgColor="secondary"
        padded={true}
        className="pt-20"
        id="solutions"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
              THE SYSTEM
            </p>
            <h2 className="heading-2">
              A System That Fixes What’s Slowing Your Growth
            </h2>
            <p className="body-lg text-secondary max-w-3xl mx-auto mt-4">
              We bring every storefront, checkout, fraud, shipping, integration,
              and tracking layer into one connected ecommerce system — not a set
              of isolated services.
            </p>
          </div>

          <div className="mb-8">
            <div className="mb-6 text-left">
              <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
                Revenue Layer
              </p>
              <p className="body-md text-secondary max-w-3xl">
                The pieces that directly drive orders, conversions, and customer
                confidence.
              </p>
            </div>

            <div className="grid gap-4 xl:gap-6 xl:grid-cols-3">
              {coreSolutionCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 shadow-lg shadow-black/10"
                >
                  <card.icon className="w-10 h-10 text-brand-blue mb-5" />
                  <h3 className="heading-4 mb-3 text-white">{card.title}</h3>
                  <p className="body-md text-secondary">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <div className="mb-6 text-left">
              <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
                Operations Layer
              </p>
              <p className="body-md text-secondary max-w-3xl">
                The systems that keep orders flowing, risks managed, and
                performance visible.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {supportingSolutionCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 shadow-lg shadow-black/10"
                >
                  <card.icon className="w-10 h-10 text-brand-blue mb-5" />
                  <h3 className="heading-4 mb-3 text-white">{card.title}</h3>
                  <p className="body-md text-secondary">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-dark-secondary p-10 text-center">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
              One Connected System
            </p>
            <h3 className="heading-3 mb-4 text-white">
              This Isn’t a Collection of Services — It’s One Connected System
            </h3>
            <p className="body-md text-secondary max-w-3xl mx-auto">
              Every storefront, checkout, shipping, fraud, and tracking layer is
              built to work together so your ecommerce operation scales
              predictably.
            </p>
            <div className="mt-8 inline-flex w-full justify-center sm:w-auto">
              <Button href="/contact" variant="primary" size="lg">
                Book a Free Ecommerce Audit
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <ExperienceProof
        bgColor="primary"
        title="Built From Real Ecommerce Operations Experience"
        description="Most agencies design stores. We build systems around how ecommerce actually operates — orders, fraud, shipping, integrations, and customer journeys."
      />

      <Section bgColor="primary" padded={true}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
            Technology Stack
          </p>
          <h2 className="heading-2 mb-6">Tools & Platforms We Work With</h2>
          <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
            {technologyStack.map((group) => (
              <div
                key={group.category}
                className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 shadow-sm shadow-black/5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,102,255,0.16)]"
              >
                <p className="text-brand-blue uppercase tracking-[0.24em] text-xs font-semibold mb-4">
                  {group.category}
                </p>
                <div className="space-y-3">
                  {group.tools.map((tool) => (
                    <div
                      key={tool}
                      className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition-colors duration-200 hover:border-brand-blue hover:bg-white/10"
                    >
                      <p className="font-medium text-white">{tool}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="primary" padded={true}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
            Process
          </p>
          <h2 className="heading-2 mb-6">How We Build Ecommerce Systems</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {processSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-5 shadow-xl shadow-black/5 text-left"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-white text-base font-semibold">
                  {index + 1}
                </div>
                <p className="font-semibold text-white mb-2">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="primary" padded={true}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
            Packages
          </p>
          <h2 className="heading-2 mb-6">Ecommerce Packages</h2>
          <div className="grid gap-4 md:gap-6 md:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.title}
                className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 shadow-xl shadow-black/5"
              >
                <h3 className="heading-4 mb-4">{pkg.title}</h3>
                <p className="body-md text-secondary">{pkg.description}</p>
              </div>
            ))}
          </div>
          <h3 className="heading-3 text-center mt-16">
            See how this works in real businesses
          </h3>

          <Button href="/case-studies" className=" mt-8">
            View Case Studies
          </Button>
        </div>
      </Section>

      <Section bgColor="secondary" padded={true}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
            Impact
          </p>
          <h2 className="heading-2 mb-6">What This Actually Helps You Do</h2>
          <div className="grid gap-3 sm:gap-4 lg:gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {[
              "Increase checkout completion",
              "Reduce manual order handling",
              "Improve shipping and fulfillment flow",
              "Get clear visibility into performance",
              "Build systems that support growth",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-5 shadow-sm shadow-black/5"
              >
                <p className="font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <CTASection
        headline="See how this works in real businesses?"
        subheadline="Let’s review your storefront, checkout flow, operations, and tracking — then map the highest-impact improvements."
        buttonLabel="Book Free Ecommerce Audit"
        buttonHref="/contact"
      />
    </>
  );
}
