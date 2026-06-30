import type { Metadata } from "next";
import Button from "@/components/Button";
import StrategyCallConfirmedTracker from "@/components/StrategyCallConfirmedTracker";

export const metadata: Metadata = {
  title: "Strategy Call Booked",
  description:
    "Thanks for booking a strategy call with Opzix. You’ll receive a calendar confirmation shortly.",
};

export default function StrategyCallConfirmedPage() {
  const checklist = [
    "Bring your website URL if you have one.",
    "Be ready to discuss your current business challenge.",
    "If you ran an audit, have the report nearby.",
    "We’ll review your customer journey, tracking, follow-up, and next best step.",
  ];

  return (
    <section className="hero-atmosphere py-20 md:py-24">
      <StrategyCallConfirmedTracker />
      <div className="container-wide max-w-[90%] md:max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-brand-cyan">
          Strategy call
        </p>
        <h1 className="heading-1 mb-6">Strategy Call Booked</h1>
        <p className="body-lg mb-8 max-w-2xl text-secondary">
          Thanks for booking a strategy call with Opzix. You’ll receive a calendar confirmation shortly.
        </p>
        <div className="card-elevated mb-8 p-6 md:p-8">
          <h2 className="mb-5 text-xl font-bold text-primary">Before the call</h2>
          <ul className="space-y-4">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3 text-left text-secondary">
                <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-brand-cyan shadow-[0_0_18px_rgba(6,182,212,0.55)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/" variant="primary" size="lg">
            Return to Home
          </Button>
          <Button href="/tools/ecommerce-audit-scanner" variant="secondary" size="lg">
            Run Free Audit
          </Button>
        </div>
      </div>
    </section>
  );
}
