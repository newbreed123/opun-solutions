"use client";

import { useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

export type RealEstatePricingFaqItem = {
  id: string;
  question: string;
  answer: string;
};

type RealEstatePricingFaqProps = {
  items: RealEstatePricingFaqItem[];
};

export default function RealEstatePricingFaq({
  items,
}: RealEstatePricingFaqProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const trackedIds = useRef(new Set<string>());

  return (
    <div className="mx-auto mt-10 max-w-4xl divide-y divide-dark-border rounded-lg border border-dark-border bg-white/[0.035]">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div key={item.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
              aria-expanded={isOpen}
              aria-controls={`${item.id}-answer`}
              onClick={() => {
                const nextOpenId = isOpen ? null : item.id;

                setOpenId(nextOpenId);

                if (nextOpenId && !trackedIds.current.has(item.id)) {
                  trackedIds.current.add(item.id);
                  trackEvent("faq_expanded", {
                    page_path: window.location.pathname,
                    faq_id: item.id,
                    question: item.question,
                    industry: "real_estate",
                  });
                }
              }}
            >
              <span className="text-base font-semibold text-primary">
                {item.question}
              </span>
              <span
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-brand-cyan/30 text-lg leading-none text-brand-cyan"
                aria-hidden="true"
              >
                {isOpen ? "-" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div id={`${item.id}-answer`} className="px-5 pb-5">
                <p className="max-w-3xl text-sm leading-6 text-secondary">
                  {item.answer}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
