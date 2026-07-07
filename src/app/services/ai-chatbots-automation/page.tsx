import {
  CalendarCheck,
  Check,
  ClipboardList,
  Database,
  GitBranch,
  HeartPulse,
  HelpCircle,
  Home,
  LayoutGrid,
  MessageSquare,
  Search,
  ServerCog,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import Button from "@/components/Button";
import Section from "@/components/Section";
import TalkToZoraButton from "@/components/TalkToZoraButton";
import { STRATEGY_CALL_URL } from "@/lib/booking";

const chatbotComparison = [
  {
    generic: "Answer FAQs",
    assistant: "Learns business workflows",
  },
  {
    generic: "Forgets context",
    assistant: "Collects customer context",
  },
  {
    generic: "Cannot qualify leads",
    assistant: "Guides qualification paths",
  },
  {
    generic: "Sits outside your systems",
    assistant: "Triggers automations and CRM handoffs",
  },
];

const assistantTypes = [
  {
    title: "Lead Qualification Assistant",
    description: "Qualifies prospects before they reach your sales team.",
    icon: Users,
  },
  {
    title: "Customer Support Assistant",
    description: "Answers common customer questions around the clock.",
    icon: MessageSquare,
  },
  {
    title: "Appointment Assistant",
    description: "Books consultations, appointments, and next-step calls.",
    icon: CalendarCheck,
  },
  {
    title: "Ecommerce Assistant",
    description: "Helps shoppers discover products and complete purchases.",
    icon: ShoppingBag,
  },
  {
    title: "Intake Assistant",
    description: "Collects forms, documents, and customer information before meetings.",
    icon: ClipboardList,
  },
  {
    title: "Internal Team Assistant",
    description: "Gives employees access to SOPs, documents, policies, and guidance.",
    icon: Database,
  },
];

const industryExamples = [
  {
    title: "Real Estate",
    icon: Home,
    items: ["Buyer qualification", "Seller qualification", "Property questions", "Book showings", "Home valuation"],
  },
  {
    title: "Healthcare",
    icon: HeartPulse,
    items: ["Patient intake", "Referral questions", "Appointment scheduling", "Service guidance"],
  },
  {
    title: "Ecommerce",
    icon: ShoppingBag,
    items: ["Product discovery", "Order questions", "Returns", "Checkout support", "Recommendations"],
  },
  {
    title: "Professional Services",
    icon: BriefcaseIcon,
    items: ["Lead qualification", "Consultation booking", "Proposal requests", "FAQs"],
  },
  {
    title: "Manufacturing",
    icon: ServerCog,
    items: ["RFQ intake", "Product lookup", "Specification questions", "Distributor support"],
  },
];

const assistantCapabilities = [
  "Answer customer questions",
  "Qualify leads",
  "Book appointments",
  "Collect customer information",
  "Recommend products or services",
  "Route conversations",
  "Connect with CRM",
  "Trigger email workflows",
  "Support internal teams",
  "Surface business knowledge",
];

const integrations = [
  "Website",
  "Shopify",
  "BigCommerce",
  "WooCommerce",
  "HubSpot",
  "Salesforce",
  "NetSuite",
  "Calendly",
  "Google Calendar",
  "Slack",
  "Microsoft Teams",
  "Email platforms",
  "Custom APIs",
];

const buildSteps = [
  "Understand your business",
  "Map customer conversations",
  "Design AI workflows",
  "Train the assistant",
  "Connect your systems",
  "Launch",
  "Improve continuously",
];

const whyOpzix = [
  "Business-first approach",
  "Custom AI assistants",
  "Industry-specific workflows",
  "Real integrations",
  "Conversation intelligence",
  "Continuous improvement",
];

const faqs = [
  "Can the assistant answer customer questions?",
  "Can it connect to my CRM?",
  "Can it schedule appointments?",
  "Can it qualify leads?",
  "Can it hand conversations to humans?",
  "Can it work with Shopify?",
  "Can it support internal employees?",
  "How long does implementation take?",
];

export default function AIBusinessAssistantsPage() {
  return (
    <main>
      <Section bgColor="secondary" padded className="hero-atmosphere">
        <div className="grid min-h-[calc(100vh-5rem)] items-center gap-10 py-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              AI Business Assistants
            </p>
            <h1 className="heading-1 max-w-4xl">
              AI Assistants That Work Like Part of Your Team
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-secondary md:text-xl">
              Purpose-built AI assistants trained around your business to answer
              questions, qualify leads, automate repetitive work, and help your
              team serve customers faster.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                href={STRATEGY_CALL_URL}
                variant="primary"
                size="lg"
                trackingSource="hero"
              >
                Book Strategy Call
              </Button>
              <Button href="#examples" variant="secondary" size="lg">
                See AI Examples
              </Button>
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-muted">
              AI should not replace your business. It should strengthen it.
              Your assistant should understand your customers, your workflow,
              and the job it is responsible for.
            </p>
          </div>

          <AssistantSystemVisual />
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Why Most Chatbots Fail
            </p>
            <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
              A generic bot cannot run a business workflow.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-secondary">
              Most chat widgets are trained to answer static questions. An AI
              Business Assistant is designed around a job: qualify the visitor,
              collect the right context, route the conversation, and trigger the
              next step.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {chatbotComparison.map((item) => (
              <div
                key={item.generic}
                className="rounded-xl border border-dark-border bg-dark-card p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Generic bots
                </p>
                <p className="mt-2 text-base font-semibold text-secondary">
                  {item.generic}
                </p>
                <div className="my-4 h-px bg-dark-border" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  Opzix assistants
                </p>
                <p className="mt-2 text-base font-bold text-primary">
                  {item.assistant}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="examples" bgColor="primary">
        <SectionIntro
          eyebrow="AI Assistants We Build"
          title="Every assistant has a job."
          description="Opzix designs assistants around the workflow they need to perform, not around a generic chat widget template."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {assistantTypes.map((assistant) => {
            const Icon = assistant.icon;
            return (
              <div key={assistant.title} className="card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-primary">
                  {assistant.title}
                </h3>
                <p className="mt-3 leading-relaxed text-secondary">
                  {assistant.description}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section bgColor="secondary">
        <SectionIntro
          eyebrow="Industry Examples"
          title="Designed for the way your customers actually ask for help."
          description="A real estate assistant should not behave like an ecommerce assistant. Opzix maps the assistant to the industry, customer journey, and handoff."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {industryExamples.map((industry) => {
            const Icon = industry.icon;
            return (
              <div key={industry.title} className="rounded-xl border border-dark-border bg-dark-card p-5">
                <Icon className="mb-5 h-7 w-7 text-brand-cyan" />
                <h3 className="text-lg font-bold text-primary">{industry.title}</h3>
                <div className="mt-4 space-y-3">
                  {industry.items.map((item) => (
                    <div key={item} className="flex gap-2 text-sm leading-6 text-secondary">
                      <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              What Can Your Assistant Do?
            </p>
            <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
              Turn repeated conversations into a connected business system.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-secondary">
              The assistant is only one part of the system. The value comes from
              the workflow around it: intake, routing, CRM updates, scheduling,
              internal support, and continuous improvement.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {assistantCapabilities.map((capability) => (
              <div
                key={capability}
                className="flex items-center gap-3 rounded-xl border border-dark-border bg-white/[0.035] px-4 py-3 text-sm font-semibold text-secondary"
              >
                <Check className="h-4 w-4 flex-none text-brand-cyan" />
                {capability}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <SectionIntro
          eyebrow="Integrations"
          title="Built to work with the tools your business already uses."
          description="Your assistant can sit on the website, hand context to the CRM, schedule meetings, alert the team, and connect to custom systems when needed."
        />
        <div className="mt-12 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {integrations.map((integration) => (
            <div
              key={integration}
              className="rounded-xl border border-dark-border bg-dark-card px-4 py-4 text-center text-sm font-bold text-primary"
            >
              {integration}
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              How We Build Your Assistant
            </p>
            <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
              Business process first. AI model second.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-secondary">
              We start by understanding the job the assistant needs to perform,
              then design the conversation, routing, integrations, and
              improvement loop around that job.
            </p>
          </div>
          <div className="grid gap-3">
            {buildSteps.map((step, index) => (
              <div
                key={step}
                className="grid gap-4 rounded-xl border border-dark-border bg-dark-card p-4 sm:grid-cols-[auto_1fr] sm:items-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan text-sm font-black text-white">
                  {index + 1}
                </div>
                <p className="text-base font-bold text-primary">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Why Businesses Choose Opzix
            </p>
            <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
              AI assistants built like business infrastructure.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {whyOpzix.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-dark-border bg-dark-card p-4 text-secondary">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-brand-cyan" />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-6">
            <Sparkles className="h-8 w-8 text-brand-cyan" />
            <p className="mt-5 text-2xl font-bold leading-snug text-primary">
              Businesses do not need another generic chatbot.
            </p>
            <p className="mt-4 leading-7 text-secondary">
              They need an assistant trained around how the business operates:
              how leads are qualified, how customers ask questions, how teams
              route work, and which systems need to receive context.
            </p>
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <SectionIntro
          eyebrow="Frequently Asked Questions"
          title="Common questions before building an AI assistant."
          description="These are the questions we usually answer before scoping the workflow, integrations, and launch plan."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
          {faqs.map((question) => (
            <div
              key={question}
              className="flex gap-3 rounded-xl border border-dark-border bg-dark-card p-5"
            >
              <HelpCircle className="mt-0.5 h-5 w-5 flex-none text-brand-cyan" />
              <p className="font-semibold leading-6 text-primary">{question}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="grid gap-8 rounded-xl border border-brand-cyan/30 bg-gradient-to-br from-brand-blue/15 via-dark-card to-brand-cyan/10 p-6 shadow-[0_30px_90px_rgba(6,182,212,0.12)] md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Final Step
            </p>
            <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
              Ready to Build an AI Assistant That Actually Helps Your Business?
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-secondary">
              We will map the job your assistant should perform, the systems it
              needs to connect with, and the fastest path to launch.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button
              href={STRATEGY_CALL_URL}
              variant="primary"
              size="lg"
              trackingSource="pricing"
            >
              Book Strategy Call
            </Button>
            <TalkToZoraButton />
          </div>
        </div>
      </Section>
    </main>
  );
}

function AssistantSystemVisual() {
  const journey = [
    { label: "Visitor", icon: Search },
    { label: "AI conversation", icon: MessageSquare },
    { label: "Qualification", icon: SlidersHorizontal },
    { label: "CRM workflow", icon: GitBranch },
    { label: "Booked next step", icon: CalendarCheck },
  ];

  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl border border-dark-border bg-dark-card p-5 shadow-[0_28px_90px_rgba(2,8,23,0.35)] md:p-6">
      <div className="absolute -right-24 -top-24 h-60 w-60 rounded-full bg-brand-blue/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-brand-cyan/12 blur-3xl" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-dark-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">
              Assistant Command Center
            </p>
            <h2 className="mt-2 text-xl font-bold text-primary">
              Conversation to workflow
            </h2>
          </div>
          <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-bold text-brand-cyan">
            Live
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            <div className="max-w-[90%] rounded-xl rounded-tl-sm border border-white/10 bg-white/[0.05] p-3 text-sm leading-6 text-secondary">
              We need help qualifying leads before our team calls them.
            </div>
            <div className="ml-auto max-w-[92%] rounded-xl rounded-tr-sm border border-brand-cyan/30 bg-brand-blue/15 p-3 text-sm leading-6 text-primary">
              I can collect fit, urgency, service need, and budget range, then
              route qualified prospects to your CRM and booking flow.
            </div>
            <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                Captured context
              </p>
              <div className="mt-3 grid gap-2 text-sm text-secondary">
                <span>Business type: Service firm</span>
                <span>Need: Lead qualification</span>
                <span>Next step: Strategy call</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dark-border bg-dark-deep/80 p-4">
            <p className="text-sm font-bold text-primary">Workflow route</p>
            <div className="mt-4 space-y-3">
              {journey.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.label}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-secondary">
                        {step.label}
                      </p>
                    </div>
                    {index < journey.length - 1 ? (
                      <div className="ml-4 h-4 w-px bg-brand-cyan/30" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Lead score", "82%"],
            ["Context fields", "9"],
            ["Workflow", "CRM + calendar"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-dark-border bg-white/[0.035] p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {label}
              </p>
              <p className="mt-2 text-lg font-black text-primary">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-lg leading-relaxed text-secondary">
        {description}
      </p>
    </div>
  );
}

function BriefcaseIcon({ className = "" }: { className?: string }) {
  return <LayoutGrid className={className} />;
}
