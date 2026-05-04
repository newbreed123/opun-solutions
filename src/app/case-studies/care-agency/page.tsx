import Section from "@/components/Section";
import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import Image from "next/image";

export default function CareAgencyCaseStudy() {
  return (
    <>
      {/* Hero */}
      <section className="relative w-full bg-dark-secondary py-16 md:py-24">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="heading-1 mb-6">
                Build a Client Acquisition System That Works for Care Agencies
              </h1>
              <p className="body-lg text-secondary mb-8">
                Stop losing potential clients to poor online experiences and
                manual processes. Create a systematic approach that turns
                inquiries into bookings consistently.
              </p>
              <Button href="/contact" size="lg">
                Start Your Project
              </Button>
            </div>
            <div className="relative w-full h-96 rounded-xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop"
                alt="Care Agency Client Acquisition"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <Section bgColor="primary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-6">
            The Common Challenges Care Agencies Face
          </h2>
          <div className="space-y-4">
            <ul className="space-y-3 body-lg text-secondary">
              <li className="flex items-start">
                <span className="text-brand-blue mr-3">•</span>
                Families calling during business hours only, missing
                opportunities outside normal hours
              </li>
              <li className="flex items-start">
                <span className="text-brand-blue mr-3">•</span>
                Manual processes for handling inquiries, leading to delays and
                lost information
              </li>
              <li className="flex items-start">
                <span className="text-brand-blue mr-3">•</span>
                No clear way for potential clients to understand services or get
                started
              </li>
              <li className="flex items-start">
                <span className="text-brand-blue mr-3">•</span>
                Website that doesn't convert visitors into leads
              </li>
              <li className="flex items-start">
                <span className="text-brand-blue mr-3">•</span>
                Difficulty building trust with families who are making important
                decisions
              </li>
              <li className="flex items-start">
                <span className="text-brand-blue mr-3">•</span>
                Administrative burden that prevents focusing on actual care
                delivery
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Reframe Section */}
      <Section bgColor="secondary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-6">
            The Real Issue: Lack of a Client Acquisition System
          </h2>
          <div className="space-y-4 body-lg text-secondary">
            <p>
              These challenges aren't just operational problems—they're symptoms
              of a fundamental gap: most care agencies don't have a systematic
              approach to client acquisition. Without a structured system, every
              new client comes from luck or personal connections rather than
              predictable processes.
            </p>
            <p>
              The result is inconsistent growth, wasted marketing spend, and
              constant firefighting instead of strategic development. Families
              deserve better ways to find care, and agencies deserve systems
              that work even when they're busy with clients.
            </p>
          </div>
        </div>
      </Section>

      {/* Solution Sections */}
      <Section bgColor="primary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-8">
            Building a Complete Client Acquisition System
          </h2>

          <div className="space-y-12">
            <div>
              <h3 className="heading-3 mb-4 text-brand-blue">
                Website & Messaging
              </h3>
              <p className="body-lg text-secondary mb-4">
                Create a website that clearly communicates your value and makes
                it easy for families to understand your services.
              </p>
              <ul className="space-y-2 ml-4 body-md text-secondary">
                <li>
                  • Service pages that address specific family needs and
                  concerns
                </li>
                <li>
                  • Clear pricing and what's included in each service level
                </li>
                <li>• Professional presentation that builds credibility</li>
                <li>
                  • Mobile-optimized design for families searching on phones
                </li>
              </ul>
            </div>

            <div>
              <h3 className="heading-3 mb-4 text-brand-blue">Inquiry Flow</h3>
              <p className="body-lg text-secondary mb-4">
                Design a smooth process from initial interest to consultation
                booking.
              </p>
              <ul className="space-y-2 ml-4 body-md text-secondary">
                <li>
                  • Multiple contact options (phone, email, web form, chat)
                </li>
                <li>
                  • Automated responses that acknowledge inquiries immediately
                </li>
                <li>• Simple qualification questions to understand needs</li>
                <li>• Clear next steps and timelines for families</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-3 mb-4 text-brand-blue">Lead Capture</h3>
              <p className="body-lg text-secondary mb-4">
                Ensure no potential client falls through the cracks.
              </p>
              <ul className="space-y-2 ml-4 body-md text-secondary">
                <li>• Web forms that capture essential information</li>
                <li>• Integration with your existing systems</li>
                <li>• Follow-up sequences for incomplete inquiries</li>
                <li>
                  • Organization that makes it easy to prioritize hot leads
                </li>
              </ul>
            </div>

            <div>
              <h3 className="heading-3 mb-4 text-brand-blue">
                UX Improvements
              </h3>
              <p className="body-lg text-secondary mb-4">
                Make every interaction smooth and professional.
              </p>
              <ul className="space-y-2 ml-4 body-md text-secondary">
                <li>• Fast-loading pages that work on all devices</li>
                <li>• Clear navigation and calls-to-action</li>
                <li>• Consistent branding and professional design</li>
                <li>• Accessibility considerations for all family members</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-3 mb-4 text-brand-blue">Trust Building</h3>
              <p className="body-lg text-secondary mb-4">
                Help families feel confident in their choice.
              </p>
              <ul className="space-y-2 ml-4 body-md text-secondary">
                <li>
                  • Clear information about your experience and qualifications
                </li>
                <li>• Transparent processes and what to expect</li>
                <li>• Professional presentation of your team and values</li>
                <li>• Easy ways to learn more before committing</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Results Section */}
      <Section bgColor="secondary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-6">
            Real Improvements Care Agencies Experience
          </h2>
          <div className="space-y-6 body-lg text-secondary">
            <p>
              When care agencies implement systematic client acquisition, they
              see meaningful improvements in how they operate and grow. The
              changes are practical and sustainable.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-dark-bg rounded-lg">
                <h4 className="heading-4 mb-3 text-primary">
                  Operational Efficiency
                </h4>
                <p>
                  Administrative staff can focus on client care rather than
                  constantly managing inquiries. Processes become repeatable and
                  scalable.
                </p>
              </div>

              <div className="p-6 bg-dark-bg rounded-lg">
                <h4 className="heading-4 mb-3 text-primary">
                  Consistent Lead Quality
                </h4>
                <p>
                  Better qualified leads mean more productive conversations and
                  higher conversion rates from inquiry to client.
                </p>
              </div>

              <div className="p-6 bg-dark-bg rounded-lg">
                <h4 className="heading-4 mb-3 text-primary">
                  Professional Image
                </h4>
                <p>
                  A polished online presence and smooth processes demonstrate
                  competence and build family confidence.
                </p>
              </div>

              <div className="p-6 bg-dark-bg rounded-lg">
                <h4 className="heading-4 mb-3 text-primary">Scalable Growth</h4>
                <p>
                  Systems that handle more inquiries without proportional
                  increases in administrative burden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Insight Section */}
      <Section bgColor="primary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-6">
            Strategic Thinking for Care Agency Growth
          </h2>
          <div className="space-y-4 body-lg text-secondary">
            <p>
              The most successful care agencies treat client acquisition as a
              system to be designed and optimized, not a collection of random
              tactics. They understand that families are making important
              decisions and need clear, trustworthy information and processes.
            </p>
            <p>
              Rather than chasing the latest marketing trends, these agencies
              focus on building comprehensive systems that work consistently.
              They invest in understanding their clients' journey and removing
              friction at every step. This approach leads to sustainable growth
              that supports their mission of providing quality care.
            </p>
            <p>
              The key insight is that client acquisition systems should serve
              both the agency's growth goals and the families' need for
              reliable, professional care services.
            </p>
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <CTASection
        headline="Ready to Build Your Client Acquisition System?"
        subheadline="Let's create processes that turn inquiries into clients consistently."
        buttonLabel="Start Your Project"
        buttonHref="/contact"
      />
    </>
  );
}
