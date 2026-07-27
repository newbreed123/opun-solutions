import HeroSection from "@/components/HeroSection";
import Section from "@/components/Section";
import CTASection from "@/components/CTASection";

export default function About() {
  return (
    <>
      {/* Hero */}
      <HeroSection
        headline="About Opzix Solutions"
        subheadline="Opzix builds AI-powered business platforms that connect customer experience, automation, analytics, integrations, and operational workflows."
      />

      {/* Our Story */}
      <Section bgColor="primary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-8">Our Story</h2>
          <div className="space-y-6 text-secondary body-lg">
            <p>
              Opzix Solutions was founded on a simple observation: most service
              businesses are leaving money on the table because their customer
              journey, follow-up, analytics, and operations are disconnected.
            </p>
            <p>
              Opzix focuses on the platform behind growth: customer experience,
              AI, automation, analytics, integrations, dashboards, and the
              workflows that help teams respond faster and operate with more
              visibility.
            </p>
            <p>
              Today, that platform thinking can support ecommerce brands,
              service businesses, real estate professionals, and future
              industries with customer journeys shaped around their market.
            </p>
            <p>
              Our approach is simple: understand your business, identify the
              biggest friction points, and build solutions that actually drive
              revenue. We do not build disconnected deliverables. We build
              systems that move the business forward.
            </p>
          </div>
        </div>
      </Section>

      {/* Mission & Values */}
      <Section bgColor="secondary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Mission */}
          <div>
            <h3 className="heading-3 mb-4">Our Mission</h3>
            <p className="body-lg text-secondary">
              To empower businesses with the platform systems and expertise they
              need to grow faster, capture more leads, and scale with
              confidence.
            </p>
          </div>

          {/* Values */}
          <div>
            <h3 className="heading-3 mb-6">Our Values</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-brand-blue font-bold text-lg">→</span>
                <div>
                  <h4 className="font-semibold mb-1">Results Over Ego</h4>
                  <p className="body-sm text-secondary">
                    We optimize for your business goals, not our preferences.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-blue font-bold text-lg">→</span>
                <div>
                  <h4 className="font-semibold mb-1">Transparency</h4>
                  <p className="body-sm text-secondary">
                    Clear communication, honest feedback, and data-driven
                    decisions.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-blue font-bold text-lg">→</span>
                <div>
                  <h4 className="font-semibold mb-1">Continuous Improvement</h4>
                  <p className="body-sm text-secondary">
                    We test, learn, and optimize every system we build.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Expertise */}
      <Section bgColor="primary">
        <h2 className="heading-2 text-center mb-12">Our Expertise</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[
            "Customer Experience Platforms",
            "Ecommerce Platforms",
            "AI Chatbots & Lead Generation",
            "Google Ads & PPC",
            "Business Automation",
            "API Integrations",
            "NetSuite Integration",
            "Client Dashboards",
            "Payment Processing",
            "SEO & Conversion Optimization",
            "Email Marketing",
            "Analytics & Reporting",
          ].map((expertise, index) => (
            <div
              key={index}
              className="card flex items-center justify-center text-center p-8"
            >
              <p className="font-semibold text-lg">{expertise}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <CTASection
        headline="Let's work together"
        subheadline="Whether you need AI, automation, analytics, integrations, customer experience improvements, or a connected platform roadmap, we're here to help."
        buttonLabel="Get In Touch"
        buttonHref="/contact"
      />
    </>
  );
}
