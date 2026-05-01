import HeroSection from "@/components/HeroSection";
import Section from "@/components/Section";
import ServiceCard from "@/components/ServiceCard";
import CTASection from "@/components/CTASection";
import Button from "@/components/Button";
import {
  Globe,
  MessageSquare,
  BarChart3,
  ShoppingCart,
  Zap,
  Settings,
} from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: Globe,
      title: "Website Design & Development",
      description:
        "Custom, high-performance websites designed for conversions. Every site is mobile-responsive, fast-loading, and SEO-optimized to help you rank and capture leads.",
      features: [
        "Responsive mobile-first design",
        "SEO optimization & structured data",
        "Core Web Vitals optimization",
        "CMS integration (if needed)",
        "SSL security & GDPR compliance",
      ],
    },
    {
      icon: ShoppingCart,
      title: "Ecommerce Setup & Optimization",
      description:
        "Complete ecommerce solutions that drive sales. From product catalog to payment processing, inventory management, and fulfillment—we handle it all.",
      features: [
        "Product catalog & inventory",
        "Secure payment processing",
        "Order management system",
        "Cart abandonment recovery",
        "Analytics & reporting",
      ],
    },
    {
      icon: MessageSquare,
      title: "AI Chatbots & Lead Qualification",
      description:
        "AI-powered chatbots that qualify leads, answer FAQs, and book appointments 24/7. They work while you sleep, never missing a potential customer.",
      features: [
        "24/7 availability",
        "Lead qualification",
        "Appointment booking",
        "FAQ automation",
        "Human handoff when needed",
      ],
    },
    {
      icon: BarChart3,
      title: "Google Ads & Conversion Tracking",
      description:
        "Data-driven PPC campaigns that deliver qualified leads. We set up proper tracking, optimize for your goals, and maximize ROI.",
      features: [
        "Campaign strategy & setup",
        "Conversion tracking",
        "A/B testing & optimization",
        "Monthly reporting",
        "Monthly management & optimization",
      ],
    },
    {
      icon: Zap,
      title: "Client Portals & Dashboards",
      description:
        "Custom dashboards where clients can view progress, payments, schedules, and project updates in real-time. Improves transparency and reduces support tickets.",
      features: [
        "Custom client portal",
        "Real-time analytics",
        "Progress tracking",
        "Payment management",
        "Document sharing",
      ],
    },
    {
      icon: Settings,
      title: "Business Integrations & Automation",
      description:
        "Connect your business systems. NetSuite, Zapier, payment processors, email marketing—we integrate and automate workflows to save time and reduce errors.",
      features: [
        "NetSuite integration",
        "Zapier automation",
        "API integrations",
        "Email marketing sync",
        "CRM integration",
      ],
    },
  ];

  return (
    <>
      {/* Hero */}
      <HeroSection
        headline="Our Services"
        subheadline="Complete digital solutions to grow your service business. From websites and automation to AI assistants and integrations."
      />

      {/* Services Details */}
      <Section bgColor="primary">
        <div className="space-y-16">
          {services.map((service, index) => (
            <div
              key={index}
              className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${
                index % 2 === 1 ? "md:grid-flow-dense" : ""
              }`}
            >
              {/* Content */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <service.icon className="w-10 h-10 text-brand-blue flex-shrink-0" />
                  <h3 className="heading-3">{service.title}</h3>
                </div>
                <p className="body-lg text-secondary mb-6">
                  {service.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-brand-blue mt-1">✓</span>
                      <span className="body-md">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button href="/contact">Learn More & Get a Quote</Button>
              </div>

              {/* Image */}
              <div className="bg-dark-secondary rounded-xl h-80 flex items-center justify-center border-2 border-dark-tertiary">
                <service.icon className="w-24 h-24 text-dark-tertiary opacity-50" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Why Choose Us */}
      <Section bgColor="secondary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="heading-2 mb-4">Why Choose Opun?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="card">
              <h4 className="heading-4 mb-3">Conversion-Focused</h4>
              <p className="body-md">
                Every solution is designed to capture leads and drive revenue,
                not just look pretty.
              </p>
            </div>
            <div className="card">
              <h4 className="heading-4 mb-3">End-to-End</h4>
              <p className="body-md">
                From website design to automation and integrations—we handle the
                complete digital ecosystem.
              </p>
            </div>
            <div className="card">
              <h4 className="heading-4 mb-3">Results-Driven</h4>
              <p className="body-md">
                We track metrics, optimize continuously, and prove ROI with data
                and case studies.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <CTASection
        headline="Ready to grow your business?"
        subheadline="Book a free strategy call to discuss which services are right for your business."
        buttonLabel="Book Free Call"
        buttonHref="/contact"
      />
    </>
  );
}
