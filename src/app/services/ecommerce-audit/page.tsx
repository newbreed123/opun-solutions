import Section from "@/components/Section";
import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import ProofBar from "@/components/ProofBar";
import {
  Search,
  ShoppingCart,
  ShieldCheck,
  Truck,
  BarChart3,
  Check,
  Target,
  X,
} from "lucide-react";

const painPoints = [
  "Customers abandon before checkout",
  "Checkout feels unclear or untrustworthy",
  "Orders require too much manual work",
  "Fraud review slows down legitimate orders",
  "Shipping and fulfillment are disconnected",
  "Ads and analytics don't clearly show what's working",
];

const auditCards = [
  {
    icon: ShoppingCart,
    title: "Website & Storefront Review",
    description:
      "We check product pages, navigation, and collection structure to ensure customers can find and buy what they need without friction.",
  },
  {
    icon: Target,
    title: "Checkout Flow Review",
    description:
      "We analyze your checkout experience, payment options, and trust signals to identify why customers might abandon at the final step.",
  },
  {
    icon: Search,
    title: "Product & Collection Structure",
    description:
      "We review how products are organized, filtered, and presented to ensure customers can discover items efficiently.",
  },
  {
    icon: ShieldCheck,
    title: "Fraud / Order Validation Review",
    description:
      "We examine your order validation and fraud prevention processes to ensure they protect revenue without blocking legitimate customers.",
  },
  {
    icon: Truck,
    title: "Shipping & Fulfillment Workflow Review",
    description:
      "We assess shipping options, carrier setup, and fulfillment coordination to eliminate delays and unexpected costs.",
  },
  {
    icon: BarChart3,
    title: "Tracking & Backend Systems Review",
    description:
      "We check analytics setup, ad tracking, and backend integrations to ensure you have clear visibility into what's working.",
  },
];

const walkAway = [
  "Exactly where your store is losing revenue",
  "What’s slowing down your operations",
  "Tracking and visibility gaps",
  "What to fix first, in order of impact",
  "A clear path to improving conversions and efficiency",
];

const whoThisIsFor = [
  "You run an ecommerce store but conversions feel inconsistent",
  "Your checkout or product flow needs improvement",
  "You deal with fraud or suspicious orders",
  "Shipping and fulfillment feel messy",
  "You're running ads but tracking is unclear",
  "Your tools and backend workflows feel disconnected",
];

const notForYou = [
  "You only want a basic website with no strategy",
  "You are looking for the cheapest possible option",
  "You are not ready to improve your systems or operations",
];

const processSteps = [
  {
    step: "1",
    title: "Book the audit call",
    description:
      "Schedule a 30-minute call. No pressure. No obligation. Just a clear walkthrough of your store.",
  },
  {
    step: "2",
    title: "We review your store and workflow",
    description:
      "We examine your storefront, checkout, operations, tracking, and backend systems.",
  },
  {
    step: "3",
    title: "We identify the highest-impact issues",
    description: "We pinpoint the specific problems slowing your growth.",
  },
  {
    step: "4",
    title: "You get a practical improvement roadmap",
    description: "Receive actionable recommendations to fix what matters most.",
  },
];

