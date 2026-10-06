import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bath,
  BedDouble,
  CalendarCheck,
  Home,
  Mail,
  Maximize,
  MessageCircle,
  Phone,
} from "lucide-react";
import HomesUnavailable from "@/components/homes/HomesUnavailable";
import ListingGallery from "@/components/homes/ListingGallery";
import ListingInquiryForm from "@/components/homes/ListingInquiryForm";
import PreviewListingNotice from "@/components/homes/PreviewListingNotice";
import PageViewTracker from "@/components/PageViewTracker";
import { brittanySiteConfig } from "@/content/brittany";
import {
  buildMailtoHref,
  buildSmsHref,
  formatAddress,
  formatNumber,
  formatPrice,
} from "@/lib/real-estate/listings/format";
import {
  canShowPreviewListings,
  getListingSearchRepository,
} from "@/lib/real-estate/listings/repository";
import type { ListingDetail } from "@/lib/real-estate/listings/types";

type ListingPageParams = {
  listingKey: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<ListingPageParams>;
}): Promise<Metadata> {
  if (!canShowPreviewListings()) {
    return {
      title: `Home Search Coming Soon | ${brittanySiteConfig.agentName}`,
      robots: { index: false, follow: true },
    };
  }

  const { listingKey } = await params;
  const home = await getListingSearchRepository().getByKey(listingKey);
  if (!home) {
    return {
      title: `Home Not Found | ${brittanySiteConfig.agentName}`,
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `${formatPrice(home.price)} - ${home.streetAddress} | ${brittanySiteConfig.agentName}`,
    description: `${home.bedrooms ?? ""} beds, ${home.bathrooms ?? ""} baths, ${
      home.livingArea ? `${formatNumber(home.livingArea)} sq ft` : "home"
    } in ${home.city}. Ask ${brittanySiteConfig.agentFirstName} about this home.`,
    alternates: {
      canonical: `/homes/${home.listingKey}`,
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: `${formatPrice(home.price)} - ${home.streetAddress}`,
      description: `Ask ${brittanySiteConfig.agentName} about this home in ${home.city}.`,
      url: `/homes/${home.listingKey}`,
      siteName: brittanySiteConfig.siteName,
      type: "website",
      images: home.primaryImageUrl
        ? [{ url: home.primaryImageUrl, alt: `Home at ${formatAddress(home)}` }]
        : undefined,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<ListingPageParams>;
}) {
  if (!canShowPreviewListings()) {
    return <HomesUnavailable />;
  }

  const { listingKey } = await params;
  const home = await getListingSearchRepository().getByKey(listingKey);
  if (!home) notFound();

  return (
    <>
      <PageViewTracker
        eventName="real_estate_listing_viewed"
        payload={{
          listing_key: home.listingKey,
          listing_id: home.listingId,
          preview_inventory: true,
        }}
      />

      <section className="border-t border-dark-border bg-dark-bg py-6 md:py-10">
        <div className="container-wide">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link href="/homes" className="text-sm font-bold text-brand-cyan">
              Back to Homes
            </Link>
            <PreviewListingNotice />
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <ListingGallery
              images={home.gallery}
              fallbackAlt={`Home at ${formatAddress(home)}`}
            />

            <aside className="rounded-lg border border-dark-border bg-dark-card p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <p className="text-4xl font-black leading-tight text-primary md:text-5xl">
                {formatPrice(home.price)}
              </p>
              <h1 className="mt-4 text-2xl font-black leading-tight text-primary md:text-3xl">
                {home.streetAddress}
              </h1>
              <p className="mt-2 text-base font-semibold text-secondary">
                {home.city}, {home.state} {home.postalCode}
              </p>

              <PropertyFacts home={home} />

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  href={`tel:${brittanySiteConfig.phoneTel}`}
                  className="btn-primary"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Call {brittanySiteConfig.agentFirstName}
                </a>
                <a
                  href={buildSmsHref(home, brittanySiteConfig)}
                  className="btn-secondary"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Text {brittanySiteConfig.agentFirstName}
                </a>
                <a
                  href={buildMailtoHref(
                    home,
                    "Schedule a Tour",
                    brittanySiteConfig,
                  )}
                  className="btn-secondary"
                >
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Schedule a Tour
                </a>
                <a href="#ask-brittany" className="btn-secondary">
                  <Mail className="mr-2 h-5 w-5" />
                  Ask About This Home
                </a>
              </div>

              <p className="mt-4 text-sm font-semibold text-muted">
                {brittanySiteConfig.phoneDisplay} - {brittanySiteConfig.email}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-t border-dark-border bg-dark-secondary py-10 md:py-14">
        <div className="container-wide grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              About This Home
            </p>
            <h2 className="heading-2 mt-3">Interested?</h2>
            {home.description ? (
              <p className="mt-5 text-base leading-7 text-secondary">
                {home.description}
              </p>
            ) : null}
            <a
              href={buildMailtoHref(
                home,
                "Ask About This Home",
                brittanySiteConfig,
              )}
              className="btn-secondary mt-6"
            >
              Email {brittanySiteConfig.agentFirstName}
            </a>
          </div>

          <div
            id="ask-brittany"
            className="rounded-lg border border-dark-border bg-dark-card p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
          >
            <h2 className="text-2xl font-black text-primary">
              Ask {brittanySiteConfig.agentFirstName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              This message will include the home, price, and page link.
            </p>
            <div className="mt-5">
              <ListingInquiryForm home={home} />
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-40 border-t border-dark-border bg-dark-bg/95 p-3 backdrop-blur md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <a
            href={`tel:${brittanySiteConfig.phoneTel}`}
            className="btn-primary px-2 py-3 text-sm"
          >
            Call
          </a>
          <a
            href={buildSmsHref(home, brittanySiteConfig)}
            className="btn-secondary px-2 py-3 text-sm"
          >
            Text
          </a>
          <a
            href={buildMailtoHref(home, "Schedule a Tour", brittanySiteConfig)}
            className="btn-secondary px-2 py-3 text-sm"
          >
            Tour
          </a>
        </div>
      </div>
    </>
  );
}

function PropertyFacts({ home }: { home: ListingDetail }) {
  const facts = [
    {
      label: "Beds",
      value: home.bedrooms ?? "-",
      icon: BedDouble,
    },
    {
      label: "Baths",
      value: home.bathrooms ?? "-",
      icon: Bath,
    },
    {
      label: "Sq Ft",
      value: home.livingArea ? formatNumber(home.livingArea) : "-",
      icon: Maximize,
    },
    {
      label: "Type",
      value: home.propertyType ?? home.homeType ?? "Home",
      icon: Home,
    },
  ];

  return (
    <dl className="mt-6 grid grid-cols-2 gap-3">
      {facts.map((fact) => {
        const Icon = fact.icon;
        return (
          <div
            key={fact.label}
            className="rounded-lg border border-dark-border bg-white/[0.035] p-4"
          >
            <dt className="flex items-center gap-2 text-sm font-bold text-brand-cyan">
              <Icon className="h-4 w-4" />
              {fact.label}
            </dt>
            <dd className="mt-2 text-xl font-black text-primary">
              {fact.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
