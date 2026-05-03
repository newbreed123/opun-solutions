import Section from "./Section";

interface ProcessProofProps {
  bgColor?: "primary" | "secondary";
  title?: string;
  description?: string;
  steps?: string[];
}

const defaultSteps = [
  "Audit the business and understand current workflows",
  "Map the customer journey and operational bottlenecks",
  "Identify where friction is slowing growth",
  "Build systems that fix the friction",
  "Track performance and continuously improve",
];

export default function ProcessProof({
  bgColor = "primary",
  title = "Why This Approach Works",
  description = "We don't guess at solutions. We build based on understanding your actual business.",
  steps = defaultSteps,
}: ProcessProofProps) {
  return (
    <Section bgColor={bgColor} padded={true}>
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="heading-2 mb-4">{title}</h2>
        <p className="body-lg text-secondary max-w-3xl mx-auto mb-12">
          {description}
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-[2rem] border border-white/10 bg-dark-secondary p-5 shadow-xl shadow-black/5 text-left"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-white text-base font-semibold">
                {index + 1}
              </div>
              <p className="font-semibold text-white">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
