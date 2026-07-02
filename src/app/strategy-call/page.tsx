import type { Metadata } from "next";
import StrategyCallInlineCalendly from "@/components/StrategyCallInlineCalendly";
import type {
  StrategyCallPayload,
  StrategyCallSource,
} from "@/lib/booking/openStrategyCall";

export const metadata: Metadata = {
  title: "Book a Strategy Call",
  description:
    "Schedule a strategy call with Opzix to review your customer journey, tracking, systems, and next growth move.",
};

type StrategyCallPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined> | undefined
  >;
};

export default async function StrategyCallPage({
  searchParams,
}: StrategyCallPageProps) {
  const params = (await searchParams) ?? {};
  const context = strategyCallContextFromParams(params);

  return (
    <section className="bg-dark-bg py-8 md:py-10">
      <div className="container-wide max-w-[96%]">
        <div className="mb-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-brand-cyan">
              Strategy call
            </p>
            <h1 className="text-4xl font-black leading-tight text-primary md:text-5xl">
              Book a Strategy Call
            </h1>
          </div>
          <div className="rounded-xl border border-dark-border bg-dark-card/70 p-5">
            <p className="text-base leading-relaxed text-secondary">
              Choose a time for a focused Opzix review of your funnel, tracking,
              customer journey, and highest-impact next step.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <span className="rounded-full border border-white/10 px-3 py-2">
                30 minutes
              </span>
              <span className="rounded-full border border-white/10 px-3 py-2">
                Ecommerce audit
              </span>
              {context?.source ? (
                <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-2 text-brand-cyan">
                  Source: {context.source.replace(/_/g, " ")}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <StrategyCallInlineCalendly context={context} />
      </div>
    </section>
  );
}

function strategyCallContextFromParams(
  params: Record<string, string | string[] | undefined>,
): Partial<StrategyCallPayload> | undefined {
  const source = getParam(params, "source");

  if (!isStrategyCallSource(source)) {
    return undefined;
  }

  return {
    source,
    businessType: getParam(params, "businessType") || undefined,
    challenge: getParam(params, "challenge") || undefined,
    websiteUrl: getParam(params, "websiteUrl") || undefined,
    leadScore: numberFromParam(getParam(params, "leadScore")),
    leadTemperature: getParam(params, "leadTemperature") || undefined,
  };
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function numberFromParam(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isStrategyCallSource(value: string): value is StrategyCallSource {
  return (
    value === "hero" ||
    value === "header" ||
    value === "zora" ||
    value === "audit_assistant" ||
    value === "contact_page" ||
    value === "pricing" ||
    value === "footer"
  );
}