export default function EcommerceAudit() {
  return (
    <>
      {/* Hero Section */}
      <Section bgColor="secondary" padded>
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="max-w-3xl">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-4">
              Free Ecommerce Systems Audit
            </p>

            <h1 className="heading-1 mb-6 leading-tight">
              Find What&apos;s Leaking Revenue in Your Ecommerce Business
            </h1>

            <p className="body-lg text-secondary max-w-3xl mb-8">
              We&apos;ll review your storefront, checkout flow, tracking, order
              process, fraud review, shipping workflow, and backend systems —
              then show you the highest-impact fixes.
            </p>

            <div className="space-y-3 mb-8">
              {[
                "Built for real ecommerce operations",
                "Focused on conversion and workflow improvements",
                "Practical recommendations, not generic advice",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Check size={20} className="text-brand-blue flex-shrink-0" />
                  <span className="body-md">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-start gap-3">
              <Button href="/contact" variant="primary" size="lg">
                Book Your Free Ecommerce Audit
              </Button>

              <p className="body-sm text-muted">
                Get a clear breakdown of what&apos;s slowing your growth.
              </p>

              <p className="body-sm text-brand-blue font-semibold">
                Limited audit spots each week — we only take a few businesses at
                a time.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-8 shadow-[0_40px_80px_rgba(0,102,255,0.12)]">
            <div className="rounded-3xl bg-dark-secondary border border-white/10 p-8">
              <h2 className="heading-3 mb-6 text-white">What We Review</h2>

              <div className="space-y-4">
                {[
                  "Storefront and product flow",
                  "Checkout experience",
                  "Fraud and order review process",
                  "Shipping and fulfillment workflow",
                  "Tracking and analytics",
                  "Backend tools and integrations",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check
                      size={18}
                      className="text-brand-blue mt-1 flex-shrink-0"
                    />
                    <p className="body-sm text-secondary">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Pain Section */}
      <Section bgColor="primary" padded>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="heading-2">
              Your Store May Be Losing Revenue in Places You Can&apos;t See
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {painPoints.map((pain) => (
              <div
                key={pain}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8 shadow-xl shadow-black/5"
              >
                <p className="body-md text-secondary">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Audit Breakdown */}
      <Section bgColor="secondary" padded>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="heading-2">What&apos;s Included in the Audit</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {auditCards.map((card) => (
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

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-dark-bg p-8 text-center">
            <h3 className="heading-3 mb-4">
              Want to see how this applies to your store?
            </h3>
            <p className="body-md text-secondary mb-6">
              We&apos;ll review your current setup and show you what to fix
              first.
            </p>
            <Button href="/contact" variant="primary" size="lg">
              Book Your Free Ecommerce Audit
            </Button>
          </div>
        </div>
      </Section>

      {/* Why Opun */}
      <Section
        bgColor="primary"
        padded
        className="bg-gradient-to-br from-dark-bg via-dark-secondary to-dark-bg"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
            <div>
              <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
                Why This Audit Is Different
              </p>
              <h2 className="heading-2 mb-6">
                Most audits only look at design. We look at how the entire
                ecommerce system works.
              </h2>
              <p className="body-lg text-secondary">
                From the first click to checkout, order handling, shipping,
                tracking, and backend coordination — we look at the full system,
                not just the surface.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8 shadow-[0_40px_80px_rgba(0,102,255,0.08)]">
              <ul className="space-y-5">
                {[
                  "We understand ecommerce operations",
                  "We look beyond visuals",
                  "We focus on practical fixes",
                  "We connect marketing, storefront, and operations",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check size={18} className="text-brand-blue mt-1" />
                    <span className="text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Outcomes */}
      <Section bgColor="secondary" padded>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="heading-2 mb-4">
            Real Outcomes These Fixes Can Support
          </h2>
          <p className="body-lg text-secondary max-w-3xl mx-auto mb-10">
            The audit is designed to uncover opportunities that can improve how
            your store converts, operates, and scales.
          </p>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Cleaner checkout experience",
              "Reduced manual order handling",
              "Better visibility into performance",
              "Stronger ecommerce growth foundation",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[2rem] border border-white/10 bg-dark-bg p-8"
              >
                <p className="body-md text-white font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* What You Get */}
      <Section bgColor="primary" padded>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="heading-2 mb-10">What You&apos;ll Walk Away With</h2>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {walkAway.map((item) => (
              <div
                key={item}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8 shadow-lg shadow-black/10"
              >
                <p className="body-md text-white font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Who This Is For */}
      <Section bgColor="secondary" padded>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="heading-2">This Audit Is For You If...</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {whoThisIsFor.map((item) => (
              <div
                key={item}
                className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 shadow-xl shadow-black/5"
              >
                <p className="body-md text-secondary">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-dark-secondary p-8">
            <h3 className="heading-3 mb-6 text-center">
              This Is Not For You If
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              {notForYou.map((item) => (
                <div key={item} className="flex gap-3">
                  <X size={18} className="text-brand-blue mt-1 flex-shrink-0" />
                  <p className="body-md text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Process */}
      <Section bgColor="primary" padded>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="heading-2 mb-10">How It Works</h2>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8 shadow-lg shadow-black/10"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-white text-lg font-semibold">
                  {step.step}
                </div>
                <h3 className="heading-4 mb-3 text-white">{step.title}</h3>
                <p className="body-md text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <section className="bg-dark-bg py-12 md:py-16 border-t border-dark-tertiary">
        <div className="container-wide">
          <ProofBar />
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        headline="Ready to See Exactly What’s Holding Your Store Back?"
        subheadline="We’ll show you what’s broken — and what to fix first."
        buttonLabel="Book Your Free Ecommerce Audit"
        buttonHref="/contact"
      />
    </>
  );
}
