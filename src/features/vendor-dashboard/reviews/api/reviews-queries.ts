import { queryOptions } from "@tanstack/react-query"
import { getVendorReviewDashboard, type VendorReviewDashboard } from "@/lib/api/vendor-reviews"
import { queryKeys } from "@/lib/query/keys"
import { FETCH_ONCE_PER_MOUNT } from "@/lib/query/query-client"

/**
 * `getVendorReviewDashboard` never throws (it resolves `null` on any failure), so this query never
 * reaches `isError` - "failed" is `data === null`. Not cached: every mount re-fetches rather than
 * flashing a previous account's dashboard.
 */
export function vendorReviewsDashboardOptions(accessToken: string | undefined) {
  return queryOptions<VendorReviewDashboard | null>({
    queryKey: queryKeys.vendor.reviews.dashboard(),
    queryFn: () => getVendorReviewDashboard(accessToken as string),
    enabled: Boolean(accessToken),
    ...FETCH_ONCE_PER_MOUNT,
  })
}
