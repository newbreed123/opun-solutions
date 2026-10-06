import { Search } from "lucide-react";
import type { ListingSearchInput } from "@/lib/real-estate/listings/types";

const priceOptions = [
  ["", "Any"],
  ["300000", "$300k"],
  ["400000", "$400k"],
  ["500000", "$500k"],
  ["600000", "$600k"],
  ["750000", "$750k"],
];

export default function ListingSearchForm({
  input,
}: {
  input: ListingSearchInput;
}) {
  return (
    <form
      id="home-search-form"
      action="/homes"
      className="rounded-lg border border-dark-border bg-dark-card/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] md:p-5"
    >
      <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.6fr_0.8fr_auto]">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-primary">
            Location
          </span>
          <input
            name="location"
            defaultValue={input.location}
            placeholder="City, neighborhood, ZIP, or MLS number"
            className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-4 text-base text-primary outline-none placeholder:text-muted focus:border-brand-cyan"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-primary">
            Min Price
          </span>
          <select
            name="minPrice"
            defaultValue={input.minPrice ?? ""}
            className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-3 text-base text-primary outline-none focus:border-brand-cyan"
          >
            {priceOptions.map(([value, label]) => (
              <option key={value || "min-any"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-primary">
            Max Price
          </span>
          <select
            name="maxPrice"
            defaultValue={input.maxPrice ?? ""}
            className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-3 text-base text-primary outline-none focus:border-brand-cyan"
          >
            {priceOptions.map(([value, label]) => (
              <option key={value || "max-any"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-primary">Beds</span>
          <select
            name="beds"
            defaultValue={input.beds ?? ""}
            className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-3 text-base text-primary outline-none focus:border-brand-cyan"
          >
            <option value="">Any</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-primary">
            Home Type
          </span>
          <select
            name="homeType"
            defaultValue={input.homeType || "any"}
            className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-3 text-base text-primary outline-none focus:border-brand-cyan"
          >
            <option value="any">Any</option>
            <option value="House">House</option>
            <option value="Townhome">Townhome</option>
            <option value="Condo">Condo</option>
          </select>
        </label>

        <button
          type="submit"
          className="btn-primary mt-2 h-12 px-5 lg:mt-7"
        >
          <Search className="mr-2 h-5 w-5" />
          Search Homes
        </button>
      </div>
    </form>
  );
}
