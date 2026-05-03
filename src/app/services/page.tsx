import Section from "@/components/Section";
import CTASection from "@/components/CTASection";
import Button from "@/components/Button";
import ProcessProof from "@/components/ProcessProof";
import {
  Globe,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Zap,
  Settings,
  Check,
} from "lucide-react";

const coreServices = [
  {
    icon: Globe,
    title: "Website Design & Development",
    description:
      "High-converting websites built for service businesses and ecommerce brands. Every experience is fast, polished, and conversion-focused.",
    bullets: [
      "Landing pages optimized for lead capture",
      "Responsive mobile-first design",
      "SEO fundamentals and performance",
      "Content editing and launch support",
    ],
  },
  {
    icon: ShoppingCart,
    title: "Ecommerce Development & Operations",
    description:
      "Ecommerce systems designed for real operations — from product catalogs and checkout flows to inventory, shipping, and fulfillment.",
    bullets: [
      "Storefront development and product structure",
      "Checkout optimization and payments",
      "Order and fulfillment workflows",
      "Inventory and backend coordination",
    ],
  },
  {
    icon: MessageSquare,
    title: "AI Chatbots & Lead Capture",
    description:
      "AI assistants that qualify prospects, answer questions, and book sales conversations automatically — so you never miss a lead.",
    bullets: [
      "Lead capture and qualification",
      "Appointment and follow-up automation",
      "FAQ and contact handling",
      "Human handoff when needed",
    ],
  },
  {
    icon: BarChart3,
    title: "Google Ads & Conversion Tracking",
    description:
      "Proper tracking and campaign setup so your marketing spend can be measured, optimized, and tied back to business outcomes.",
    bullets: [
      "Ad campaign setup and auditing",
      "Conversion tracking and analytics",
      "Attribution for ads and revenue",
      "Optimization for better ROI",
    ],
  },
  {
    icon: Zap,
    title: "Client Portals & Dashboards",
    description:
      "Custom portals that give your clients visibility into projects, results, invoices, and progress without manual updates.",
    bullets: [
      "Client access to project status",
      "Performance dashboards",
      "Document and payment management",
      "Automated progress notifications",
    ],
  },
  {
    icon: Settings,
    title: "Business Integrations",
    description:
      "We connect your tools, systems, and workflows so data flows where it needs to and your team can move faster.",
    bullets: [
      "NetSuite and ERP connections",
      "Zapier and automation workflows",
      "Payment, CRM, and email sync",
      "Custom API integrations",
    ],
  },
];

