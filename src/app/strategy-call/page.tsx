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
    <section className="hero-atmosphere py-12 md:py-16">
      <div className="container-wide max-w-[94%]">
        <div className="mb-8 max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-brand-cyan">
            Strategy call
          </p>
          <h1 className="heading-1 mb-5">Book a Strategy Call</h1>
          <p className="body-lg text-secondary">
            Choose a time for a focused Opzix review of your funnel, tracking,
            customer journey, and highest-impact next step.
          </p>
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
