import { PreviewListingRepository } from "./preview-repository";
import type { ListingSearchInput, ListingSearchRepository } from "./types";

export function getListingSearchRepository(): ListingSearchRepository {
  return new PreviewListingRepository();
}

export function parseListingSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ListingSearchInput {
  return {
    location: firstParam(searchParams.location),
    minPrice: parsePositiveNumber(firstParam(searchParams.minPrice)),
    maxPrice: parsePositiveNumber(firstParam(searchParams.maxPrice)),
    beds: parsePositiveNumber(firstParam(searchParams.beds)),
    homeType: firstParam(searchParams.homeType) || "any",
    sort: parseSort(firstParam(searchParams.sort)),
  };
}

export function isPreviewListingMode() {
  return true;
}

export function canShowPreviewListings() {
  return process.env.NODE_ENV !== "production";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function parseSort(value: string | undefined) {
  if (value === "price-asc" || value === "price-desc") return value;
  return "recommended";
}
