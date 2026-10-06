import type { ListingCardModel } from "./types";

export type ListingContactConfig = {
  email: string;
  phoneTel: string;
};

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatAddress(home: ListingCardModel) {
  return `${home.streetAddress}, ${home.city}, ${home.state} ${home.postalCode}`;
}

export function buildListingInquiryContext({
  home,
  pageUrl,
  inquiryType,
}: {
  home: ListingCardModel;
  pageUrl: string;
  inquiryType: string;
}) {
  return [
    `Inquiry type: ${inquiryType}`,
    `Listing key: ${home.listingKey}`,
    home.listingId ? `MLS number: ${home.listingId}` : "",
    `Address: ${formatAddress(home)}`,
    `Price: ${formatPrice(home.price)}`,
    `Current page URL: ${pageUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSmsHref(
  home: ListingCardModel,
  contact: ListingContactConfig,
) {
  const body = encodeURIComponent(
    `Hi, I like ${formatAddress(home)} listed at ${formatPrice(
      home.price,
    )}. Can you tell me more?`,
  );
  return `sms:${contact.phoneTel}?&body=${body}`;
}

export function buildMailtoHref(
  home: ListingCardModel,
  inquiryType: string,
  contact: ListingContactConfig,
) {
  const subject = encodeURIComponent(`Question about ${home.streetAddress}`);
  const body = encodeURIComponent(
    buildListingInquiryContext({
      home,
      pageUrl: `/homes/${home.listingKey}`,
      inquiryType,
    }),
  );
  return `mailto:${contact.email}?subject=${subject}&body=${body}`;
}
