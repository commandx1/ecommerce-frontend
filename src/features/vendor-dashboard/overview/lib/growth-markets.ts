import type { VendorGeographicCity } from "@/lib/api/vendor-dashboard"

/** `cities` missing, null, or not an array on an otherwise-valid `distribution` (malformed 200
 * body) would otherwise throw on `.filter` and blank the whole dashboard. Excludes cities with
 * no prior-period data (nothing to compare growth against) and returns the top 3 by change. */
export function buildGrowthMarkets(cities: VendorGeographicCity[] | null | undefined): VendorGeographicCity[] {
  const list = Array.isArray(cities) ? cities : []

  return list
    .filter((city) => city.countChangePercentage !== null)
    .sort((a, b) => (b.countChangePercentage ?? 0) - (a.countChangePercentage ?? 0))
    .slice(0, 3)
}
