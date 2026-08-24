import {
  makeVendorGeographicDistributionResponse,
  makeVendorListItem,
  makeVendorPeriodicRevenueResponse,
  makeVendorRevenueSummary,
  makeVendorReviewSummary,
  makeVendorStockSummaryResponse,
} from "@/test/factories/vendor.factory"
import type { ApiMock } from "../fixtures/api-mock.fixture"

/**
 * Mirrors src/mocks/handlers/vendor.handlers.ts, EXCEPT:
 *  - `GET /backend-api/vendors/favorite-ids` - handler-literal `["vendor-1"]`.
 *  - `GET /backend-api/vendors/companies` and `GET /backend-api/vendors` -
 *    each wraps `makeCompanyListItem()` / `makeVendorListItem()` in a
 *    `{ totalCount, page, size, totalPages }` object literally written in
 *    the handler file, no exported page-wrapper factory.
 *  - `GET /backend-api/dashboard/vendor/top-selling-products` - same
 *    reason: the pagination wrapper around `makeVendorTopSellingProduct()`
 *    is handler-literal, not an exported factory.
 * See the Faz 8.1 infra report's "missing exports" list.
 */
export function registerVendorMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/backend-api/vendors/favorites", () => ({ body: [makeVendorListItem()] }))
  apiMock.on("POST", "/backend-api/vendors/:vendorId/favorite", () => ({ status: 200 }))
  apiMock.on("DELETE", "/backend-api/vendors/:vendorId/favorite", () => ({ status: 200 }))

  apiMock.on("GET", "/backend-api/dashboard/vendor/total-revenue-and-order-item-count", () => ({
    body: makeVendorRevenueSummary(),
  }))
  apiMock.on("GET", "/backend-api/dashboard/vendor/review-summary", () => ({ body: makeVendorReviewSummary() }))
  apiMock.on("GET", "/backend-api/dashboard/vendor/periodic-revenue", () => ({
    body: makeVendorPeriodicRevenueResponse(),
  }))
  apiMock.on("GET", "/backend-api/dashboard/vendor/stock-summary", () => ({
    body: makeVendorStockSummaryResponse(),
  }))
  apiMock.on("GET", "/backend-api/dashboard/vendor/geographic-distribution", () => ({
    body: makeVendorGeographicDistributionResponse(),
  }))
}
