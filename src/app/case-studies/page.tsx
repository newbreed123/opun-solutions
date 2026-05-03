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

          <h1 className="heading-1 mb-6">Case Studies Built to Drive Growth</h1>

          <p className="body-lg text-secondary max-w-3xl mx-auto leading-relaxed">
            Real business problems, broken systems fixed, and measurable results
            delivered through website, ecommerce, and operational improvements.
          </p>
        </div>
      </Section>

      {/* Featured Case Study */}
      <Section bgColor="primary">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-brand-blue text-sm font-semibold uppercase tracking-[0.25em] mb-4">
              Featured Case Study
            </p>
            <h2 className="heading-2 mb-4">
              3X more qualified leads by fixing the site, checkout, and
              follow-up system
            </h2>
            <p className="body-lg text-secondary leading-relaxed">
              This project was not a redesign for the sake of style. It was a
              system upgrade built to capture more leads, reduce friction, and
              make operations easier to run.
            </p>
          </div>

          <div className="grid gap-10 xl:grid-cols-[1.2fr_0.8fr] items-start">
            <div className="space-y-10">
              <div className="space-y-4 max-w-2xl">
                <h3 className="heading-3">Problem</h3>
                <ul className="space-y-3 text-secondary leading-7 list-disc list-inside">
                  <li>
                    Leads were leaking from unclear messaging and a weak inquiry
                    flow.
                  </li>
                  <li>
                    Checkout interruptions and payment friction caused abandoned
                    carts.
                  </li>
                  <li>
                    Operations relied on manual order checks and inconsistent
                    shipping workflows.
                  </li>
                </ul>
              </div>

              <div className="space-y-4 max-w-2xl">
                <h3 className="heading-3">System Breakdown</h3>
                <ul className="space-y-3 text-secondary leading-7 list-disc list-inside">
                  <li>
                    Product and service pages were disconnected from the lead
                    capture journey.
                  </li>
                  <li>
                    Checkout lacked clear trust signals and fallback handling
                    for failed payments.
                  </li>
                  <li>
                    Order validation, fraud review, and shipping were not
                    aligned with the customer experience.
                  </li>
                </ul>
              </div>

              <div className="space-y-4 max-w-2xl">
                <h3 className="heading-3">Solution</h3>
                <ul className="space-y-3 text-secondary leading-7 list-disc list-inside">
                  <li>
                    Reworked the homepage and product flow for clearer visitor
                    intent and better lead capture.
                  </li>
                  <li>
                    Optimized checkout experience with stronger validation,
                    trust copy, and clearer shipping options.
                  </li>
                  <li>
                    Built a workflow dashboard for order review, fraud checks,
                    and fulfillment handoff.
                  </li>
                </ul>
              </div>

              <div className="space-y-4 max-w-2xl">
                <h3 className="heading-3">Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-3xl border border-white/10 bg-dark-secondary p-5">
                    <p className="text-brand-blue text-lg font-semibold">3X</p>
                    <p className="text-secondary text-sm">
                      More qualified leads
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-dark-secondary p-5">
                    <p className="text-brand-blue text-lg font-semibold">
                      +340%
                    </p>
                    <p className="text-secondary text-sm">
                      Revenue growth from better checkout flow
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-dark-secondary p-5">
                    <p className="text-brand-blue text-lg font-semibold">30%</p>
                    <p className="text-secondary text-sm">
                      Less manual order handling work
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-w-2xl rounded-3xl border border-white/10 bg-dark-secondary p-8">
                <p className="text-brand-blue text-sm font-semibold uppercase tracking-[0.25em] mb-3">
                  Client micro testimonial
                </p>
                <p className="body-md text-secondary leading-7">
                  “The website and systems changes were exactly what we needed.
                  Our team now spends less time firefighting, and the lead flow
                  is finally consistent.”
                </p>
                <p className="text-sm text-muted">
                  — Ecommerce founder, Ireland
                </p>
              </div>
            </div>

            <div className="space-y-6 rounded-[2rem] border border-white/10 bg-dark-primary p-8">
              <img
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&h=650&fit=crop"
                alt="Ecommerce operations and marketing dashboard"
                className="rounded-3xl w-full h-[360px] object-cover"
              />

              <div className="space-y-4">
                <p className="text-brand-blue text-xs font-semibold uppercase tracking-[0.25em]">
                  Results Snapshot
                </p>
                <div className="space-y-3">
                  <div className="rounded-3xl bg-dark-secondary p-4 border border-white/10">
                    <p className="font-semibold text-white">
                      Conversion clarity
                    </p>
                    <p className="text-secondary text-sm leading-6">
                      Improved product and checkout messaging so more visitors
                      turned into leads.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-dark-secondary p-4 border border-white/10">
                    <p className="font-semibold text-white">Operational flow</p>
                    <p className="text-secondary text-sm leading-6">
                      A single review process for orders, fraud checks, and
                      shipping handoff.
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
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-brand-blue text-sm font-semibold uppercase tracking-[0.25em] mb-4">
              Project Examples
            </p>
            <h2 className="heading-2 mb-4">
              Conversion-focused case studies across industries
            </h2>
            <p className="body-lg text-secondary leading-relaxed">
              These examples show the kind of practical work we deliver—where
              the goal is improving business systems, lead flow, and customer
              experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CaseStudyCard
              image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
              industry="Professional Services"
              headline="Sales Coach Website & Lead Flow"
              resultBadge="3X Leads"
              result="Refined messaging, improved service pages, and a cleaner inquiry funnel for more qualified client conversations."
              href="/case-studies/sales-coach"
            />

            <CaseStudyCard
              image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop"
              industry="Care Services"
              headline="Care Agency Website & Client Journey"
              resultBadge="+340% Revenue"
              result="Streamlined service discovery, contact flow, and booking logic so care clients could reach out faster."
              href="/case-studies/care-agency"
            />

            <CaseStudyCard
              image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop"
              industry="Ecommerce"
              headline="Ecommerce System Success"
              resultBadge="3X Revenue"
              result="A complete ecommerce system overhaul that delivered higher conversions, more reliable order flow, and better analytics."
              href="/case-studies/ecommerce-system-success"
            />
          </div>
        </div>
      </Section>

      <ProjectProofGrid />

      {/* Bottom CTA */}
      <CTASection
        headline="Want results like this?"
        subheadline="Book a free ecommerce audit and let us show you the highest-impact changes for your business."
        buttonLabel="Book Free Ecommerce Audit"
        buttonHref="/services/ecommerce-audit"
      />
    </>
  );
}
