import { HttpResponse, http } from "msw"
import {
  makeCompanyListItem,
  makeVendorGeographicDistributionResponse,
  makeVendorListItem,
  makeVendorPeriodicRevenueResponse,
  makeVendorRevenueSummary,
  makeVendorReviewSummary,
  makeVendorStockSummaryResponse,
  makeVendorTopSellingProduct,
} from "@/test/factories/vendor.factory"

export const vendorHandlers = [
  // ==================== Vendor / company directory ====================
  http.get("*/backend-api/vendors/favorite-ids", () => HttpResponse.json(["vendor-1"])),

  http.get("*/backend-api/vendors/favorites", () => HttpResponse.json([makeVendorListItem()])),

  http.post("*/backend-api/vendors/:vendorId/favorite", () => new HttpResponse(null, { status: 200 })),

  http.delete("*/backend-api/vendors/:vendorId/favorite", () => new HttpResponse(null, { status: 200 })),

  http.get("*/backend-api/vendors/companies", () =>
    HttpResponse.json({
      companies: [makeCompanyListItem()],
      totalCount: 1,
      page: 0,
      size: 10,
      totalPages: 1,
    }),
  ),

  http.get("*/backend-api/vendors", () =>
    HttpResponse.json({
      vendors: [makeVendorListItem()],
      totalCount: 1,
      page: 0,
      size: 10,
      totalPages: 1,
    }),
  ),

  // ==================== Vendor dashboard ====================
  http.get("*/backend-api/dashboard/vendor/total-revenue-and-order-item-count", () =>
    HttpResponse.json(makeVendorRevenueSummary()),
  ),

  http.get("*/backend-api/dashboard/vendor/review-summary", () => HttpResponse.json(makeVendorReviewSummary())),

  http.get("*/backend-api/dashboard/vendor/periodic-revenue", () =>
    HttpResponse.json(makeVendorPeriodicRevenueResponse()),
  ),

  http.get("*/backend-api/dashboard/vendor/top-selling-products", () =>
    HttpResponse.json({
      content: [makeVendorTopSellingProduct()],
      totalPages: 1,
      totalElements: 1,
      last: true,
      first: true,
      numberOfElements: 1,
      size: 4,
      number: 0,
      empty: false,
    }),
  ),

  http.get("*/backend-api/dashboard/vendor/stock-summary", () => HttpResponse.json(makeVendorStockSummaryResponse())),

  http.get("*/backend-api/dashboard/vendor/geographic-distribution", () =>
    HttpResponse.json(makeVendorGeographicDistributionResponse()),
  ),
]
