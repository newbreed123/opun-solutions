import type { ListingSearchInput } from "@/lib/real-estate/listings/types";

export default function ResultsHeader({
  total,
  input,
}: {
  total: number;
  input: ListingSearchInput;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-black text-primary">
          {total} {total === 1 ? "Home" : "Homes"}
        </h2>
      </div>
      <form action="/homes" className="flex items-center gap-2">
        <input type="hidden" name="location" value={input.location ?? ""} />
        <input type="hidden" name="minPrice" value={input.minPrice ?? ""} />
        <input type="hidden" name="maxPrice" value={input.maxPrice ?? ""} />
        <input type="hidden" name="beds" value={input.beds ?? ""} />
        <input type="hidden" name="homeType" value={input.homeType ?? "any"} />
        <label htmlFor="homes-sort" className="text-sm font-bold text-secondary">
          Sort
        </label>
        <select
          id="homes-sort"
          name="sort"
          defaultValue={input.sort ?? "recommended"}
          className="h-11 rounded-lg border border-dark-border bg-dark-deep px-3 text-sm font-semibold text-primary outline-none focus:border-brand-cyan"
        >
          <option value="recommended">Recommended</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
        <button type="submit" className="btn-secondary h-11 px-4 py-2 text-sm">
          Apply
        </button>
      </form>
    </div>
  );
}
