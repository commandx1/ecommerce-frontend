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
import { FETCH_ONCE_PER_MOUNT, REFRESH_WHILE_VISIBLE } from "@/lib/query/query-client"

export function revenueSummaryOptions(daysFromNow: number, enabled: boolean) {
  return queryOptions<VendorRevenueSummary>({
    queryKey: queryKeys.vendor.overview.revenueSummary(daysFromNow),
    queryFn: ({ signal }) => vendorDashboardAPI.getRevenueSummary(daysFromNow, signal),
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
    ...REFRESH_WHILE_VISIBLE,
  })
}

export function reviewSummaryOptions(enabled: boolean) {
  return queryOptions<VendorReviewSummary>({
    queryKey: queryKeys.vendor.overview.reviewSummary(),
    queryFn: ({ signal }) => vendorDashboardAPI.getReviewSummary(signal),
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
    ...REFRESH_WHILE_VISIBLE,
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
    ...FETCH_ONCE_PER_MOUNT,
    ...REFRESH_WHILE_VISIBLE,
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
    ...FETCH_ONCE_PER_MOUNT,
    ...REFRESH_WHILE_VISIBLE,
  })
}

export function stockSummaryOptions(params: { page: number; size: number }, enabled: boolean) {
  return queryOptions<VendorStockSummaryResponse>({
    queryKey: queryKeys.vendor.overview.stockSummary(params),
    queryFn: ({ signal }) => vendorDashboardAPI.getStockSummary(params.page, params.size, signal),
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
    ...REFRESH_WHILE_VISIBLE,
  })
}

export function geoDistributionOptions(params: { daysFromNow?: number }, enabled: boolean) {
  return queryOptions<VendorGeographicDistributionResponse>({
    queryKey: queryKeys.vendor.overview.geo(params),
    queryFn: ({ signal }) => vendorDashboardAPI.getGeographicDistribution(params.daysFromNow, signal),
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
    ...REFRESH_WHILE_VISIBLE,
  })
}

/** Reuses the vendor.orders.list key, shared with the orders page, so an order write there invalidates this widget too. */
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
    ...FETCH_ONCE_PER_MOUNT,
    ...REFRESH_WHILE_VISIBLE,
  })
}
