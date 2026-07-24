"use client";

import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

interface CaseStudyCardProps {
  image: string;
  industry: string;
  headline: string;
  resultBadge?: string;
  result: string;
  href: string;
  ctaLabel?: string;
}

export default function CaseStudyCard({
  image,
  industry,
  headline,
  resultBadge,
  result,
  href,
  ctaLabel = "View Case Study",
}: CaseStudyCardProps) {
  return (
    <Link
      href={href}
      onClick={() => {
        trackEvent("case_study_clicked", {
          case_study: headline,
          industry,
          href,
          page_path: window.location.pathname,
        });
      }}
    >
      <div className="group cursor-pointer overflow-hidden rounded-xl border border-dark-border bg-dark-card shadow-lg backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-brand-cyan/70 hover:shadow-card-glow">
        <div className="relative h-64 w-full overflow-hidden md:h-72">
          <Image
            src={image}
            alt={headline}
            fill
            sizes="(min-width: 1280px) 384px, (min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-cyan">
              {industry}
            </span>
            {resultBadge ? (
              <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-cyan">
                {resultBadge}
              </span>
            ) : null}
          </div>

          <h3 className="heading-4 transition-colors group-hover:text-brand-cyan">
            {headline}
          </h3>

          <p className="body-md leading-7 text-secondary">{result}</p>

          <div className="pt-2">
            <span className="inline-flex items-center gap-2 font-semibold text-brand-cyan transition-transform duration-300 group-hover:translate-x-1">
              {ctaLabel} <span>-&gt;</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
