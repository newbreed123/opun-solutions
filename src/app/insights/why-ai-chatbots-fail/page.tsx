import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import Section from "@/components/Section";
import { Check, MessageSquare, ServerCog } from "lucide-react";

const failureReasons = [
  "They are added as popups instead of being designed around the customer journey",
  "They answer generic questions but do not capture useful context",
  "They do not route leads, support requests, or booking intent anywhere useful",
  "They make claims the business cannot support operationally",
  "They do not give humans enough information to follow up well",
];

const betterApproach = [
  "Start with the real questions customers ask",
  "Define when the assistant should answer, qualify, or hand off",
  "Connect the assistant to forms, booking, CRM, email, or dashboards",
  "Use automation to support humans, not replace them",
];

export default function WhyAIChatbotsFailInsight() {
  return (
    <>
      <Section bgColor="secondary">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            AI Automation
          </p>
          <h1 className="heading-1 mb-6">
            <span className="block">Why Most AI Chatbots Fail</span>
            <span className="block">&mdash; And How to Build One</span>
            <span className="block">That Actually Helps</span>
          </h1>
          <p className="body-lg text-secondary">
            Most chatbots fail because they are treated like a widget. A useful
            assistant is part of the business system: it answers, qualifies,
            routes, and supports human follow-up.
          </p>
        </div>
      </Section>

      <Section bgColor="primary">
        <article className="mx-auto max-w-4xl space-y-10">
          <div>
            <h2 className="heading-2 mb-4">The Problem Is Usually the Workflow</h2>
            <p className="body-lg text-secondary">
              The issue is usually the workflow. If the assistant does not know
              what the business needs to collect, where the inquiry should go,
              and when a human should take over, it creates more friction
              instead of less.
            </p>
          </div>

          <div className="card-elevated p-6">
            <h2 className="heading-3 mb-5">Why Chatbots Underperform</h2>
            <div className="grid gap-3">
              {failureReasons.map((reason) => (
                <div key={reason} className="flex gap-3 text-secondary">
                  <Check className="mt-1 h-5 w-5 flex-none text-brand-cyan" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="heading-2 mb-4">
              A Better Assistant Starts With the Customer Journey
            </h2>
            <p className="body-lg text-secondary">
              The best assistants are designed around real use cases: answering
              common questions, qualifying fit, collecting contact details,
              routing support requests, triggering follow-up, and guiding
              visitors toward the right next step.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {betterApproach.map((item) => (
              <div key={item} className="card p-5">
                <MessageSquare className="mb-4 h-8 w-8 text-brand-cyan" />
                <p className="font-semibold text-primary">{item}</p>
              </div>
            ))}
          </div>

          <div className="card-elevated p-7">
            <ServerCog className="mb-5 h-10 w-10 text-brand-cyan" />
            <h2 className="heading-3 mb-4">
              Build the Assistant as Part of the Operating System
            </h2>
            <p className="body-md mb-6 text-secondary">
              A chatbot should connect to the website, forms, booking flow,
              inbox, CRM, dashboard, or support process. That is what turns it
              from a popup into a useful business system.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/services/ai-chatbots-automation">
                Explore AI Chatbots
              </Button>
              <Button href="/services/ecommerce-audit" variant="secondary">
                Talk With Opzix
              </Button>
            </div>
          </div>
        </article>
      </Section>

      <CTASection
        headline="Want an AI Assistant That Supports Your Real Workflow?"
        subheadline="Book a strategy call and we will map the questions, routing, and follow-up your assistant should support."
        buttonLabel="Book Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
