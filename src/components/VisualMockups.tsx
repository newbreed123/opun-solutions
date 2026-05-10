import Link from "next/link";
import {
  BarChart3,
  Check,
  Globe,
  LayoutGrid,
  MessageSquare,
  ServerCog,
  ShieldCheck,
  ShoppingCart,
  Truck,
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
          href="/contact"
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
