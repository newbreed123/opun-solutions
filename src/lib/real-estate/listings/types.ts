export type ListingSearchInput = {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  homeType?: string;
  sort?: ListingSort;
};

export type ListingSort = "recommended" | "price-asc" | "price-desc";

export type ListingImage = {
  url: string;
  alt: string;
};

export interface ListingCardModel {
  listingKey: string;
  listingId?: string;
  price: number;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  status?: string;
  primaryImageUrl?: string;
  homeType?: string;
}

export interface ListingDetail extends ListingCardModel {
  description?: string;
  gallery: ListingImage[];
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  yearBuilt?: number;
}

export type ListingSearchResult = {
  homes: ListingCardModel[];
  total: number;
  previewMode: boolean;
};

export interface ListingSearchRepository {
  search(input: ListingSearchInput): Promise<ListingSearchResult>;
  getByKey(listingKey: string): Promise<ListingDetail | null>;
}
