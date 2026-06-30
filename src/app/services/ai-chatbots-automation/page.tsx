import {
  BarChart3,
  Check,
  Globe,
  LayoutGrid,
  MessageSquare,
  ServerCog,
  Settings,
  ShoppingCart,
  Zap,
} from "lucide-react";
import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import Section from "@/components/Section";
import { STRATEGY_CALL_URL } from "@/lib/booking";
import {
  ChatbotPreviewMockup,
  WorkflowMapMockup,
} from "@/components/VisualMockups";

const assistantCapabilities = [
  "Answer FAQs instantly",
  "Capture leads 24/7",
  "Qualify prospects",
  "Route inquiries",
  "Book appointments",
  "Trigger follow-ups",
];

const problems = [
  "Visitors leave without contacting you",
  "Common questions take too much time",
  "Leads are not qualified before calls",
  "Follow-ups are manual",
  "Customer inquiries are scattered",
  "Team members repeat the same answers daily",
];

const solutions = [
  {
    title: "Website AI Assistant",
    description:
      "A guided assistant that answers questions, captures interest, and helps visitors find the right next step.",
    icon: MessageSquare,
  },
  {
    title: "Lead Qualification Flow",
    description:
      "Structured questions that collect useful context before a sales call or consultation.",
    icon: BarChart3,
  },
  {
    title: "Appointment Booking Support",
    description:
      "Prompts and handoff flows that guide qualified visitors toward your booking process.",
    icon: Check,
  },
  {
    title: "FAQ & Customer Support Automation",
    description:
      "Clear answers for common questions across services, policies, products, and support topics.",
    icon: MessageSquare,
  },
  {
    title: "Follow-Up Automation",
    description:
      "Automated messages that help keep prospects engaged after they submit details or ask for help.",
    icon: Zap,
  },
  {
    title: "Internal Request Routing",
    description:
      "Inquiry paths that direct leads, support requests, and internal needs to the right team or workflow.",
    icon: LayoutGrid,
  },
  {
    title: "CRM / Email Notifications",
    description:
      "Lead alerts and routing plans for your inbox, CRM, forms, dashboard, or operating system.",
    icon: ServerCog,
  },
  {
    title: "Ecommerce Support Automation",
    description:
      "Shopping assistance for product questions, order support, returns, and customer-service routing.",
    icon: ShoppingCart,
  },
];

const useCases = [
  {
    title: "Ecommerce Stores",
    description:
      "Help shoppers find products, answer shipping/return questions, capture abandoned interest, and route support requests.",
    icon: ShoppingCart,
  },
  {
    title: "Care Agencies",
    description:
      "Answer service questions, guide families to intake forms, and help collect client inquiry details.",
    icon: Globe,
  },
  {
    title: "Coaches & Consultants",
    description:
      "Qualify prospects, answer program questions, and guide visitors to book calls.",
    icon: BarChart3,
  },
  {
    title: "Local Service Businesses",
    description:
      "Capture quote requests, answer basic questions, and route inquiries to the right service.",
    icon: Settings,
  },
];

const workflowSteps = [
  "Visitor asks a question",
  "Assistant answers or qualifies the lead",
  "System captures contact details",
  "Lead is routed to email, CRM, dashboard, or booking flow",
  "Follow-up automation begins",
];

const packages = [
  {
    title: "Starter Assistant",
    description:
      "Best for businesses that need a simple website chatbot and lead capture.",
    includes: [
      "Website chatbot setup",
      "FAQ training",
      "Lead capture form",
      "Email notification",
      "Basic handoff flow",
    ],
  },
  {
    title: "Growth Assistant",
    description:
      "Best for businesses that want qualification, booking, and follow-up automation.",
    includes: [
      "Everything in Starter",
      "Lead qualification logic",
      "Booking link integration",
      "Follow-up automation",
      "CRM/email routing",
    ],
  },
  {
    title: "Operations Assistant",
    description:
      "Best for businesses that need AI connected to internal workflows.",
    includes: [
      "Everything in Growth",
      "Custom workflows",
      "Client intake routing",
      "Ticket/request routing",
      "Dashboard or backend integration planning",
    ],
  },
];

const whyOpzix = [
  "Built around real business workflows",
  "Designed for lead capture and conversion",
  "Practical automation, not gimmicks",
  "Connected to your website, forms, booking, and backend systems",
];

const afterSubmitSteps = [
  "Contact details and context are saved",
  "Inquiry is tagged by service, urgency, or fit",
  "Your team gets a clear notification",
  "The visitor receives a useful next step",
  "Follow-up reminders or email workflows can begin",
];

