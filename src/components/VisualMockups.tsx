import Link from "next/link";
import { STRATEGY_CALL_URL } from "@/lib/booking";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Globe,
  LayoutGrid,
  Mail,
  MessageSquare,
  MousePointerClick,
  Search,
  ServerCog,
  ShieldCheck,
  ShoppingCart,
  Target,
  Truck,
  Users,
  Zap,
} from "lucide-react";

type MockupProps = {
  className?: string;
};

const auditItems = [
  { label: "Storefront", detail: "Navigation, product flow, content clarity", icon: ShoppingCart },
  { label: "Checkout", detail: "Payment confidence and purchase friction", icon: Check },
  { label: "Fraud", detail: "Order review and validation workflow", icon: ShieldCheck },
  { label: "Shipping", detail: "Fulfillment rules and customer communication", icon: Truck },
  { label: "Tracking", detail: "Analytics and conversion visibility", icon: BarChart3 },
  { label: "Backend", detail: "CRM, ERP, email, and operational handoffs", icon: ServerCog },
];

const workflowSteps = [
  { label: "Website", icon: Globe },
  { label: "AI Assistant", icon: MessageSquare },
  { label: "Form / Booking", icon: Check },
  { label: "CRM / Email", icon: ServerCog },
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Follow-up", icon: Zap },
];

const leadDashboardItems = [
  { label: "Website visitors", value: "Traffic reviewed", icon: MousePointerClick },
  { label: "Qualified leads", value: "Fit and intent captured", icon: Target },
  { label: "AI qualification", value: "Context gathered", icon: MessageSquare },
  { label: "CRM routing", value: "Inquiry sent cleanly", icon: Mail },
  { label: "Appointment booked", value: "Next step selected", icon: CalendarCheck },
  { label: "Conversion tracking", value: "Source visibility", icon: BarChart3 },
];

const funnelNodes = [
  {
    label: "Traffic Sources",
    detail: "Google Ads, organic search, referrals",
    icon: Search,
  },
  {
    label: "Landing Page",
    detail: "Focused message, proof, CTA path",
    icon: Globe,
  },
  {
    label: "AI Qualification",
    detail: "Questions, fit, urgency, context",
    icon: MessageSquare,
  },
  {
    label: "Lead Capture",
    detail: "Contact details and request type",
    icon: ClipboardCheck,
  },
  {
    label: "CRM Routing",
    detail: "Clean handoff to the right workflow",
    icon: Mail,
  },
  {
    label: "Booking / Sales Call",
    detail: "Qualified next step with context",
    icon: CalendarCheck,
  },
  {
    label: "Customer",
    detail: "Clear journey from interest to action",
    icon: Users,
  },
];

const funnelPhases = [
  {
    label: "Attract",
    summary: "Bring the right visitor into a focused path.",
    nodes: funnelNodes.slice(0, 2),
  },
  {
    label: "Qualify",
    summary: "Collect intent, fit, urgency, and request context.",
    nodes: funnelNodes.slice(2, 4),
  },
  {
    label: "Convert",
    summary: "Route, book, and follow up with the next step clear.",
    nodes: funnelNodes.slice(4),
  },
];

const automationHighlights = [
  { label: "AI qualification", icon: MessageSquare },
  { label: "Booking handoff", icon: CalendarCheck },
  { label: "Follow-up workflow", icon: Zap },
];

