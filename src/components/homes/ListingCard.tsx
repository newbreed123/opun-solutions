import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Heart, Home, Maximize, MessageCircle } from "lucide-react";
import { brittanySiteConfig } from "@/content/brittany";
import {
  formatNumber,
  formatPrice,
} from "@/lib/real-estate/listings/format";
import type { ListingCardModel } from "@/lib/real-estate/listings/types";

export default function ListingCard({
  home,
  priority = false,
}: {
  home: ListingCardModel;
  priority?: boolean;
}) {
  const address = `${home.streetAddress}, ${home.city}`;

  return (
    <article className="group overflow-hidden rounded-lg border border-dark-border bg-dark-card shadow-[0_18px_55px_rgba(0,0,0,0.22)]">
      <div className="relative aspect-[4/3] bg-dark-deep">
        <Link
          href={`/homes/${home.listingKey}`}
          aria-label={`View ${address}`}
          className="absolute inset-0 block"
        >
          {home.primaryImageUrl ? (
            <Image
              src={home.primaryImageUrl}
              alt={`Home at ${address}`}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <Home className="h-12 w-12" aria-hidden="true" />
            </div>
          )}
        </Link>
        <button
          type="button"
          disabled
          title="Save home coming soon"
          aria-label="Save home coming soon"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-dark-deep/80 text-white opacity-90"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        <Link href={`/homes/${home.listingKey}`} className="block rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan">
          <p className="text-3xl font-black leading-tight text-primary">
            {formatPrice(home.price)}
          </p>
          <h2 className="mt-2 text-lg font-bold leading-snug text-primary">
            {home.streetAddress}
          </h2>
          <p className="mt-1 text-sm font-semibold text-secondary">
            {home.city}, {home.state} {home.postalCode}
          </p>
        </Link>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm font-bold text-primary">
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-dark-border bg-white/[0.035] px-3">
            <BedDouble className="h-4 w-4 text-brand-cyan" />
            <dt className="sr-only">Beds</dt>
            <dd>{home.bedrooms ?? "-"} Beds</dd>
          </div>
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-dark-border bg-white/[0.035] px-3">
            <Bath className="h-4 w-4 text-brand-cyan" />
            <dt className="sr-only">Baths</dt>
            <dd>{home.bathrooms ?? "-"} Baths</dd>
          </div>
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-dark-border bg-white/[0.035] px-3">
            <Maximize className="h-4 w-4 text-brand-cyan" />
            <dt className="sr-only">Square feet</dt>
            <dd>{home.livingArea ? formatNumber(home.livingArea) : "-"} Sq Ft</dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href={`/homes/${home.listingKey}`} className="btn-primary px-4 py-3">
            View Home
          </Link>
          <Link
            href={`/homes/${home.listingKey}#ask-brittany`}
            className="btn-secondary px-4 py-3"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Ask {brittanySiteConfig.agentFirstName}
          </Link>
        </div>
      </div>
    </article>
  );
}