export default function AIChatbotsAutomationPage() {
  return (
    <main>
      <Section bgColor="secondary" padded>
        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              AI & AUTOMATION
            </p>
            <h1 className="heading-1 w-[calc(100vw-2rem)] max-w-4xl md:w-auto">
              <span className="block">AI Assistants That</span>
              <span className="block">Capture Leads,</span>
              <span className="block">Answer Questions,</span>
              <span className="block">and Reduce</span>
              <span className="block">Manual Work</span>
            </h1>
            <p className="mt-6 max-w-[32ch] text-lg leading-relaxed text-dark-muted md:max-w-2xl md:text-xl">
              We build AI-powered assistants, automation workflows, dashboard
              handoffs, and CRM/email integrations that help your business
              respond quickly, qualify prospects, support customers, and move
              people toward the right next step.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button href={STRATEGY_CALL_URL} variant="primary" size="lg">
                Book Strategy Call
              </Button>
              <Button href="#automations" variant="secondary" size="lg">
                See What We Automate
              </Button>
            </div>
          </div>

          <div className="card-elevated relative overflow-hidden p-6 md:p-8">
            <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-brand-blue/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-brand-cyan/10 blur-3xl" />
            <div className="relative">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/15 text-brand-cyan">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-dark-text">
                What Your Assistant Can Do
              </h2>
              <div className="mt-6 grid gap-3">
                {assistantCapabilities.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-dark-muted"
                  >
                    <Check className="h-4 w-4 flex-none text-brand-cyan" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <ChatbotPreviewMockup />

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Productized Automation
            </p>
            <h2 className="mt-4 text-3xl font-bold text-dark-text md:text-5xl">
              More Than a Popup. A Guided Lead and Support System.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-dark-muted">
              The assistant helps visitors get answers quickly, but the real
              value is what happens next: useful context is captured, the right
              team sees it, and the visitor is guided toward a human-supported
              next step.
            </p>
            <div className="mt-8 rounded-3xl border border-dark-border bg-white/[0.035] p-5">
              <h3 className="text-xl font-bold text-dark-text">
                AI supports your team. It does not replace your team.
              </h3>
              <p className="mt-3 leading-relaxed text-dark-muted">
                We design assistants to reduce repetitive work, improve
                response time, and make handoff cleaner when a person should
                take over.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            The Response Gap
          </p>
          <h2 className="mt-4 text-3xl font-bold text-dark-text md:text-5xl">
            Your Business May Be Losing Leads Because Response Is Too Slow
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <div key={problem} className="card p-6">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                <Zap className="h-5 w-5" />
              </div>
              <p className="text-lg font-semibold leading-snug text-dark-text">
                {problem}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              After Submission
            </p>
            <h2 className="mt-4 text-3xl font-bold text-dark-text md:text-5xl">
              What Happens After a Visitor Submits Info
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-dark-muted">
              A good assistant should not just collect a name and email. It
              should make the next action clearer for your visitor and easier
              for your team to process.
            </p>
            <div className="mt-8 grid gap-3">
              {afterSubmitSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-2xl border border-dark-border bg-white/[0.035] p-4"
                >
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="font-semibold text-dark-text">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <WorkflowMapMockup />
        </div>
      </Section>

      <Section id="automations" bgColor="deep">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            What We Automate
          </p>
          <h2 className="mt-4 text-3xl font-bold text-dark-text md:text-5xl">
            A Smarter Way to Capture, Qualify, and Respond
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <div key={solution.title} className="card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-dark-text">
                  {solution.title}
                </h3>
                <p className="mt-3 leading-relaxed text-dark-muted">
                  {solution.description}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Use Cases
          </p>
          <h2 className="mt-4 text-3xl font-bold text-dark-text md:text-5xl">
            Where AI Assistants Create Immediate Value
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <div key={useCase.title} className="card-elevated p-7">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-dark-text">
                  {useCase.title}
                </h3>
                <p className="mt-4 leading-relaxed text-dark-muted">
                  {useCase.description}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Workflow
          </p>
          <h2 className="mt-4 text-3xl font-bold text-dark-text md:text-5xl">
            How the System Works
          </h2>
        </div>
        <div className="mx-auto mt-12 max-w-4xl">
          <div className="grid gap-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step}
                className="card flex gap-5 p-5 sm:items-center sm:p-6"
              >
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-dark-border bg-gradient-to-br from-brand-blue to-brand-cyan text-sm font-bold text-white shadow-button">
                  {index + 1}
                </div>
                <p className="text-lg font-semibold text-dark-text">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Packages
          </p>
          <h2 className="mt-4 text-3xl font-bold text-dark-text md:text-5xl">
            AI Assistant Packages Built Around Your Workflow
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {packages.map((servicePackage) => (
            <div key={servicePackage.title} className="card-elevated p-7">
              <h3 className="text-2xl font-bold text-dark-text">
                {servicePackage.title}
              </h3>
              <p className="mt-4 min-h-[72px] leading-relaxed text-dark-muted">
                {servicePackage.description}
              </p>
              <div className="mt-7 space-y-3">
                {servicePackage.includes.map((item) => (
                  <div key={item} className="flex gap-3 text-dark-muted">
                    <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="card-elevated p-7 md:p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
              <ServerCog className="h-6 w-6" />
            </div>
            <p className="text-lg leading-relaxed text-dark-muted">
              Most chatbots are just popups. We build assistants that connect to
              your customer journey and business operations.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Why Opzix
            </p>
            <h2 className="mt-4 text-3xl font-bold text-dark-text md:text-5xl">
              Why Our AI Systems Are Different
            </h2>
            <div className="mt-8 grid gap-4">
              {whyOpzix.map((item) => (
                <div key={item} className="flex gap-3 text-lg text-dark-muted">
                  <Check className="mt-1 h-5 w-5 flex-none text-brand-cyan" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <CTASection
        headline="Ready to Turn Website Visitors Into Qualified Leads?"
        subheadline="Let's map where AI and automation can save time, capture more leads, and improve your customer journey."
        buttonLabel="Book Strategy Call"
        buttonHref={STRATEGY_CALL_URL}
      />
    </main>
  );
}
