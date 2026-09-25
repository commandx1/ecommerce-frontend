import { keepPreviousData, queryOptions } from "@tanstack/react-query"
import { type VendorOrdersResponse, vendorOrdersAPI } from "@/lib/api/vendor-orders"
import { queryKeys, type VendorOrderListParams } from "@/lib/query/keys"
import { FETCH_ONCE_PER_MOUNT } from "@/lib/query/query-client"

/**
 * A malformed 200 can leave `orders` missing, and `orders-mobile-list.tsx` reads `orders.length`
 * unconditionally (it is in the DOM, just CSS-hidden on desktop), so an unguarded `undefined`
 * would white-screen every vendor.
 */
function normalizeOrdersResponse(response: VendorOrdersResponse): VendorOrdersResponse {
  return {
    ...response,
    orders: Array.isArray(response.orders) ? response.orders : [],
    totalPages: typeof response.totalPages === "number" ? response.totalPages : 0,
    totalElements: typeof response.totalElements === "number" ? response.totalElements : 0,
  }
}

/**
 * `keepPreviousData`: a tab/page/sort change keeps the previous rows on screen while the new page
 * loads. TanStack aborts a superseded request via the `signal` it hands `queryFn`.
 */
export function vendorOrdersListOptions(params: VendorOrderListParams, enabled: boolean) {
  return queryOptions<VendorOrdersResponse>({
    queryKey: queryKeys.vendor.orders.list(params),
    queryFn: ({ signal }) =>
      vendorOrdersAPI
        .getVendorOrders(
          params.page,
          params.size,
          params.sortBy ?? undefined,
          params.sortDir ?? undefined,
          params.type,
          signal,
          params.orderId ?? undefined,
        )
        .then(normalizeOrdersResponse),
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
    placeholderData: keepPreviousData,
  })
}
