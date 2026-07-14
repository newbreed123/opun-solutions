import type { Metadata } from "next";
import StrategySessionBookingClient from "./StrategySessionBookingClient";
import { getSchedulingConfig } from "@/lib/scheduling/config";

export const metadata: Metadata = {
  title: "Book an Opzix Strategy Session",
  description:
    "Choose a time to discuss your website, ecommerce system, AI assistant, automation, tracking, or customer journey.",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> | undefined>;
};

export default async function StrategySessionPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const context = {
    website: getParam(params, "website") || getParam(params, "websiteUrl"),
    businessType: getParam(params, "businessType"),
    challenge: getParam(params, "challenge"),
    serviceRequested: getParam(params, "serviceRequested"),
    industry: getParam(params, "industry"),
    scanId: getParam(params, "scanId"),
    source: getParam(params, "source") || "direct",
    utm_source: getParam(params, "utm_source"),
    utm_medium: getParam(params, "utm_medium"),
    utm_campaign: getParam(params, "utm_campaign"),
    gclid: getParam(params, "gclid"),
    sessionId: getParam(params, "sessionId"),
  };
  const config = getSchedulingConfig();

  return (
    <main className="min-h-screen bg-dark-bg py-10 md:py-14">
      <div className="container-wide">
        <div className="mb-8 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Native Opzix Booking
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-primary md:text-5xl">
            Book an Opzix Strategy Session
          </h1>
          <p className="mt-4 text-lg leading-8 text-secondary">
            Choose a time to discuss your website, ecommerce system, AI assistant,
            automation, tracking, or customer journey.
          </p>
        </div>
        <StrategySessionBookingClient
          context={context}
          defaultTimezone={config.timezone}
        />
      </div>
    </main>
  );
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
