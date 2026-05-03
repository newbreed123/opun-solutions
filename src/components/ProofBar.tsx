import { Check } from "lucide-react";

interface ProofBarProps {
  items?: string[];
  centered?: boolean;
}

export default function ProofBar({
  items = [],
  centered = true,
}: ProofBarProps) {
  const defaultItems = [
    "Ecommerce operations experience",
    "Conversion-focused builds",
    "Fraud review knowledge",
    "Shipping workflow expertise",
    "Backend integration thinking",
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  return (
    <div className={`${centered ? "text-center" : ""}`}>
      <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-6">
        Built On Real Experience
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {displayItems.map((item) => (
          <div
            key={item}
            className="flex items-center justify-center md:justify-start gap-3 p-4 rounded-2xl border border-white/10 bg-dark-secondary/30"
          >
            <Check size={18} className="text-brand-blue flex-shrink-0" />
            <span className="text-secondary text-sm">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
