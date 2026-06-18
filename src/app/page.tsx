import Button from "@/components/Button";
import CaseStudyCard from "@/components/CaseStudyCard";
import Section from "@/components/Section";
import ServiceCard from "@/components/ServiceCard";
import {
  AuditPreviewMockup,
  ChatbotPreviewMockup,
  FunnelArchitectureDiagram,
  LeadSystemDashboardMockup,
  OperationsDashboardMockup,
  WorkflowMapMockup,
} from "@/components/VisualMockups";
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

const trustPoints = [
  "Customer journey audits",
  "Conversion path review",
  "Tracking and operations diagnosis",
  "Implementation roadmap",
];

const systemNodes = [
  { label: "Website building", icon: Globe },
  { label: "Ecommerce storefront", icon: ShoppingCart },
  { label: "AI assistant", icon: MessageSquare },
  { label: "CRM / email", icon: ServerCog },
  { label: "Booking / intake", icon: Check },
  { label: "Analytics / tracking", icon: BarChart3 },
  { label: "Backend integrations", icon: Settings },
  { label: "Client dashboard", icon: LayoutGrid },
  { label: "Support / ticket flow", icon: Zap },
];

const audienceSegments = [
  {
    label: "Storefront",
    title: "Ecommerce Brands",
    copy: "Improve product discovery, storefront clarity, tracking, conversion paths, and customer confidence.",
  },
  {
    label: "Lead Flow",
    title: "Service Businesses",
    copy: "Turn website visitors into booked calls, qualified leads, intake submissions, and follow-up workflows.",
  },
  {
    label: "Operations",
    title: "Operations-Heavy Teams",
    copy: "Connect forms, CRM, dashboards, email, AI assistants, support flows, and backend systems into one clear process.",
  },
];

const proofItems = [
  "Ecommerce audit scanner live",
  "AI audit assistant live",
  "PDF roadmap reports generated",
  "Supabase-backed scan insights",
  "BigCommerce / Shopify / custom storefront review logic",
  "Conversion, tracking, UX, and operations scoring",
];

const auditFunnelSteps = [
  {
    title: "Diagnose",
    copy: "Run a free audit to identify conversion, UX, tracking, and operational gaps.",
  },
  {
    title: "Prioritize",
    copy: "Get a roadmap with recommended fixes, estimated effort, and business impact.",
  },
  {
    title: "Build",
    copy: "Opzix helps implement the systems: storefront, AI assistant, CRM, booking, dashboard, integrations, and support flow.",
  },
];

const typicalAgency = [
  "Starts with a redesign",
  "Treats each tool separately",
  "Leaves tracking gaps unclear",
  "Hands off before operations improve",
];

const opzixDifference = [
  "Starts with the customer journey",
  "Prioritizes the highest-impact gaps",
  "Connects website, AI, automation, and backend workflows",
  "Builds around real operations",
];

