import Section from "@/components/Section";
import CTASection from "@/components/CTASection";
import { STRATEGY_CALL_URL } from "@/lib/booking";
import Image from "next/image";

export default function SalesCoachCaseStudy() {
  return (
    <>
      {/* Hero */}
      <section className="relative w-full bg-dark-secondary py-16 md:py-24">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-brand-blue text-sm font-semibold uppercase tracking-wide mb-4">
                Case Study
              </p>
              <h1 className="heading-1 mb-6">
                Sales Coach Lead System Improved Qualified Inquiry Flow
              </h1>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-secondary uppercase tracking-wide mb-1">
                    Industry
                  </p>
                  <p className="text-lg font-semibold">Professional Services</p>
                </div>
                <div>
                  <p className="text-sm text-secondary uppercase tracking-wide mb-1">
                    Timeline
                  </p>
                  <p className="text-lg font-semibold">3 months</p>
                </div>
              </div>
            </div>
            <div className="relative w-full h-96 rounded-xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                alt="Sales Coach"
                fill
                sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Challenge */}
      <Section bgColor="primary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-6">The Challenge</h2>
          <div className="space-y-4 body-lg text-secondary">
            <p>
              Our client was a successful sales coach with a strong reputation,
              but his digital presence was not reflecting that. The customer
              journey was outdated, slow, and did not clearly communicate his
              value proposition or make it easy for potential clients to take
              action.
            </p>
            <p>
              He was losing leads to competitors with clearer digital systems.
              Prospects couldn't easily understand what he offered, book a
              consultation, or learn about his results. The experience was more
              of a business card than a connected lead-generation system.
            </p>
            <p>
              <strong>Key problems:</strong>
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                • Outdated customer experience that did not convey professionalism
              </li>
              <li>• No clear call-to-action or booking system</li>
              <li>• Low conversion rate (less than 1%)</li>
              <li>• No way to capture leads outside business hours</li>
              <li>• Poor mobile experience</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* The Solution */}
      <Section bgColor="secondary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-6">Our Solution</h2>
          <div className="space-y-6 body-lg text-secondary">
            <p>
              We rebuilt the lead journey from the ground up, focusing on
              conversion optimization, lead capture, and follow-up.
            </p>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                1. High-Converting Customer Experience
              </h3>
              <ul className="space-y-2 ml-4">
                <li>
                  ✓ Modern, clean design that conveys authority and
                  professionalism
                </li>
                <li>✓ Clear value proposition and benefits on homepage</li>
                <li>✓ Testimonials and case results prominently displayed</li>
                <li>✓ Mobile-first responsive design</li>
                <li>
                  ✓ Fast load times (improved Core Web Vitals from F to A)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                2. Lead Capture System
              </h3>
              <ul className="space-y-2 ml-4">
                <li>
                  ✓ Easy-to-book consultation form integrated into homepage
                </li>
                <li>
                  ✓ AI assistant to answer questions and support scheduling
                </li>
                <li>✓ Lead magnet (free guide) to capture email addresses</li>
                <li>✓ Automated email sequences for follow-up</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                3. SEO & Conversion Optimization
              </h3>
              <ul className="space-y-2 ml-4">
                <li>
                  ✓ Optimized for search keywords related to sales coaching
                </li>
                <li>✓ Structured data for rich snippets</li>
                <li>✓ A/B tested headlines, CTAs, and copy</li>
                <li>✓ Conversion tracking to measure performance</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* The Results */}
      <Section bgColor="primary">
        <div>
          <h2 className="heading-2 mb-12 text-center">The Improvements</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">3x</p>
              <p className="body-md">Increase in qualified leads</p>
            </div>
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">40%</p>
              <p className="body-md">Conversion rate improvement</p>
            </div>
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">2.8s</p>
              <p className="body-md">Page load time (was 8.5s)</p>
            </div>
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">87%</p>
              <p className="body-md">Mobile traffic increase</p>
            </div>
          </div>

          <div className="mt-12 p-8 bg-dark-secondary rounded-xl border-l-4 border-brand-blue">
            <p className="text-lg italic text-secondary">
              "The new lead system transformed my business. Within 3 months, I went
              from getting a few leads a month to multiple high-quality
              inquiries per week. The chatbot handles questions at night, and
              the booking system saves me hours. Best investment I've made in my
              business."
            </p>
            <p className="mt-4 font-semibold text-primary">
              — Sales Coach Client
            </p>
          </div>
        </div>
      </Section>

      {/* Key Takeaways */}
      <Section bgColor="secondary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-8">Key Takeaways</h2>
          <div className="space-y-6">
            <div>
              <h3 className="heading-4 mb-2 text-primary">
                1. Your Customer Journey is Your Sales System
              </h3>
              <p className="body-lg text-secondary">
                A well-designed customer journey can capture leads and move
                them toward the right next step even when your team is not
                available.
              </p>
            </div>
            <div>
              <h3 className="heading-4 mb-2 text-primary">
                2. AI Automation Scales Lead Capture
              </h3>
              <p className="body-lg text-secondary">
                Chatbots and automated systems handle common questions and
                booking, freeing you to focus on closing deals.
              </p>
            </div>
            <div>
              <h3 className="heading-4 mb-2 text-primary">
                3. Conversion Optimization Compounds
              </h3>
              <p className="body-lg text-secondary">
                A 40% improvement in conversion rate means 40% more revenue from
                the same traffic. It's a 2-3x ROI multiplier.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <CTASection
        headline="Ready for similar results?"
        subheadline="Let's build a connected lead system that turns your expertise into a more scalable business."
        buttonLabel="Book a Strategy Call"
        buttonHref={STRATEGY_CALL_URL}
      />
    </>
  );
}
