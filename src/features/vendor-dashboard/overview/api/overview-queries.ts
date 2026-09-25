import { queryOptions } from "@tanstack/react-query"
import {
  type SpringPage,
  type VendorGeographicDistributionResponse,
  type VendorPeriodicRevenueResponse,
  type VendorRevenueSummary,
  type VendorReviewSummary,
  type VendorStockSummaryResponse,
  type VendorTopSellingProduct,
  vendorDashboardAPI,
} from "@/lib/api/vendor-dashboard"
import { type VendorOrdersResponse, vendorOrdersAPI } from "@/lib/api/vendor-orders"
import { queryKeys } from "@/lib/query/keys"

/**
 * D1 (lead decision): `staleTime: 0, gcTime: 0` on every overview/analytics query - a route
 * revisit re-fetches and shows the loading skeleton, exactly like the old per-widget effect did
 * on every mount. `retry: false`: one request, immediate error+Retry UI, same as the old bare
 * try/catch (the Retry button is what re-fetches, not an automatic retry).
 */
const PARITY_OPTIONS = { staleTime: 0, gcTime: 0, retry: false } as const

export function revenueSummaryOptions(daysFromNow: number, enabled: boolean) {
  return queryOptions<VendorRevenueSummary>({
    queryKey: queryKeys.vendor.overview.revenueSummary(daysFromNow),
    queryFn: ({ signal }) => vendorDashboardAPI.getRevenueSummary(daysFromNow, signal),
    enabled,
    ...PARITY_OPTIONS,
  })
}

export function reviewSummaryOptions(enabled: boolean) {
  return queryOptions<VendorReviewSummary>({
    queryKey: queryKeys.vendor.overview.reviewSummary(),
    queryFn: ({ signal }) => vendorDashboardAPI.getReviewSummary(signal),
    enabled,
    ...PARITY_OPTIONS,
  })
}

export function periodicRevenueOptions(params: { months?: number }, enabled: boolean) {
  return queryOptions<VendorPeriodicRevenueResponse>({
    queryKey: queryKeys.vendor.overview.periodicRevenue(params),
    queryFn: ({ signal }) =>
      vendorDashboardAPI.getPeriodicRevenue(
        params.months !== undefined ? { months: params.months } : undefined,
        signal,
      ),
    enabled,
    ...PARITY_OPTIONS,
  })
}

export function topSellingOptions(
  params: { page: number; size: number; daysFromNow: number; sortDir: "asc" | "desc" },
  enabled: boolean,
) {
  return queryOptions<SpringPage<VendorTopSellingProduct>>({
    queryKey: queryKeys.vendor.overview.topSelling(params),
    queryFn: ({ signal }) =>
      vendorDashboardAPI.getTopSellingProducts(params.page, params.size, params.daysFromNow, params.sortDir, signal),
    enabled,
    ...PARITY_OPTIONS,
  })
}

export function stockSummaryOptions(params: { page: number; size: number }, enabled: boolean) {
  return queryOptions<VendorStockSummaryResponse>({
    queryKey: queryKeys.vendor.overview.stockSummary(params),
    queryFn: ({ signal }) => vendorDashboardAPI.getStockSummary(params.page, params.size, signal),
    enabled,
    ...PARITY_OPTIONS,
  })
}

export function geoDistributionOptions(params: { daysFromNow?: number }, enabled: boolean) {
  return queryOptions<VendorGeographicDistributionResponse>({
    queryKey: queryKeys.vendor.overview.geo(params),
    queryFn: ({ signal }) => vendorDashboardAPI.getGeographicDistribution(params.daysFromNow, signal),
    enabled,
    ...PARITY_OPTIONS,
  })
}

/** RecentOrders reuses the vendor.orders.list key (design §5) - shared with the vendor orders
 * page once it migrates (S8), so an order write there can invalidate this widget too. */
export function recentOrdersOptions(enabled: boolean) {
  return queryOptions<VendorOrdersResponse>({
    queryKey: queryKeys.vendor.orders.list({
      page: 0,
      size: 4,
      sortBy: "createdDate",
      sortDir: "desc",
      type: "ALL",
      orderId: null,
    }),
    queryFn: ({ signal }) => vendorOrdersAPI.getVendorOrders(0, 4, "createdDate", "desc", "ALL", signal),
    enabled,
    ...PARITY_OPTIONS,
  })
}