function SystemsMap() {
  return (
    <div className="relative mx-auto mt-12 max-w-6xl">
      <div className="absolute inset-x-8 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent lg:block" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {systemNodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <div
              key={node.label}
              className={`card relative p-5 ${index === 4 ? "lg:scale-105 lg:border-brand-cyan/60" : ""}`}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-primary">{node.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                Connected into the same customer and operations flow.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero-atmosphere py-14 sm:py-16 md:py-24">
        <div className="container-wide">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="min-w-0">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
                Commerce Systems Consultancy
              </p>
              <h1 className="heading-1 mb-6">
                <span className="block">Find What&apos;s Holding</span>
                <span className="block">Your Business Back.</span>
                <span className="block">Then Fix It.</span>
              </h1>
              <p className="body-lg mb-8 text-secondary">
                Opzix audits customer journeys, conversion paths, tracking gaps,
                and operational bottlenecks, then builds the websites,
                ecommerce systems, AI assistants, and automations to solve them.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href="/tools/ecommerce-audit-scanner" variant="primary" size="lg">
                  Run Free Audit
                </Button>
                <Button href="/contact?source=homepage" variant="secondary" size="lg">
                  Book Strategy Call
                </Button>
              </div>
            </div>
            <LeadSystemDashboardMockup />
          </div>

          <div className="mt-12 grid gap-3 border-t border-dark-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 text-sm text-secondary">
                <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section bgColor="primary">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Who Opzix Serves
          </p>
          <h2 className="heading-2 mt-4">
            Built for businesses where the customer journey is too important to
            guess.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {audienceSegments.map((segment) => (
            <div key={segment.title} className="card p-6">
              <p className="mb-4 inline-flex rounded-full border border-brand-cyan/30 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                {segment.label}
              </p>
              <h3 className="heading-4">{segment.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                {segment.copy}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              Honest Proof
            </p>
            <h2 className="heading-2 mt-4">
              Built from real ecommerce and operations problems.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Opzix Audit Beta is already being used to diagnose storefront,
              tracking, product discovery, and operational workflow gaps.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofItems.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-dark-border bg-white/[0.035] px-4 py-3 text-sm text-secondary">
                <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Main Funnel
          </p>
          <h2 className="heading-2 mt-4">From audit to implementation.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {auditFunnelSteps.map((step, index) => (
            <div key={step.title} className="card p-6">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-cyan/30 bg-brand-blue/10 text-lg font-bold text-brand-cyan">
                {index + 1}
              </div>
              <h3 className="heading-4">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                {step.copy}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/tools/ecommerce-audit-scanner" size="lg">
            Run Free Audit
          </Button>
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Connected Systems
          </p>
          <h2 className="heading-2 mt-4">
            One operating system for leads, sales, and fulfillment.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            The storefront, website, AI assistant, CRM, booking flow,
            analytics, and support handoff should all move in the same customer
            and operations flow.
          </p>
        </div>
        <SystemsMap />
        <div className="mt-10 text-center">
          <Button href="/tools/ecommerce-audit-scanner" size="lg">
            Run Free Audit
          </Button>
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              Why Opzix Is Different
            </p>
            <h2 className="heading-2 mt-4">
              Start with the gap, not the tool.
            </h2>
            <p className="body-lg mt-5 text-secondary">
              A modern customer journey touches your storefront, website, AI
              assistant, CRM, booking flow, tracking, and internal team. Opzix
              starts by finding the weak points, then builds around the full
              path.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="heading-4 mb-5 text-red-200">Typical Agency</h3>
              <div className="space-y-3">
                {typicalAgency.map((item) => (
                  <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-secondary">
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="card-elevated p-6 lg:-mt-5">
              <h3 className="heading-4 mb-5 text-brand-cyan">Opzix</h3>
              <div className="space-y-3">
                {opzixDifference.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-brand-cyan/30 bg-brand-blue/10 px-4 py-3 text-sm text-primary">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Button href="/contact?source=homepage" size="lg">
            Book Strategy Call
          </Button>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Visual System Proof
          </p>
          <h2 className="heading-2 mt-4">
            See the journey before you rebuild it.
          </h2>
          <p className="body-lg mt-5 text-secondary">
            Audit previews, lead-flow diagrams, dashboard interfaces, and AI
            assistant mockups make complex operations visible before they become
            expensive implementation decisions.
          </p>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <FunnelArchitectureDiagram />
          <div className="grid gap-5">
            <AuditPreviewMockup />
            <ChatbotPreviewMockup />
          </div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <OperationsDashboardMockup />
          <WorkflowMapMockup />
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Core Services
          </p>
          <h2 className="heading-2 mt-4">
            Services connected into the same customer and operations flow.
          </h2>
          <p className="body-lg mx-auto mt-5 max-w-3xl text-secondary">
            Opzix can improve one part of the journey or build the connected
            system around it: storefront, lead flow, tracking, automation,
            dashboards, and backend handoff.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={Globe}
            title="Website Building"
            description="Clearer pages, stronger positioning, and conversion paths connected to the rest of the customer journey."
            href="/services"
          />
          <ServiceCard
            icon={ShoppingCart}
            title="Ecommerce Storefront"
            description="Product discovery, category flow, checkout confidence, tracking, and storefront UX reviewed as one system."
            href="/services/ecommerce-solutions"
          />
          <ServiceCard
            icon={MessageSquare}
            title="AI Assistant"
            description="Assistants that answer questions, qualify intent, route inquiries, and support human follow-up."
            href="/services/ai-chatbots-automation"
          />
          <ServiceCard
            icon={ServerCog}
            title="CRM / Email"
            description="Lead, customer, and follow-up workflows connected to the same intake, sales, and support path."
            href="/services"
          />
          <ServiceCard
            icon={Check}
            title="Booking / Intake"
            description="Forms, calls, consultations, and intake steps shaped around cleaner qualification and handoff."
            href="/services"
          />
          <ServiceCard
            icon={BarChart3}
            title="Analytics / Tracking"
            description="Measurement foundations that show which journeys, campaigns, and customer actions are working."
            href="/services"
          />
          <ServiceCard
            icon={Settings}
            title="Backend Integrations"
            description="Ecommerce, CRM, email, booking, payments, ERP, and automation workflows connected with intent."
            href="/services"
          />
          <ServiceCard
            icon={LayoutGrid}
            title="Client Dashboard"
            description="Internal and client-facing views for status, intake, documents, requests, and performance visibility."
            href="/services"
          />
          <ServiceCard
            icon={Zap}
            title="Support / Ticket Flow"
            description="Support requests, order questions, handoffs, and customer communication routed into a clearer process."
            href="/services"
          />
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Case Study Foundation
          </p>
          <h2 className="heading-2 mt-4">How We Help Businesses Improve the Journey</h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            No inflated claims. Just practical improvements to inquiry flow,
            operations, and customer experience.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop"
            industry="Professional Services"
            headline="Sales Coach Website Improved Lead Flow"
            result="A clearer website and inquiry path helped improve prospect quality and conversion visibility."
            href="/case-studies/sales-coach"
          />
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=300&fit=crop"
            industry="Care Agency"
            headline="Care Agency Growth System"
            result="A stronger inquiry, intake, and service presentation foundation for care agency growth."
            href="/case-studies/care-agency-growth"
          />
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop"
            industry="Ecommerce"
            headline="Ecommerce System Success"
            result="A stronger storefront, checkout, and operations system built to reduce friction."
            href="/case-studies/ecommerce-system-success"
          />
        </div>
      </Section>

      <section className="hero-atmosphere py-16 md:py-20">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Start Here
          </p>
          <h2 className="heading-2 mt-4">Start with a free Opzix Audit.</h2>
          <p className="body-lg mx-auto mt-5 max-w-3xl text-secondary">
            Before rebuilding a website or adding more tools, find out where
            the journey is breaking. Run a free audit and get a practical
            roadmap.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button href="/tools/ecommerce-audit-scanner" size="lg">
              Run Free Audit
            </Button>
            <Button href="/contact?source=homepage" variant="secondary" size="lg">
              Book Strategy Call
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
