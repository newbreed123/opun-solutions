import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import Section from "@/components/Section";
import {
  FunnelArchitectureDiagram,
  LeadAuditPreview,
  LeadSystemDashboardMockup,
} from "@/components/VisualMockups";
import { STRATEGY_CALL_URL } from "@/lib/booking";
import {
  BarChart3,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Globe,
  LayoutGrid,
  Mail,
  MessageSquare,
  MousePointerClick,
  RefreshCcw,
  Search,
  ServerCog,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const problemCards = [
  "Visitors leave without contacting you",
  "Slow response time kills leads",
  "Forms collect bad or incomplete information",
  "No lead qualification process",
  "Ads generate clicks but not customers",
  "Follow-up is inconsistent",
  "Tracking does not clearly show what is working",
  "Teams manually manage inquiries",
];

const buildCards: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Landing Pages",
    description:
      "Focused pages built around a clear offer, clear qualification path, and strong next step.",
    icon: LayoutGrid,
  },
  {
    title: "Conversion-Focused Websites",
    description:
      "Website experiences structured to help visitors understand fit and move toward action.",
    icon: Globe,
  },
  {
    title: "AI Lead Qualification",
    description:
      "Guided assistants that ask practical questions and collect useful context before handoff.",
    icon: MessageSquare,
  },
  {
    title: "CRM & Email Routing",
    description:
      "Inquiry paths that send the right lead details to the right inbox, CRM, or workflow.",
    icon: Mail,
  },
  {
    title: "Follow-Up Automation",
    description:
      "Simple workflows that keep prospects informed after they submit a request or book a call.",
    icon: RefreshCcw,
  },
  {
    title: "Conversion Tracking",
    description:
      "Tracking plans that make source, campaign, and lead quality easier to understand.",
    icon: BarChart3,
  },
  {
    title: "Google Ads Landing Systems",
    description:
      "Ad traffic destinations designed around message match, lead quality, and handoff clarity.",
    icon: MousePointerClick,
  },
  {
    title: "Appointment Booking Flows",
    description:
      "Booking paths that reduce friction and collect useful context before a conversation.",
    icon: CalendarCheck,
  },
  {
    title: "Lead Routing Dashboards",
    description:
      "Operational views that help teams see new inquiries, status, source, and next steps.",
    icon: ServerCog,
  },
  {
    title: "Analytics & Visibility Systems",
    description:
      "Reporting foundations that help teams see where attention, spend, and follow-up are working.",
    icon: Search,
  },
];

const useCases = [
  {
    title: "Ecommerce Brands",
    description:
      "Capture shopper intent, route product or support inquiries, improve campaign landing paths, and see which journeys create useful opportunities.",
  },
  {
    title: "Care Agencies",
    description:
      "Guide families toward the right service, collect intake context, support booking paths, and reduce scattered inquiry management.",
  },
  {
    title: "Coaches & Consultants",
    description:
      "Qualify prospects, answer offer questions, route good-fit leads, and guide visitors toward discovery calls.",
  },
  {
    title: "Local Service Businesses",
    description:
      "Capture quote requests, route by service type, support appointment booking, and make follow-up more consistent.",
  },
  {
    title: "Professional Services",
    description:
      "Turn website interest into structured inquiries with better context, cleaner handoff, and more visible lead sources.",
  },
];

const comparison = [
  {
    title: "Typical Agency",
    points: [
      "Focuses mostly on traffic",
      "Basic forms and websites",
      "Generic landing pages",
      "Limited operational thinking",
      "Disconnected tools",
    ],
  },
  {
    title: "Opzix",
    points: [
      "Builds conversion systems",
      "Connects lead flow to operations",
      "Uses AI for qualification and routing",
      "Improves visibility and tracking",
      "Designs around real business workflows",
    ],
    featured: true,
  },
];

function ValueCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="card p-6">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-xl font-bold text-primary">{title}</h3>
      <p className="mt-3 leading-relaxed text-secondary">{description}</p>
    </div>
  );
}

