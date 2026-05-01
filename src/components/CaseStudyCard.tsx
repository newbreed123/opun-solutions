import Image from "next/image";
import Link from "next/link";

interface CaseStudyCardProps {
  image: string;
  industry: string;
  headline: string;
  result: string;
  href: string;
}

export default function CaseStudyCard({
  image,
  industry,
  headline,
  result,
  href,
}: CaseStudyCardProps) {
  return (
    <Link href={href}>
      <div className="group cursor-pointer">
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-4">
          <Image
            src={image}
            alt={headline}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300" />
        </div>
        <div className="space-y-2">
          <p className="text-brand-blue text-sm font-semibold uppercase tracking-wide">
            {industry}
          </p>
          <h3 className="heading-4 group-hover:text-brand-blue transition-colors">
            {headline}
          </h3>
          <p className="body-md text-muted">{result}</p>
          <div className="pt-2">
            <span className="text-brand-blue font-semibold inline-flex items-center gap-2 group-hover/link:translate-x-1 transition-transform">
              View Case Study <span>→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
