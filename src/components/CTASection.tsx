import Button from "./Button";
import type { StrategyCallSource } from "@/lib/booking/openStrategyCall";

interface CTASectionProps {
  headline: string;
  subheadline?: string;
  buttonLabel: string;
  buttonHref: string;
  trackingSource?: StrategyCallSource;
  serviceRequested?: string;
}

export default function CTASection({
  headline,
  subheadline,
  buttonLabel,
  buttonHref,
  trackingSource,
  serviceRequested,
}: CTASectionProps) {
  return (
    <section className="hero-atmosphere py-16 md:py-20">
      <div className="container-wide max-w-[90%] md:max-w-3xl text-center mx-auto">
        <h2 className="heading-2 mb-4">{headline}</h2>
        {subheadline && (
          <p className="body-lg text-secondary mb-8">{subheadline}</p>
        )}
        <Button
          href={buttonHref}
          size="lg"
          trackingSource={trackingSource}
          serviceRequested={serviceRequested}
        >
          {buttonLabel}
        </Button>
      </div>
    </section>
  );
}
