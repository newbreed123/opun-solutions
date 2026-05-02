import HeroSection from "@/components/HeroSection";
import Section from "@/components/Section";
import CTASection from "@/components/CTASection";

export default function About() {
  return (
    <>
      {/* Hero */}
      <HeroSection
        headline="About Opun Solutions"
        subheadline="We help local service businesses grow by building websites, AI systems, and automations that actually work."
      />

      {/* Our Story */}
      <Section bgColor="primary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-8">Our Story</h2>
          <div className="space-y-6 text-secondary body-lg">
            <p>
              Opun Solutions was founded on a simple observation: most service
              businesses are leaving money on the table. Their websites don't
              convert, they're drowning in manual work, and they're missing the
              tools that would let them scale.
            </p>
            <p>
              We started by helping a handful of local businesses build better
              digital presence. We'd create a website, add an AI chatbot, set up
              some automations, and watch their business grow. What started as
              side projects became our mission.
            </p>
            <p>
              Today, we work with dozens of service businesses—from sales
              coaches to care agencies to ecommerce operators—helping them
              capture more leads, convert them faster, and scale without chaos.
            </p>
            <p>
              Our approach is simple: understand your business, identify the
              biggest friction points, and build solutions that actually drive
              revenue. We don't do vanity projects. We do results.
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
              To empower local service businesses with the digital tools,
              systems, and expertise they need to grow faster, capture more
              leads, and scale with confidence.
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
            "Website Design & Development",
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
        subheadline="Whether you need a new website, AI automation, or a complete digital overhaul, we're here to help."
        buttonLabel="Get In Touch"
        buttonHref="/contact"
      />
    </>
  );
}
