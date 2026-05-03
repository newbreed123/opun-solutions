import { Check } from "lucide-react";
import Section from "./Section";

interface ExperienceProofProps {
  bgColor?: "primary" | "secondary";
  title?: string;
  description?: string;
}

export default function ExperienceProof({
  bgColor = "primary",
  title = "Built From Real Ecommerce and Business Operations Experience",
  description = "Not just design theory. Our work comes from understanding how ecommerce actually runs.",
}: ExperienceProofProps) {
  const proofPoints = [
    "Ecommerce website operations",
    "Order review and fraud prevention thinking",
    "Shipping and fulfillment workflows",
    "Google Ads and conversion tracking",
    "NetSuite/backend system familiarity",
    "Website and customer journey optimization",
  ];

  return (
    <Section bgColor={bgColor} padded={true}>
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
          <div>
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-3">
              Our Foundation
            </p>
            <h2 className="heading-2 mb-6">{title}</h2>
            <p className="body-lg text-secondary max-w-3xl">{description}</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8 shadow-[0_40px_80px_rgba(0,102,255,0.08)]">
            <ul className="space-y-5">
              {proofPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <Check
                    size={18}
                    className="text-brand-blue mt-1 flex-shrink-0"
                  />
                  <span className="text-secondary">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
