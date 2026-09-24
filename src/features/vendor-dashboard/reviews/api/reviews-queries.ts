import { queryOptions } from "@tanstack/react-query"
import { getVendorReviewDashboard, type VendorReviewDashboard } from "@/lib/api/vendor-reviews"
import { queryKeys } from "@/lib/query/keys"

/**
 * `getVendorReviewDashboard` never throws: it catches both a non-ok response and a network
 * failure and resolves `null` either way (see `src/lib/api/vendor-reviews.ts`). So this query
 * never reaches `isError` - the view model reads "failed" straight off `data === null`, same as
 * the pre-migration `useState` version did off its own `result === null` check.
 *
 * D1 (lead decision): `staleTime: 0, gcTime: 0` reproduces today's behaviour exactly - every
 * mount (including a route revisit) shows the loading skeleton and re-fetches, rather than
 * flashing a previous account's or a stale request's cached dashboard.
 */
export function vendorReviewsDashboardOptions(accessToken: string | undefined) {
  return queryOptions<VendorReviewDashboard | null>({
    queryKey: queryKeys.vendor.reviews.dashboard(),
    queryFn: () => getVendorReviewDashboard(accessToken as string),
    enabled: Boolean(accessToken),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
