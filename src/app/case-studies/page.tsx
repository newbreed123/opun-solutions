import Section from "@/components/Section";
import CaseStudyCard from "@/components/CaseStudyCard";
import CTASection from "@/components/CTASection";
import ProjectProofGrid from "@/components/ProjectProofGrid";

export default function CaseStudies() {
  return (
    <>
      {/* Hero */}
      <Section bgColor="secondary" padded>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-blue text-sm font-semibold uppercase tracking-[0.25em] mb-4">
            Case Studies
          </p>

          <h1 className="heading-1 mb-6">Case Studies & Project Work</h1>

          <p className="body-lg text-secondary max-w-3xl mx-auto">
            Examples of how we improve websites, ecommerce operations, customer
            journeys, and business systems through practical, conversion-focused
            solutions.
          </p>
        </div>
      </Section>

      {/* Featured Case Study */}
      <Section bgColor="primary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-blue text-sm font-semibold uppercase tracking-[0.25em] mb-4">
              Featured Project
            </p>

            <h2 className="heading-2 mb-4">
              Ecommerce Operations & Website Optimization
            </h2>

            <p className="body-lg text-secondary max-w-3xl mx-auto">
              Improving the customer journey, checkout experience, order flow,
              and backend operations for an online business.
            </p>
          </div>

          <div className="bg-dark-secondary border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Left */}
              <div>
                <p className="text-brand-blue text-sm font-semibold uppercase tracking-wide mb-3">
                  Ecommerce Operations Case Study
                </p>

                <h3 className="heading-3 mb-5">
                  Building a stronger foundation for ecommerce growth
                </h3>

                <p className="text-secondary mb-8">
                  The business needed more than a visual website update. The
                  customer journey, checkout process, order handling, fraud
                  review, shipping workflow, and backend operations all needed
                  to work together more smoothly.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="heading-4 mb-3 text-brand-blue">
                      What We Improved
                    </h4>

                    <ul className="space-y-2 text-secondary">
                      <li>✓ Website structure and product flow</li>
                      <li>✓ Checkout and conversion path</li>
                      <li>✓ Fraud review and order validation process</li>
                      <li>✓ Shipping and fulfillment workflow</li>
                      <li>✓ Backend system coordination</li>
                      <li>✓ Google Ads and conversion tracking visibility</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="heading-4 mb-3 text-brand-blue">
                      Business Impact
                    </h4>

                    <ul className="space-y-2 text-secondary">
                      <li>✓ Cleaner customer journey</li>
                      <li>✓ Better operational visibility</li>
                      <li>✓ Reduced manual friction</li>
                      <li>✓ Stronger foundation for ecommerce growth</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="bg-dark-primary border border-white/10 rounded-2xl p-6">
                <img
                  src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&h=650&fit=crop"
                  alt="Laptop showing code for ecommerce optimization project"
                  className="rounded-xl w-full h-[320px] object-cover mb-6"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-dark-secondary rounded-xl p-4 border border-white/10">
                    <p className="font-semibold mb-1">Customer Journey</p>
                    <p className="text-secondary text-sm">
                      Clearer path from product discovery to checkout.
                    </p>
                  </div>

                  <div className="bg-dark-secondary rounded-xl p-4 border border-white/10">
                    <p className="font-semibold mb-1">Operations</p>
                    <p className="text-secondary text-sm">
                      Better workflows for orders, shipping, and tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Project Examples */}
      <Section bgColor="primary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-blue text-sm font-semibold uppercase tracking-[0.25em] mb-4">
              Project Examples
            </p>

            <h2 className="heading-2 mb-4">Practical Work Across Industries</h2>

            <p className="body-lg text-secondary max-w-3xl mx-auto">
              Different businesses have different problems. Our focus is always
              the same: improve the digital experience and make the business
              easier to run.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <CaseStudyCard
              image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
              industry="Professional Services"
              headline="Sales Coach Website & Lead Flow"
              result="Improved website structure, messaging, and lead capture path to support stronger client inquiries."
              href="/case-studies/sales-coach"
            />

            <CaseStudyCard
              image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop"
              industry="Care Services"
              headline="Care Agency Website & Client Journey"
              result="Improved service presentation, contact flow, and client inquiry structure for a care-focused business."
              href="/case-studies/care-agency"
            />

            <CaseStudyCard
              image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop"
              industry="Ecommerce"
              headline="Ecommerce Systems & Operations"
              result="Supported improvements across checkout flow, fraud prevention thinking, shipping workflows, and backend systems."
              href="/case-studies/ecommerce-ops"
            />
          </div>
        </div>
      </Section>

      {/* Process */}
      <Section bgColor="secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-blue text-sm font-semibold uppercase tracking-[0.25em] mb-4">
              Our Approach
            </p>

            <h2 className="heading-2 mb-4">How We Approach Projects</h2>

            <p className="body-lg text-secondary max-w-3xl mx-auto">
              We start by understanding how your business actually works, then
              build systems that support your customer journey and operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                number: "1",
                title: "Understand the Business",
                description:
                  "We learn your operations, customers, pain points, and current systems.",
              },
              {
                number: "2",
                title: "Map the Journey",
                description:
                  "We identify where customers get stuck and where leads or sales are lost.",
              },
              {
                number: "3",
                title: "Build the System",
                description:
                  "We create websites, automation, dashboards, or integrations that solve the real problem.",
              },
              {
                number: "4",
                title: "Improve After Launch",
                description:
                  "We refine based on performance, feedback, and real business use.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="bg-dark-primary border border-white/10 rounded-2xl p-6"
              >
                <div className="w-12 h-12 bg-brand-blue rounded-full flex items-center justify-center mb-5">
                  <span className="text-lg font-bold text-white">
                    {step.number}
                  </span>
                </div>

                <h3 className="heading-4 mb-3">{step.title}</h3>

                <p className="text-secondary text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <ProjectProofGrid />

      {/* CTA */}
      <CTASection
        headline="Want to improve your website, ecommerce flow, or business systems?"
        subheadline="Let’s review your current customer journey and identify the highest-impact improvements."
        buttonLabel="Book Free Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
