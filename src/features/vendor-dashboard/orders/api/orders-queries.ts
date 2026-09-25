import { keepPreviousData, queryOptions } from "@tanstack/react-query"
import { type VendorOrdersResponse, vendorOrdersAPI } from "@/lib/api/vendor-orders"
import { queryKeys, type VendorOrderListParams } from "@/lib/query/keys"

/**
 * A malformed 200 (empty/partial body, wrong shape from a misbehaving proxy) parses fine as
 * JSON but can leave `orders` missing - `orders-mobile-list.tsx` calls `orders.length`
 * unconditionally (it renders in the DOM, just CSS-hidden on desktop), so an unguarded
 * `undefined` here white-screens every vendor, not just mobile ones. Same guard `totalPages`/
 * `totalElements` had inline on the page before this moved into the query.
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
 * `placeholderData: keepPreviousData` (design §S8): a tab/page/sort change keeps the previous
 * page's rows on screen while the new one loads instead of clearing to a skeleton. Still exactly
 * one request per distinct set of params - TanStack aborts the in-flight request itself via the
 * `signal` it hands `queryFn` when the key changes again before it resolves, matching the old
 * page's own `AbortController`.
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
    staleTime: 0,
    gcTime: 0,
    retry: false,
    placeholderData: keepPreviousData,
  })
}