export function AuditPreviewMockup({ className = "" }: MockupProps) {
  return (
    <div className={`card-elevated relative w-full min-w-0 max-w-full overflow-hidden p-5 md:p-6 ${className}`}>
      <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-brand-blue/20 blur-3xl" />
      <div className="relative">
        <div className="mb-5 flex flex-col items-start gap-3 border-b border-dark-border pb-4 sm:flex-row sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Audit Preview
            </p>
            <h3 className="mt-2 text-xl font-bold text-primary">
              Ecommerce systems review
            </h3>
          </div>
          <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
            Checklist
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {auditItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-dark-border bg-white/[0.035] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5 text-brand-cyan" />
                  <Check className="h-4 w-4 text-brand-cyan" />
                </div>
                <p className="font-semibold text-primary">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ChatbotPreviewMockup({ className = "" }: MockupProps) {
  return (
    <div className={`card-elevated relative w-full min-w-0 max-w-full overflow-hidden p-5 md:p-6 ${className}`}>
      <div className="absolute -left-20 -top-24 h-48 w-48 rounded-full bg-brand-cyan/16 blur-3xl" />
      <div className="relative">
        <div className="mb-5 border-b border-dark-border pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            AI Assistant Preview
          </p>
          <h3 className="mt-2 text-xl font-bold text-primary">
            Qualify and route the inquiry
          </h3>
        </div>

        <div className="space-y-3">
          <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.055] p-3 text-sm leading-relaxed text-secondary">
            Do you work with Shopify and backend workflows?
          </div>
          <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm border border-brand-cyan/30 bg-brand-blue/15 p-3 text-sm leading-relaxed text-primary">
            Yes. What is the biggest issue right now: checkout, fulfillment,
            tracking, or integrations?
          </div>
          <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.055] p-3 text-sm leading-relaxed text-secondary">
            Checkout and follow-up after support requests.
          </div>
          <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm border border-brand-cyan/30 bg-brand-blue/15 p-3 text-sm leading-relaxed text-primary">
            Got it. I can capture context and route this to a strategy call.
          </div>
        </div>

        <Link
          href={STRATEGY_CALL_URL}
          className="mt-5 flex items-center justify-center rounded-2xl border border-brand-cyan/40 bg-gradient-to-r from-brand-blue/25 to-brand-cyan/20 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:border-brand-cyan"
        >
          Book Strategy Call
        </Link>
      </div>
    </div>
  );
}

export function OperationsDashboardMockup({ className = "" }: MockupProps) {
  return (
    <div className={`card-elevated relative w-full min-w-0 max-w-full overflow-hidden p-4 sm:p-5 md:p-6 ${className}`}>
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand-blue/25 blur-3xl" />
      <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-brand-cyan/15 blur-3xl" />
      <div className="relative rounded-2xl border border-dark-border bg-dark-deep/80 p-4">
        <div className="mb-5 flex flex-col items-start gap-3 border-b border-dark-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Operations Dashboard
            </p>
            <h3 className="mt-2 text-xl font-bold text-primary">
              Business system control view
            </h3>
          </div>
          <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
            Active
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Lead captured", "Website form and AI assistant"],
            ["Ecommerce audit", "Storefront, checkout, tracking"],
            ["Workflow automation", "Routing, follow-up, handoff"],
            ["Tracking visibility", "Campaign and conversion events"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold text-primary">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-brand-blue/30 bg-brand-blue/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-cyan shadow-[0_0_18px_rgba(6,182,212,0.8)]" />
            <p className="text-sm font-semibold text-primary">
              Operational next step
            </p>
          </div>
          <div className="grid gap-2 text-sm text-secondary">
            {[
              "Qualified inquiry sent to the right channel",
              "Team gets context before responding",
              "Follow-up workflow starts after handoff",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-none text-brand-cyan" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkflowMapMockup({ className = "" }: MockupProps) {
  return (
    <div className={`card-elevated w-full min-w-0 max-w-full p-5 md:p-6 ${className}`}>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
          Workflow Map
        </p>
        <h3 className="mt-2 text-xl font-bold text-primary">
          From visitor to follow-up
        </h3>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="relative">
              <div className="rounded-2xl border border-dark-border bg-white/[0.035] p-4">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-primary">{step.label}</p>
              </div>
              {index < workflowSteps.length - 1 && (
                <div className="mx-auto h-3 w-px bg-brand-blue/40 md:absolute md:-right-2 md:top-1/2 md:h-px md:w-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LeadSystemDashboardMockup({ className = "" }: MockupProps) {
  return (
    <div className={`card-elevated relative w-full min-w-0 max-w-full overflow-hidden p-4 sm:p-5 md:p-6 ${className}`}>
      <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand-blue/25 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-brand-cyan/15 blur-3xl" />
      <div className="relative rounded-2xl border border-dark-border bg-dark-deep/80 p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 border-b border-dark-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Lead System View
            </p>
            <h3 className="mt-2 text-xl font-bold text-primary">
              Growth operations dashboard
            </h3>
          </div>
          <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
            Routed
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {leadDashboardItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="h-2 w-2 rounded-full bg-brand-cyan shadow-[0_0_18px_rgba(6,182,212,0.75)]" />
                </div>
                <p className="text-sm font-bold text-primary">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-brand-blue/30 bg-brand-blue/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-cyan" />
            <p className="text-sm font-semibold text-primary">
              Next action clarity
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan" />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Each inquiry gets source, context, routing, and a visible follow-up path.
          </p>
        </div>
      </div>
    </div>
  );
}

export function FunnelArchitectureDiagram({ className = "" }: MockupProps) {
  return (
    <div className={`card-elevated relative w-full min-w-0 max-w-full self-start overflow-hidden p-5 md:p-6 lg:p-7 ${className}`}>
      <div className="absolute left-1/2 top-8 h-48 w-48 -translate-x-1/2 rounded-full bg-brand-blue/20 blur-3xl" />
      <div className="relative">
        <div className="mb-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Connected Funnel
          </p>
          <h3 className="mt-2 text-xl font-bold text-primary">
            From traffic to qualified customer
          </h3>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {funnelPhases.map((phase, phaseIndex) => {
            return (
              <div
                key={phase.label}
                className="relative min-w-0 border-t border-brand-cyan/30 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 first:lg:border-l-0 first:lg:pl-0"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-brand-cyan">
                      0{phaseIndex + 1}
                    </p>
                    <p className="mt-1 text-base font-bold text-primary">
                      {phase.label}
                    </p>
                  </div>
                  {phaseIndex < funnelPhases.length - 1 && (
                    <ArrowRight className="mt-1 hidden h-5 w-5 flex-none text-brand-cyan/70 lg:block" />
                  )}
                </div>

                <p className="mb-4 min-h-[2.5rem] text-sm leading-relaxed text-secondary">
                  {phase.summary}
                </p>

                <div className="space-y-3">
                  {phase.nodes.map((node) => {
                    const Icon = node.icon;
                    return (
                      <div key={node.label} className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-snug text-primary">
                            {node.label}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            {node.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {phaseIndex < funnelPhases.length - 1 && (
                  <ArrowDown className="mx-auto mt-5 h-4 w-4 text-brand-cyan/70 lg:hidden" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {automationHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-brand-cyan/20 bg-brand-cyan/10 px-4 py-3 text-sm font-semibold text-primary"
              >
                <Icon className="h-4 w-4 flex-none text-brand-cyan" />
                <span className="min-w-0">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LeadAuditPreview({ className = "" }: MockupProps) {
  const checklist = [
    "Landing page clarity",
    "Lead capture friction",
    "Qualification process",
    "CRM and email routing",
    "Follow-up consistency",
    "Tracking visibility",
  ];

  return (
    <div className={`card-elevated relative w-full min-w-0 max-w-full overflow-hidden p-5 md:p-6 ${className}`}>
      <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-brand-cyan/16 blur-3xl" />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-dark-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Review Preview
            </p>
            <h3 className="mt-2 text-xl font-bold text-primary">
              Conversion system checklist
            </h3>
          </div>
          <ClipboardCheck className="h-6 w-6 flex-none text-brand-cyan" />
        </div>

        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
            >
              <Check className="h-4 w-4 flex-none text-brand-cyan" />
              <span className="text-sm font-semibold text-secondary">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
