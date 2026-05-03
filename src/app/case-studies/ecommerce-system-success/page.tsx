import Section from "@/components/Section";
import Button from "@/components/Button";

export default function EcommerceSystemSuccess() {
  return (
    <>
      <Section bgColor="secondary" padded={true}>
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold">
            Ecommerce Case Study
          </p>
          <h1 className="heading-1">
            3X more revenue and fewer ops headaches by fixing the ecommerce
            system, not just the website.
          </h1>
          <p className="body-lg text-secondary leading-8">
            This long-form case study shows how we transformed a broken online
            storefront, checkout flow, order operations, and tracking system
            into a reliable growth engine.
          </p>
          <Button href="/services/ecommerce-audit" size="lg" variant="primary">
            Book Free Ecommerce Audit
          </Button>
        </div>
      </Section>

      <Section bgColor="primary" padded={true}>
        <div className="max-w-3xl mx-auto space-y-10">
          <div>
            <h2 className="heading-2 mb-4">The Problem</h2>
            <ul className="list-disc list-inside space-y-3 text-secondary leading-8">
              <li>
                Revenue was stalling because customers dropped out before
                checkout.
              </li>
              <li>
                The product experience felt disjointed, leaving shoppers unsure
                what to buy.
              </li>
              <li>
                Order validation and fraud checks were reactive, causing delays
                and lost trust.
              </li>
              <li>
                Shipping and fulfillment were manual and inconsistent, creating
                avoidable errors.
              </li>
              <li>
                Tracking was incomplete, so the team couldn’t tell which fixes
                mattered most.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="heading-2 mb-4">
              Before: A business stuck in low confidence and manual work
            </h2>
            <p className="body-lg text-secondary leading-8">
              The owner knew the website was underperforming, but the real issue
              was the system behind it. Customers would find products, hesitate
              at checkout, and then get lost in a process that felt unclear. On
              the operations side, the team was chasing orders, manually
              checking fraud, and scrambling when shipping information broke.
            </p>
          </div>

          <div>
            <h2 className="heading-2 mb-4">What was actually broken</h2>
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">Storefront</h3>
                <p className="text-secondary leading-7">
                  Product pages lacked clarity on value, trust elements were
                  weak, and the path from discovery to purchase was too
                  fragmented.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">Checkout</h3>
                <p className="text-secondary leading-7">
                  The checkout process was too complex, with poor layout,
                  uncertain shipping options, and no clear validation for
                  payment issues.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">Fraud & validation</h3>
                <p className="text-secondary leading-7">
                  There was no consistent review process, so orders were either
                  blocked unnecessarily or shipped before validation was
                  completed.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">Shipping & fulfillment</h3>
                <p className="text-secondary leading-7">
                  Fulfillment was driven by spreadsheets and manual handoffs,
                  which created delays and shipping errors.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">Tracking & analytics</h3>
                <p className="text-secondary leading-7">
                  The marketing team could not measure which ads or pages were
                  actually generating profitable revenue.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="heading-2 mb-4">The system we built</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">A clearer storefront</h3>
                <p className="text-secondary leading-7">
                  Stronger product messaging, trust signals, and a simplified
                  browsing path that pushed visitors toward a confident checkout
                  decision.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">A smoother checkout</h3>
                <p className="text-secondary leading-7">
                  Reduced friction, clearer shipping options, and better error
                  handling so more shoppers completed their purchase.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">Reliable fraud review</h3>
                <p className="text-secondary leading-7">
                  A repeatable order validation workflow that balanced risk with
                  conversion, so the team only paused the orders that needed
                  review.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">Faster fulfillment</h3>
                <p className="text-secondary leading-7">
                  A standardized shipping and packing process with clear
                  handoffs between ecommerce and operations.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6">
                <h3 className="heading-4 mb-3">Measurable analytics</h3>
                <p className="text-secondary leading-7">
                  Marketing and operations could finally see which pages, ads,
                  and workflows were delivering revenue.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="heading-2 mb-4">Results</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6 text-center">
                <p className="text-brand-blue text-4xl font-semibold">3X</p>
                <p className="text-secondary mt-3 leading-7">
                  Revenue from the same traffic mix
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6 text-center">
                <p className="text-brand-blue text-4xl font-semibold">28%</p>
                <p className="text-secondary mt-3 leading-7">
                  Higher checkout completion
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-dark-secondary p-6 text-center">
                <p className="text-brand-blue text-4xl font-semibold">40%</p>
                <p className="text-secondary mt-3 leading-7">
                  Less manual order handling work
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-dark-secondary p-8">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-4">
              Client Testimonial
            </p>
            <p className="body-lg text-secondary leading-8 mb-4">
              “Opun helped us stop guessing and start fixing the actual system.
              We went from chasing lost orders and angry customers to having a
              checkout process that works, clear shipping handoffs, and
              measurable revenue growth.”
            </p>
            <p className="text-sm text-muted">
              — Ecommerce founder, growth-stage brand
            </p>
          </div>

          <div>
            <h2 className="heading-2 mb-4">Why this matters</h2>
            <p className="body-lg text-secondary leading-8">
              This isn’t a cosmetic website project. It’s a systems project.
              When the storefront, checkout, fraud review, fulfillment, and
              analytics all work together, the business stops reacting and
              starts growing predictably.
            </p>
          </div>

          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="heading-2">Ready to fix your ecommerce system?</h2>
            <p className="body-lg text-secondary leading-8">
              Book a free ecommerce audit and we’ll show you the highest-impact
              changes in your storefront, checkout, operations, and tracking.
            </p>
            <Button
              href="/services/ecommerce-audit"
              size="lg"
              variant="primary"
            >
              Book Free Ecommerce Audit
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