export default function Services() {
  return (
    <>
      {/* Hero */}
      <Section bgColor="secondary" padded={true}>
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[1.25fr_0.95fr] items-center">
          <div className="max-w-3xl">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-4">
              Services
            </p>
            <h1 className="heading-1 mb-6 leading-tight">
              Services Built to Help Your Business Grow Online
            </h1>
            <p className="body-lg text-secondary max-w-3xl mb-8">
              From high-converting websites and ecommerce systems to AI
              assistants, automation, and backend integrations — we build
              digital systems that help businesses capture leads, sell online,
              and operate with confidence.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/contact" variant="primary" size="lg">
                Book Free Strategy Call
              </Button>
              <Button href="#packages" variant="secondary" size="lg">
                View Packages
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-8 shadow-[0_40px_80px_rgba(0,102,255,0.12)]">
            <div className="rounded-3xl bg-dark-secondary border border-white/10 p-8">
              <p className="text-brand-blue uppercase tracking-[0.3em] text-xs font-semibold mb-4">
                Business Systems
              </p>
              <h2 className="heading-3 mb-4">
                Built for service brands and ecommerce teams
              </h2>
              <p className="body-md text-secondary">
                A modern digital operations stack combining website, ecommerce,
                AI, analytics, and backend automation.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Website systems",
                  "Ecommerce operations",
                  "AI lead capture",
                  "Backend integrations",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check size={18} className="text-brand-blue mt-1" />
                    <p className="body-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Core Services Grid */}
      <Section bgColor="primary" padded={true}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
              Core Services
            </p>
            <h2 className="heading-2">
              Digital Systems Built to Capture Leads, Sell Online, and Scale
              Operations
            </h2>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {coreServices.map((service) => (
              <div
                key={service.title}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8 shadow-xl shadow-black/10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <service.icon className="w-10 h-10 text-brand-blue" />
                  <h3 className="heading-4">{service.title}</h3>
                </div>
                <p className="body-md text-secondary mb-6">
                  {service.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {service.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <Check size={18} className="text-brand-blue mt-1" />
                      <span className="body-sm">{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Button href="/contact" variant="ghost" size="sm">
                  Learn More
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Featured Ecommerce Section */}
      <Section bgColor="secondary" padded={true}>
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
          <div className="max-w-2xl">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
              Ecommerce Experience
            </p>
            <h2 className="heading-2 mb-6">
              Ecommerce Systems Built From Real Operational Experience
            </h2>
            <p className="body-lg text-secondary mb-8">
              We understand ecommerce beyond the storefront. From product
              catalogs and checkout flows to fraud prevention, shipping
              workflows, NetSuite knowledge, and backend operations, we build
              ecommerce systems that are designed to support real growth.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Storefront development",
                "Product and collection structure",
                "Checkout optimization",
                "Fraud prevention workflows",
                "Shipping and fulfillment setup",
                "NetSuite/backend integration guidance",
                "Google Ads and conversion tracking",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check size={18} className="text-brand-blue mt-1" />
                  <p className="body-sm text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-8 shadow-[0_40px_80px_rgba(0,102,255,0.12)]">
            <div className="rounded-3xl bg-dark-secondary border border-white/10 p-8">
              <p className="text-brand-blue uppercase tracking-[0.3em] text-xs font-semibold mb-4">
                Ecommerce Operations Stack
              </p>
              <h3 className="heading-3 mb-4">
                A modern operational layer for commerce teams
              </h3>
              <div className="space-y-4">
                <div className="rounded-3xl bg-dark-bg p-4 border border-white/10">
                  <p className="font-semibold text-primary mb-2">
                    Catalog & Product Strategy
                  </p>
                  <p className="body-sm text-secondary">
                    Organize products and collections for easier discovery and
                    higher conversion.
                  </p>
                </div>
                <div className="rounded-3xl bg-dark-bg p-4 border border-white/10">
                  <p className="font-semibold text-primary mb-2">
                    Checkout & Fraud Controls
                  </p>
                  <p className="body-sm text-secondary">
                    Reduce abandoned carts with streamlined checkout and
                    built-in fraud workflows.
                  </p>
                </div>
                <div className="rounded-3xl bg-dark-bg p-4 border border-white/10">
                  <p className="font-semibold text-primary mb-2">
                    Operations & Integrations
                  </p>
                  <p className="body-sm text-secondary">
                    Tie your storefront into shipping, ERP, payment, and
                    analytics systems.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Process Section */}
      <Section bgColor="primary" padded={true}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
              How We Work
            </p>
            <h2 className="heading-2">
              A clear process for building systems that perform
            </h2>
          </div>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Audit & Strategy",
                description:
                  "We review your current website, customer journey, and operations to identify the highest-impact improvements.",
              },
              {
                title: "Build the System",
                description:
                  "We design and develop the website, ecommerce workflows, AI tools, and integrations needed for consistent growth.",
              },
              {
                title: "Launch & Track",
                description:
                  "We launch with measurement in place so you can see results and understand what is driving performance.",
              },
              {
                title: "Improve & Scale",
                description:
                  "We keep refining the system, improve conversions, and add automation as your business grows.",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue font-semibold mb-4">
                  {index + 1}
                </div>
                <h3 className="heading-4 mb-3">{step.title}</h3>
                <p className="body-sm text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Packages Section */}
      <Section bgColor="secondary" padded={true}>
        <div className="max-w-6xl mx-auto" id="packages">
          <div className="mb-10 text-center">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
              Packages
            </p>
            <h2 className="heading-2">
              Select the system that fits your growth stage
            </h2>
          </div>
          <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
            {[
              {
                name: "Launch",
                description:
                  "Best for businesses that need a professional website and lead capture foundation.",
                features: [
                  "Website build",
                  "Contact forms",
                  "Basic SEO setup",
                  "Mobile optimization",
                  "Analytics setup",
                ],
              },
              {
                name: "Growth System",
                description:
                  "Best for businesses ready to add automation, AI chat, and conversion tracking.",
                features: [
                  "Everything in Launch",
                  "AI chatbot setup",
                  "Lead capture automation",
                  "Google Ads tracking",
                  "Email follow-up setup",
                ],
              },
              {
                name: "Custom Systems",
                description:
                  "Best for ecommerce brands and businesses that need dashboards, integrations, or backend workflows.",
                features: [
                  "Everything in Growth",
                  "Client portal or dashboard",
                  "Ecommerce operations support",
                  "Backend integrations",
                  "Workflow automation",
                ],
              },
            ].map((packageItem) => (
              <div
                key={packageItem.name}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8"
              >
                <h3 className="heading-3 mb-4">{packageItem.name}</h3>
                <p className="body-md text-secondary mb-6">
                  {packageItem.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {packageItem.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check size={18} className="text-brand-blue mt-1" />
                      <span className="body-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button href="/contact" variant="secondary" size="sm">
                  Explore {packageItem.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <ProcessProof />

      {/* Final CTA */}
      <CTASection
        headline="Ready to build a system that grows with your business?"
        subheadline="Let’s review your current website, customer journey, and operations — then map the fastest path to more leads, better systems, and stronger growth."
        buttonLabel="Book Free Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
