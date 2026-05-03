import Image from "next/image";
import Link from "next/link";

interface CaseStudyCardProps {
  image: string;
  industry: string;
  headline: string;
  resultBadge?: string;
  result: string;
  href: string;
}

export default function CaseStudyCard({
  image,
  industry,
  headline,
  resultBadge,
  result,
  href,
}: CaseStudyCardProps) {
  return (
    <Link href={href}>
      <div className="group cursor-pointer rounded-3xl overflow-hidden border border-white/10 bg-dark-secondary shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-brand-blue/20">
        <div className="relative w-full h-64 md:h-72 overflow-hidden">
          <Image
            src={image}
            alt={headline}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-brand-blue text-xs font-semibold uppercase tracking-[0.25em]">
              {industry}
            </span>
            {resultBadge ? (
              <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-blue">
                {resultBadge}
              </span>
            ) : null}
          </div>

          <h3 className="heading-4 group-hover:text-brand-blue transition-colors">
            {headline}
          </h3>

          <p className="body-md text-secondary leading-7">{result}</p>

          <div className="pt-2">
            <span className="text-brand-blue font-semibold inline-flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1">
              View Case Study <span>→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
