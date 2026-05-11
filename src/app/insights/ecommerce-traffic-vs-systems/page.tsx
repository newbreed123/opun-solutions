import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import Section from "@/components/Section";
import { Check, ShoppingCart } from "lucide-react";

const symptoms = [
  "Shoppers reach product pages but do not feel confident enough to buy",
  "Checkout creates questions instead of momentum",
  "Email, ads, analytics, and backend systems do not tell the same story",
  "Customer support and fulfillment issues create friction after interest is created",
];

const systemFixes = [
  "Clarify the product and collection journey",
  "Reduce checkout uncertainty",
  "Improve tracking before increasing ad spend",
  "Connect storefront, support, fulfillment, and follow-up",
];

export default function EcommerceTrafficVsSystemsInsight() {
  return (
    <>
      <Section bgColor="secondary">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Ecommerce Insight
          </p>
          <h1 className="heading-1 mb-6">
            <span className="block">Why Most Ecommerce Stores</span>
            <span className="block">Don&apos;t Have a</span>
            <span className="block">Traffic Problem</span>
          </h1>
          <p className="body-lg text-secondary">
            More traffic can help a healthy store grow. But if the journey is
            unclear, checkout feels risky, and operations are disconnected, more
            visitors often just create more leakage.
          </p>
        </div>
      </Section>

      <Section bgColor="primary">
        <article className="mx-auto max-w-4xl space-y-10">
          <div>
            <h2 className="heading-2 mb-4">
              Traffic Makes Problems Louder
            </h2>
            <p className="body-lg text-secondary">
              Many stores respond to slow growth by asking for more ads, more
              content, or more campaigns. Sometimes that is the right move. But
              if visitors are already arriving and not converting, the first
              question should be whether the store has a systems problem.
            </p>
          </div>

          <div className="card-elevated p-6">
            <h2 className="heading-3 mb-5">
              Signs the Real Issue Is the System
            </h2>
            <div className="grid gap-3">
              {symptoms.map((symptom) => (
                <div key={symptom} className="flex gap-3 text-secondary">
                  <Check className="mt-1 h-5 w-5 flex-none text-brand-cyan" />
                  <span>{symptom}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="heading-2 mb-4">
              The Storefront Is Only One Layer
            </h2>
            <p className="body-lg text-secondary">
              A useful ecommerce system includes product discovery, checkout,
              payment confidence, shipping clarity, fraud review, analytics,
              support, and backend handoffs. If those pieces are not aligned,
              traffic becomes expensive because the business cannot capture the
              full value of demand.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {systemFixes.map((fix) => (
              <div key={fix} className="card p-5">
                <ShoppingCart className="mb-4 h-8 w-8 text-brand-cyan" />
                <p className="font-semibold text-primary">{fix}</p>
              </div>
            ))}
          </div>

          <div className="card-elevated p-7 text-center">
            <h2 className="heading-3 mb-4">
              Before You Buy More Traffic, Audit the System
            </h2>
            <p className="body-md mx-auto mb-6 text-secondary">
              The ecommerce audit is designed to show where your store is
              leaking revenue and what to fix first.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/services/ecommerce-audit">
                Book Free Ecommerce Audit
              </Button>
              <Button
                href="/services/ai-chatbots-automation"
                variant="secondary"
              >
                Explore AI Chatbots
              </Button>
            </div>
          </div>
        </article>
      </Section>

      <CTASection
        headline="Find the System Issues Behind Slow Growth"
        subheadline="Book an ecommerce audit and get a practical view of what to fix first."
        buttonLabel="Book Free Ecommerce Audit"
        buttonHref="/contact"
      />
    </>
  );
}
