import Button from "./Button";

interface CTASectionProps {
  headline: string;
  subheadline?: string;
  buttonLabel: string;
  buttonHref: string;
}

export default function CTASection({
  headline,
  subheadline,
  buttonLabel,
  buttonHref,
}: CTASectionProps) {
  return (
    <section className="bg-dark-secondary py-16 md:py-24">
      <div className="container-wide max-w-3xl text-center">
        <h2 className="heading-2 mb-4">{headline}</h2>
        {subheadline && (
          <p className="body-lg text-secondary mb-8">{subheadline}</p>
        )}
        <Button href={buttonHref} size="lg">
          {buttonLabel}
        </Button>
      </div>
    </section>
  );
}
