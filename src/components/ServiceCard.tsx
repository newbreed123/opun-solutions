import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}

export default function ServiceCard({
  icon: Icon,
  title,
  description,
  href = "/services",
}: ServiceCardProps) {
  return (
    <div className="card group">
      <div className="mb-4">
        <Icon className="w-12 h-12 text-brand-blue group-hover:text-brand-blue-light transition-colors" />
      </div>
      <h3 className="heading-4 mb-3">{title}</h3>
      <p className="body-md mb-4">{description}</p>
      <Link
        href={href}
        className="text-brand-blue hover:text-brand-blue-light font-semibold inline-flex items-center gap-2 group/link"
      >
        Learn More
        <span className="transition-transform group-hover/link:translate-x-1">
          →
        </span>
      </Link>
    </div>
  );
}
