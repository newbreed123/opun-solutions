import { previewListings } from "./preview-fixtures";
import type {
  ListingDetail,
  ListingSearchInput,
  ListingSearchRepository,
  ListingSearchResult,
} from "./types";

export class PreviewListingRepository implements ListingSearchRepository {
  async search(input: ListingSearchInput): Promise<ListingSearchResult> {
    const homes = sortListings(previewListings.filter((home) => matches(home, input)), input);

    return {
      homes,
      total: homes.length,
      previewMode: true,
    };
  }

  async getByKey(listingKey: string): Promise<ListingDetail | null> {
    return (
      previewListings.find(
        (home) => home.listingKey.toLowerCase() === listingKey.toLowerCase(),
      ) ?? null
    );
  }
}

function matches(home: ListingDetail, input: ListingSearchInput) {
  const location = input.location?.trim().toLowerCase();
  if (location) {
    const haystack = [
      home.streetAddress,
      home.city,
      home.state,
      home.postalCode,
      home.listingId,
      home.listingKey,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(location)) return false;
  }

  if (input.minPrice !== undefined && home.price < input.minPrice) return false;
  if (input.maxPrice !== undefined && home.price > input.maxPrice) return false;
  if (input.beds !== undefined && (home.bedrooms ?? 0) < input.beds) return false;
  if (
    input.homeType &&
    input.homeType !== "any" &&
    home.homeType?.toLowerCase() !== input.homeType.toLowerCase()
  ) {
    return false;
  }

  return true;
}

function sortListings(listings: ListingDetail[], input: ListingSearchInput) {
  const sorted = [...listings];
  if (input.sort === "price-asc") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (input.sort === "price-desc") {
    sorted.sort((a, b) => b.price - a.price);
  }
  return sorted;
}