export default function LeadGenerationSystemsPage() {
  return (
    <main>
      <Section bgColor="secondary" className="hero-atmosphere" padded>
        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              LEAD GENERATION SYSTEMS
            </p>
            <h1 className="heading-1 max-w-5xl">
              <span className="block">Lead Generation</span>
              <span className="block">Systems Built to</span>
              <span className="block">Turn Traffic Into</span>
              <span className="block">Qualified Customers</span>
            </h1>
            <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-secondary md:max-w-3xl md:text-xl">
              We build landing pages, AI qualification systems, tracking
              infrastructure, CRM integrations, routing dashboards, follow-up
              workflows, and conversion-focused customer journeys that help
              businesses generate and convert more opportunities.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                href={STRATEGY_CALL_URL}
                variant="primary"
                size="lg"
                trackingSource="services_page"
                serviceRequested="Lead Generation Systems"
              >
                Book Strategy Call
              </Button>
              <Button href="#lead-system-flow" variant="secondary" size="lg">
                Explore Lead Systems
              </Button>
            </div>
          </div>

          <LeadSystemDashboardMockup />
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            The Real Bottleneck
          </p>
          <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
            <span className="block">
              Most Businesses Do Not Have a Traffic Problem
            </span>
            <span className="block">
              They Have a Conversion System Problem
            </span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-secondary">
            Traffic alone does not create customers. Most businesses lose
            opportunities because their systems are disconnected, slow, or
            unclear.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {problemCards.map((problem) => (
            <div key={problem} className="card p-6">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                <Zap className="h-5 w-5" />
              </div>
              <p className="text-lg font-semibold leading-snug text-primary">
                {problem}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="lead-system-flow" bgColor="deep">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Funnel Architecture
          </p>
          <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
            How Modern Lead Systems Actually Work
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-secondary">
            A useful lead system connects attention, qualification, routing,
            booking, follow-up, and tracking into one operational path.
          </p>
        </div>

        <FunnelArchitectureDiagram className="mt-12" />
      </Section>

      <Section bgColor="secondary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            What We Build
          </p>
          <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
            The Pieces That Turn Interest Into Action
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {buildCards.map((card) => (
            <ValueCard key={card.title} {...card} />
          ))}
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Use Cases
          </p>
          <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
            Where These Systems Create Immediate Impact
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {useCases.map((useCase) => (
            <div key={useCase.title} className="card-elevated p-6">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-primary">
                {useCase.title}
              </h3>
              <p className="mt-3 leading-relaxed text-secondary">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
            Why Opzix
          </p>
          <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
            Why Opzix Is Different
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {comparison.map((column) => (
            <div
              key={column.title}
              className={`rounded-[2rem] border p-7 md:p-8 ${
                column.featured
                  ? "border-brand-cyan/40 bg-brand-blue/10 shadow-[0_28px_80px_rgba(59,130,246,0.18)]"
                  : "border-dark-border bg-white/[0.035]"
              }`}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <h3 className="text-2xl font-bold text-primary">
                  {column.title}
                </h3>
                {column.featured && (
                  <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
                    Systems Partner
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {column.points.map((point) => (
                  <div key={point} className="flex gap-3 text-secondary">
                    <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Lead Magnet
            </p>
            <h2 className="mt-4 text-3xl font-bold text-primary md:text-5xl">
              Get a Free Lead Generation Systems Review
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-secondary">
              We will review your current lead flow, conversion bottlenecks,
              tracking setup, and follow-up process - then identify the
              highest-impact improvements.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Lead flow clarity",
                "Conversion bottlenecks",
                "Tracking setup",
                "Follow-up process",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-dark-border bg-white/[0.035] px-4 py-3"
                >
                  <Target className="h-4 w-4 flex-none text-brand-cyan" />
                  <span className="font-semibold text-secondary">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button
                href={STRATEGY_CALL_URL}
                variant="primary"
                size="lg"
                trackingSource="services_page"
                serviceRequested="Lead Generation Systems"
              >
                Book Strategy Call
              </Button>
            </div>
          </div>

          <LeadAuditPreview />
        </div>
      </Section>

      <CTASection
        headline="Ready to Build a Smarter Lead Generation System?"
        subheadline="Let's map how your website, AI, automation, tracking, and customer journey can work together to generate more qualified opportunities."
        buttonLabel="Book Strategy Call"
        buttonHref={STRATEGY_CALL_URL}
        trackingSource="services_page"
        serviceRequested="Lead Generation Systems"
      />
    </main>
  );
}
