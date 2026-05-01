import Section from "@/components/Section";
import CTASection from "@/components/CTASection";
import Button from "@/components/Button";
import Image from "next/image";

export default function CareAgencyCaseStudy() {
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
                Care Agency Streamlined Booking & Doubled Response Time
              </h1>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-secondary uppercase tracking-wide mb-1">
                    Industry
                  </p>
                  <p className="text-lg font-semibold">Healthcare Services</p>
                </div>
                <div>
                  <p className="text-sm text-secondary uppercase tracking-wide mb-1">
                    Timeline
                  </p>
                  <p className="text-lg font-semibold">2 months</p>
                </div>
              </div>
            </div>
            <div className="relative w-full h-96 rounded-xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop"
                alt="Care Agency"
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
              This care agency was growing fast, but their operations couldn't
              keep up. They had clients calling during business hours, emails
              going unanswered, and no system for scheduling shifts.
              Administrative staff spent more time on phone calls and email than
              actually managing care.
            </p>
            <p>
              Families were frustrated by slow response times. Potential clients
              couldn't easily book services. The agency was losing business and
              burning out their team.
            </p>
            <p>
              <strong>Key problems:</strong>
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                • Manual scheduling process (spreadsheets and phone calls)
              </li>
              <li>• Slow response to inquiries (24-48 hour delays)</li>
              <li>• No way for clients to check service status or updates</li>
              <li>• Administrative bottleneck slowing growth</li>
              <li>• Lost potential clients due to poor online experience</li>
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
              We built an integrated system combining a modern website, AI
              chatbot, and client portal to automate inquiries and give families
              visibility into their care.
            </p>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                1. Client Portal Dashboard
              </h3>
              <ul className="space-y-2 ml-4">
                <li>✓ Families can view assigned caregivers and schedules</li>
                <li>✓ Real-time updates on caregiver arrival/departure</li>
                <li>✓ Secure messaging system with care team</li>
                <li>✓ Access to billing and service history</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                2. AI Chatbot for Instant Response
              </h3>
              <ul className="space-y-2 ml-4">
                <li>✓ Answers common questions about services instantly</li>
                <li>✓ Qualifies and books initial consultations</li>
                <li>✓ Available 24/7 (even after hours and weekends)</li>
                <li>✓ Hands off complex cases to human team</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                3. Workflow Automation
              </h3>
              <ul className="space-y-2 ml-4">
                <li>✓ Automated scheduling between requests and team</li>
                <li>✓ Confirmation texts and reminders to caregivers</li>
                <li>✓ Invoice generation and payment tracking</li>
                <li>✓ Lead capture and follow-up sequences</li>
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
              <p className="text-4xl font-bold text-brand-blue mb-2">60%</p>
              <p className="body-md">Faster booking time</p>
            </div>
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">2x</p>
              <p className="body-md">Inquiry response rate increase</p>
            </div>
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">40%</p>
              <p className="body-md">Admin time reduced</p>
            </div>
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">95%</p>
              <p className="body-md">Client satisfaction score</p>
            </div>
          </div>

          <div className="mt-12 p-8 bg-dark-secondary rounded-xl border-l-4 border-brand-blue">
            <p className="text-lg italic text-secondary">
              "The portal and chatbot system freed up our team to focus on
              actual care instead of administrative chaos. Families love being
              able to see what's happening. We've doubled our clients in 6
              months without hiring more admin staff."
            </p>
            <p className="mt-4 font-semibold text-primary">
              — Care Agency Director
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
                1. Automation Scales Without Hiring
              </h3>
              <p className="body-lg text-secondary">
                With the right systems, you can handle 2x the clients without
                proportionally increasing your team.
              </p>
            </div>
            <div>
              <h3 className="heading-4 mb-2 text-primary">
                2. Transparency Builds Trust & Loyalty
              </h3>
              <p className="body-lg text-secondary">
                Clients who can see real-time updates and communicate easily are
                happier and more loyal.
              </p>
            </div>
            <div>
              <h3 className="heading-4 mb-2 text-primary">
                3. Admin Efficiency is a Revenue Driver
              </h3>
              <p className="body-lg text-secondary">
                Every hour saved in admin work is an hour your team can spend on
                quality care or business development.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <CTASection
        headline="Ready to automate your business?"
        subheadline="Let's build systems that scale your business without burning out your team."
        buttonLabel="Book a Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
