import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import HomesEmptyState from "@/components/homes/HomesEmptyState";
import HomesUnavailable from "@/components/homes/HomesUnavailable";
import ListingCard from "@/components/homes/ListingCard";
import ListingSearchForm from "@/components/homes/ListingSearchForm";
import PreviewListingNotice from "@/components/homes/PreviewListingNotice";
import ResultsHeader from "@/components/homes/ResultsHeader";
import PageViewTracker from "@/components/PageViewTracker";
import { brittanySiteConfig } from "@/content/brittany";
import {
  canShowPreviewListings,
  getListingSearchRepository,
  parseListingSearchParams,
} from "@/lib/real-estate/listings/repository";

type HomesSearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: `Find Your Next Home | ${brittanySiteConfig.agentName}`,
  description:
    `Search homes and contact ${brittanySiteConfig.agentName} directly to ask questions, schedule a tour, or get more information.`,
  alternates: {
    canonical: "/homes",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: `Find Your Next Home | ${brittanySiteConfig.agentName}`,
    description:
      `Browse homes visually and contact ${brittanySiteConfig.agentName} when one feels right.`,
    url: "/homes",
    siteName: brittanySiteConfig.siteName,
    type: "website",
  },
};

export default async function HomesPage({
  searchParams,
}: {
  searchParams: Promise<HomesSearchParams>;
}) {
  if (!canShowPreviewListings()) {
    return <HomesUnavailable />;
  }

  const params = await searchParams;
  const input = parseListingSearchParams(params);
  const result = await getListingSearchRepository().search(input);

  return (
    <>
      <PageViewTracker
        eventName="real_estate_homes_viewed"
        payload={{ preview_inventory: result.previewMode }}
      />

      <section className="hero-atmosphere border-t border-dark-border py-10 md:py-14">
        <div className="container-wide">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                {brittanySiteConfig.agentName}
              </p>
              <h1 className="heading-1 mt-3">Find Your Next Home</h1>
            </div>
            <ListingSearchForm input={input} />
            <div className="mt-4">
              <PreviewListingNotice />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-dark-border bg-dark-bg py-8 md:py-12">
        <div className="container-wide">
          <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
            <a
              href="#home-search-form"
              className="btn-secondary h-11 px-4 py-2 text-sm"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </a>
            <Link href="/homes" className="text-sm font-bold text-brand-cyan">
              Clear
            </Link>
          </div>

          <div id="homes-results">
            {result.total > 0 ? (
              <>
                <ResultsHeader total={result.total} input={input} />
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {result.homes.map((home, index) => (
                    <ListingCard
                      key={home.listingKey}
                      home={home}
                      priority={index === 0}
                    />
                  ))}
                </div>
              </>
            ) : (
              <HomesEmptyState />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
