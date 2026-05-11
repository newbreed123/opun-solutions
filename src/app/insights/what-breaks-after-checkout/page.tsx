import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import Section from "@/components/Section";
import { Check, ServerCog, Truck } from "lucide-react";

const breakdowns = [
  "Fraud review is manual or inconsistent",
  "Shipping rules are unclear or disconnected from fulfillment",
  "Customer communication depends on someone remembering to send updates",
  "Order data does not flow cleanly into the tools the team uses",
  "Analytics stop at purchase instead of showing operational performance",
];

const systemLayers = [
  "Order review workflow",
  "Fraud and exception handling",
  "Shipping and fulfillment handoff",
  "Customer support routing",
  "Backend and reporting visibility",
];

export default function WhatBreaksAfterCheckoutInsight() {
  return (
    <>
      <Section bgColor="secondary">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Ecommerce Operations
          </p>
          <h1 className="heading-1 mb-6">
            <span className="block">What Breaks After Checkout:</span>
            <span className="block">The Hidden Ecommerce</span>
            <span className="block">Operations Problem</span>
          </h1>
          <p className="body-lg text-secondary">
            Checkout is not the finish line. For the customer, the purchase is
            the beginning of delivery, communication, trust, and support. That
            is where many ecommerce systems quietly break.
          </p>
        </div>
      </Section>

      <Section bgColor="primary">
        <article className="mx-auto max-w-4xl space-y-10">
          <div>
            <h2 className="heading-2 mb-4">
              Operations Decide Whether the Sale Feels Successful
            </h2>
            <p className="body-lg text-secondary">
              A customer can complete checkout and still have a poor experience
              if the order is delayed, the shipping message is unclear, support
              has no context, or the team has to manually chase information.
            </p>
          </div>

          <div className="card-elevated p-6">
            <h2 className="heading-3 mb-5">Where the System Often Breaks</h2>
            <div className="grid gap-3">
              {breakdowns.map((item) => (
                <div key={item} className="flex gap-3 text-secondary">
                  <Check className="mt-1 h-5 w-5 flex-none text-brand-cyan" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="heading-2 mb-4">
              The Hidden Cost Is Manual Coordination
            </h2>
            <p className="body-lg text-secondary">
              When the backend process is unclear, the team becomes the system.
              People manually check orders, copy information, message customers,
              review suspicious orders, and reconcile data across tools. That
              may work at low volume, but it becomes expensive as the business
              grows.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {systemLayers.map((layer) => (
              <div key={layer} className="card p-5">
                <ServerCog className="mb-4 h-8 w-8 text-brand-cyan" />
                <p className="font-semibold text-primary">{layer}</p>
              </div>
            ))}
          </div>

          <div className="card-elevated p-7">
            <Truck className="mb-5 h-10 w-10 text-brand-cyan" />
            <h2 className="heading-3 mb-4">
              Better Ecommerce Means Better Post-Purchase Operations
            </h2>
            <p className="body-md mb-6 text-secondary">
              A stronger ecommerce system connects storefront, checkout,
              shipping, support, tracking, and backend workflows so the sale can
              move through the business cleanly.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
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
        headline="Want to Fix What Happens After Checkout?"
        subheadline="Book an ecommerce audit and we will review the operational flow behind your store."
        buttonLabel="Book Free Ecommerce Audit"
        buttonHref="/contact"
      />
    </>
  );
}
