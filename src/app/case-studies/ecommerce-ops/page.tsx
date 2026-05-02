import Section from "@/components/Section";
import CTASection from "@/components/CTASection";
import Image from "next/image";

export default function EcommerceOpsStudy() {
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
                Online Store Scaled to 5x Revenue in 12 Months
              </h1>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-secondary uppercase tracking-wide mb-1">
                    Industry
                  </p>
                  <p className="text-lg font-semibold">Ecommerce</p>
                </div>
                <div>
                  <p className="text-sm text-secondary uppercase tracking-wide mb-1">
                    Timeline
                  </p>
                  <p className="text-lg font-semibold">12 months</p>
                </div>
              </div>
            </div>
            <div className="relative w-full h-96 rounded-xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                alt="Ecommerce Store"
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
              This ecommerce store was stuck at $10k/month in revenue on a
              declining trend. They had an outdated platform, slow checkout, no
              customer retention strategy, and weren't using paid advertising
              effectively. Traffic was barely coming in, and the traffic they
              did get wasn't converting.
            </p>
            <p>
              They had the product. They just didn't have the system or
              expertise to scale it.
            </p>
            <p>
              <strong>Key problems:</strong>
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                • Outdated ecommerce platform (outdated shopping cart software)
              </li>
              <li>• Slow checkout process (40% cart abandonment rate)</li>
              <li>• No Google Ads strategy or conversion tracking</li>
              <li>• Poor email marketing and customer retention</li>
              <li>• No analytics or data-driven decision making</li>
              <li>• Manual fulfillment and inventory management</li>
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
              We completely rebuilt their ecommerce infrastructure, streamlined
              checkout, set up a high-performing Google Ads program, and
              implemented customer retention systems.
            </p>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                1. Ecommerce Platform Migration & Optimization
              </h3>
              <ul className="space-y-2 ml-4">
                <li>✓ Migrated to modern, fast ecommerce platform</li>
                <li>✓ Simplified checkout (reduced from 6 steps to 2 steps)</li>
                <li>✓ Optimized product pages for conversions</li>
                <li>✓ Integrated inventory management and fulfillment</li>
                <li>✓ Set up abandoned cart recovery emails</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                2. Google Ads & Performance Marketing
              </h3>
              <ul className="space-y-2 ml-4">
                <li>
                  ✓ Set up Google Shopping campaigns with proper product feed
                </li>
                <li>✓ Conversion tracking on all pages</li>
                <li>✓ A/B tested ad copy and landing pages</li>
                <li>✓ Remarketing campaigns to recover lost customers</li>
                <li>✓ Monthly optimization based on data</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                3. Customer Retention & Email Marketing
              </h3>
              <ul className="space-y-2 ml-4">
                <li>✓ Automated email sequences for new customers</li>
                <li>✓ Loyalty program to encourage repeat purchases</li>
                <li>✓ Re-engagement campaigns for inactive customers</li>
                <li>✓ Product recommendations based on purchase history</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-4 mb-4 text-primary">
                4. Analytics & Reporting
              </h3>
              <ul className="space-y-2 ml-4">
                <li>✓ Customer Lifetime Value tracking</li>
                <li>✓ Cohort analysis to understand retention</li>
                <li>✓ Daily reporting dashboard</li>
                <li>✓ Monthly strategy meetings with data insights</li>
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
              <p className="text-4xl font-bold text-brand-blue mb-2">5x</p>
              <p className="body-md">Revenue increase (to $50k/mo)</p>
            </div>
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">35%</p>
              <p className="body-md">Cart abandonment reduction</p>
            </div>
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">3.2x</p>
              <p className="body-md">ROAS on paid ads</p>
            </div>
            <div className="card text-center">
              <p className="text-4xl font-bold text-brand-blue mb-2">42%</p>
              <p className="body-md">Repeat customer rate</p>
            </div>
          </div>

          <div className="mt-12 p-8 bg-dark-secondary rounded-xl border-l-4 border-brand-blue">
            <p className="text-lg italic text-secondary">
              "We went from thinking we were capped at $10k/month to doing
              $50k/month and still growing. The team knows exactly where every
              customer comes from and what we need to optimize. It's night and
              day compared to before."
            </p>
            <p className="mt-4 font-semibold text-primary">
              — Ecommerce Store Owner
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
                1. Platform Matters
              </h3>
              <p className="body-lg text-secondary">
                An outdated platform limits your growth. Upgrading to modern
                infrastructure can immediately improve conversion rates and
                customer experience.
              </p>
            </div>
            <div>
              <h3 className="heading-4 mb-2 text-primary">
                2. Checkout is Conversion
              </h3>
              <p className="body-lg text-secondary">
                Simplifying checkout from 6 steps to 2 steps directly reduced
                abandonment by 35% and increased revenue without more traffic.
              </p>
            </div>
            <div>
              <h3 className="heading-4 mb-2 text-primary">
                3. Data-Driven Growth Compounds
              </h3>
              <p className="body-lg text-secondary">
                With proper tracking and analytics, you can optimize every
                funnel stage. 1% improvements compound to 5x+ growth over 12
                months.
              </p>
            </div>
            <div>
              <h3 className="heading-4 mb-2 text-primary">
                4. Retention is as Important as Acquisition
              </h3>
              <p className="body-lg text-secondary">
                Repeat customers cost less to acquire and generate more revenue.
                Growing from 0% to 42% repeat rate drove massive revenue
                increase.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <CTASection
        headline="Ready to grow your online store?"
        subheadline="Let's build a system that scales revenue without scaling headaches."
        buttonLabel="Book a Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
