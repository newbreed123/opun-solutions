import Section from "@/components/Section";
import CTASection from "@/components/CTASection";
import Button from "@/components/Button";
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
                Sales Coach Website Increased Qualified Leads by 3x
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
              but his digital presence wasn't reflecting that. His website was
              outdated, slow, and didn't clearly communicate his value
              proposition or make it easy for potential clients to take action.
            </p>
            <p>
              He was losing leads to competitors with better web presence.
              Prospects couldn't easily understand what he offered, book a
              consultation, or learn about his results. The website was more of
              a business card than a lead-generation machine.
            </p>
            <p>
              <strong>Key problems:</strong>
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                • Outdated website design that didn't convey professionalism
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
              We redesigned his entire web presence from the ground up, focusing
              on conversion optimization and lead capture.
            </p>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                1. High-Converting Website Redesign
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
                  ✓ AI chatbot on website to answer questions and schedule calls
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
          <h2 className="heading-2 mb-12 text-center">The Results</h2>
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
              "The new website transformed my business. Within 3 months, I went
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
                1. Your Website is Your Sales Team
              </h3>
              <p className="body-lg text-secondary">
                A well-designed website works 24/7 to capture leads and convert
                them—even when you're sleeping.
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
        subheadline="Let's build a website and system that turns your expertise into a scalable business."
        buttonLabel="Book a Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
