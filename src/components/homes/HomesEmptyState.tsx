import Link from "next/link";
import { MessageCircle, RotateCcw } from "lucide-react";
import { brittanySiteConfig } from "@/content/brittany";

export default function HomesEmptyState() {
  return (
    <div className="rounded-lg border border-dark-border bg-dark-card p-6 text-center">
      <h2 className="text-2xl font-black text-primary">
        No homes match those filters yet.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-secondary">
        Try changing the price or location, or ask{" "}
        {brittanySiteConfig.agentFirstName} to help you find one.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/homes" className="btn-secondary">
          <RotateCcw className="mr-2 h-5 w-5" />
          Clear Filters
        </Link>
        <a
          href={`mailto:${brittanySiteConfig.email}?subject=${encodeURIComponent(
            "Help me find a home",
          )}`}
          className="btn-primary"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Ask {brittanySiteConfig.agentFirstName}
        </a>
      </div>
    </div>
  );
}
