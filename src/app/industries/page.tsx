import Section from "@/components/Section";
import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import ProofBar from "@/components/ProofBar";
import {
  Check,
  ShoppingCart,
  MessageSquare,
  Heart,
  Globe,
  BarChart3,
  Zap,
  ShieldCheck,
} from "lucide-react";

const industries = [
  {
    title: "Ecommerce Brands",
    subtitle:
      "Storefront, checkout, and operations built for real online businesses",
    problems: [
      "Poor product discovery",
      "Low checkout confidence",
      "Fraud and suspicious orders",
      "Shipping and fulfillment complexity",
      "Weak analytics and tracking",
    ],
    solutions: [
      "Increase conversion rates",
      "Improve checkout and order flow",
      "Fix shipping and backend workflows",
      "Fraud workflow thinking",
      "Add tracking and performance visibilit",
      "Backend integrations (ERP, CRM, payments)",
      "Google Ads & conversion tracking",
    ],
    icon: ShoppingCart,
  },
  {
    title: "Coaches & Consultants",
    subtitle: "Websites and lead systems built to capture the right prospects",
    problems: [
      "Weak lead flow",
      "Poor messaging",
      "Low-quality inquiries",
      "No clear conversion path",
    ],
    solutions: [
      "High-converting websites",
      "Landing pages",
      "Lead capture systems",
      "AI chat assistants",
      "Booking & scheduling flows",
    ],
    icon: MessageSquare,
  },
  {
    title: "Care Agencies & Healthcare Services",
    subtitle:
      "Clear service presentation and better client intake for care teams",
    problems: [
      "Confusing services presentation",
      "Poor inquiry flow",
      "Manual booking processes",
      "Lack of structured communication",
    ],
    solutions: [
      "Clear service-based websites",
      "Client intake forms",
      "Booking flow improvements",
      "Automation support",
      "Better user experience for families",
    ],
    icon: Heart,
  },
  {
    title: "Local Service Businesses",
    subtitle: "Websites and systems that turn local demand into reliable leads",
    problems: [
      "Low website conversions",
      "Poor visibility into leads",
      "No tracking",
      "Manual follow-ups",
    ],
    solutions: [
      "Conversion-focused websites",
      "Lead capture systems",
      "Google Ads + tracking",
      "Automation for follow-ups",
    ],
    icon: Globe,
  },
  {
    title: "Professional Services",
    subtitle:
      "Modern positioning, trust, and client flow for growing advisory firms",
    problems: [
      "Outdated websites",
      "Weak positioning",
      "Low trust online",
      "Inconsistent client flow",
    ],
    solutions: [
      "Clean, modern websites",
      "Clear positioning",
      "Conversion-focused structure",
      "Lead capture + CRM connection",
    ],
    icon: BarChart3,
  },
];

const differentiation = [
  {
    title: "Built for real operations",
    description:
      "We understand how businesses actually run — not just how websites look.",
    icon: ShieldCheck,
  },
  {
    title: "Conversion-focused systems",
    description:
      "Everything we build is designed to improve leads, sales, and efficiency.",
    icon: Check,
  },
  {
    title: "Systems, not isolated features",
    description:
      "We connect website, customer journey, and backend systems so work does not break between teams.",
    icon: Zap,
  },
  {
    title: "Clear thinking, simple execution",
    description: "No unnecessary complexity — just solutions that work.",
    icon: MessageSquare,
  },
];

export default function Industries() {
  return (
    <>
      <Section bgColor="secondary" padded={true}>
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="max-w-3xl">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-4">
              Industries
            </p>
            <h1 className="heading-1 mb-6 leading-tight">
              Industries We Help Grow with Better Systems
            </h1>
            <p className="body-lg text-secondary max-w-3xl mb-8">
              We design websites, ecommerce systems, and automation tailored to
              how your business actually operates — not generic templates.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button href="/contact" variant="primary" size="lg">
                Book Free Strategy Call
              </Button>
              <Button href="#overview" variant="secondary" size="lg">
                Explore Industry Focus
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-8 shadow-[0_40px_80px_rgba(0,102,255,0.12)]">
            <div className="rounded-3xl bg-dark-secondary border border-white/10 p-8">
              <p className="text-brand-blue uppercase tracking-[0.3em] text-xs font-semibold mb-4">
                Industry Expertise
              </p>
              <h2 className="heading-3 mb-4">
                Systems for the way your business actually works
              </h2>
              <p className="body-md text-secondary">
                We focus on the specific operational challenges each industry
                faces and build systems that support them from lead to delivery.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Ecommerce operations",
                  "Consultant lead systems",
                  "Care intake journeys",
                  "Local service growth",
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
      <section className="bg-gradient-to-br from-dark-bg via-dark-secondary to-dark-bg py-16">
        <div className="container-wide text-center">
          <h2 className="heading-2 mb-6">Who we typically work with</h2>
          <div className="mt-8 space-y-3">
            {[
              "Service businesses doing $100k–$5M/year",
              "Ecommerce brands looking to scale operations",
              "Teams struggling with manual workflows",
              "Businesses investing in growth, not just design",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Check size={20} className="text-brand-blue mt-1" />
                <p className="body-lg text-secondary">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Section bgColor="primary" padded={true} className="pt-24" id="overview">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="heading-2 mb-6">
              We don’t believe in one-size-fits-all solutions
            </h2>
            <p className="body-lg text-secondary max-w-3xl mx-auto">
              Different businesses have different challenges. A care agency
              doesn’t operate like an ecommerce brand. A sales coach doesn’t
              have the same needs as a local service company. We build systems
              based on how your business actually works.
            </p>
          </div>

          <div className="grid gap-4">
            {industries.map((industry) => (
              <div
                key={industry.title}
                className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8 shadow-xl shadow-black/10"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <industry.icon className="w-10 h-10 text-brand-blue" />
                      <div>
                        <h3 className="heading-4">{industry.title}</h3>
                        <p className="body-sm text-secondary">
                          {industry.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="font-semibold text-white mb-3">
                          What we help with
                        </p>
                        <ul className="space-y-3">
                          {industry.problems.map((problem) => (
                            <li
                              key={problem}
                              className="flex items-start gap-3"
                            >
                              <Check
                                size={18}
                                className="text-brand-blue mt-1"
                              />
                              <span className="body-sm text-secondary">
                                {problem}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-white mb-3">
                          What we help with
                        </p>
                        <ul className="space-y-3">
                          {industry.solutions.map((solution) => (
                            <li
                              key={solution}
                              className="flex items-start gap-3"
                            >
                              <Check
                                size={18}
                                className="text-brand-blue mt-1"
                              />
                              <span className="body-sm text-secondary">
                                {solution}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            href="/solutions/ecommerce"
            className="mt-8 items-center mx-auto"
          >
            View Ecommerce Solutions →
          </Button>
        </div>
      </Section>

      <Section bgColor="secondary" padded={true}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
              Why Opun
            </p>
            <h2 className="heading-2">Why Businesses Choose Opun</h2>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-4">
            {differentiation.map((item) => (
              <div
                key={item.title}
                className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 shadow-lg shadow-black/10"
              >
                <item.icon className="w-10 h-10 text-brand-blue mb-5" />
                <h3 className="heading-4 mb-3 text-white">{item.title}</h3>
                <p className="body-md text-secondary">{item.description}</p>
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

      <CTASection
        headline="Not sure which system your business needs?"
        subheadline="We’ll review your setup and recommend the highest-impact improvements."
        buttonLabel="Book Free Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
