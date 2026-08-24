import type {
  VendorGeographicDistributionResponse,
  VendorPeriodicRevenueResponse,
  VendorRevenueSummary,
  VendorReviewSummary,
  VendorStockSummaryResponse,
  VendorTopSellingProduct,
} from "@/lib/api/vendor-dashboard"
import type { CompanyListItem, VendorListItem } from "@/lib/api/vendors"

export function makeVendorListItem(overrides: Partial<VendorListItem> = {}): VendorListItem {
  return {
    id: "vendor-1",
    name: "Acme Dental",
    slug: "acme-dental",
    averageRating: 4.6,
    reviewCount: 128,
    productCount: 340,
    companyName: "Acme Dental Supplies",
    description: "Trusted dental supplies vendor",
    companyPhoto: null,
    email: "sales@acmedental.example.com",
    ...overrides,
  }
}

export function makeCompanyListItem(overrides: Partial<CompanyListItem> = {}): CompanyListItem {
  return {
    id: "company-1",
    name: "Acme Dental Supplies",
    companyPhoto: null,
    slug: "acme-dental-supplies",
    averageRating: 4.6,
    reviewCount: 128,
    productCount: 340,
    ...overrides,
  }
}

export function makeVendorRevenueSummary(overrides: Partial<VendorRevenueSummary> = {}): VendorRevenueSummary {
  return {
    totalRevenue: 12500.5,
    orderItemCount: 240,
    totalApprovedVendorPayment: 11800.75,
    approvedVendorPaymentCount: 230,
    message: "OK",
    ...overrides,
  }
}

export function makeVendorReviewSummary(overrides: Partial<VendorReviewSummary> = {}): VendorReviewSummary {
  return {
    currentAverageRating: 4.6,
    currentReviewCount: 128,
    previousAverageRating: 4.4,
    previousReviewCount: 110,
    ratingChangePercentage: 4.5,
    ...overrides,
  }
}

export function makeVendorPeriodicRevenueResponse(
  overrides: Partial<VendorPeriodicRevenueResponse> = {},
): VendorPeriodicRevenueResponse {
  return {
    periods: [
      {
        period: "2026-07",
        periodMonth: 7,
        periodYear: 2026,
        totalRevenue: 4200,
        orderItemCount: 80,
        totalApprovedVendorPayment: 4000,
        approvedVendorPaymentCount: 78,
      },
    ],
    ...overrides,
  }
}

export function makeVendorTopSellingProduct(overrides: Partial<VendorTopSellingProduct> = {}): VendorTopSellingProduct {
  return {
    sellCount: 320,
    skuCode: "SKU-1",
    code: null,
    manufacturerCode: "MK-1001",
    productId: "p-1",
    userProductId: "up-1",
    coverPhotoPath: "/uploads/tips.png",
    name: "Intra Oral Mixing Tips",
    ...overrides,
  }
}

export function makeVendorStockSummaryResponse(
  overrides: Partial<VendorStockSummaryResponse> = {},
): VendorStockSummaryResponse {
  return {
    outOfStock: { count: 5, percentage: 5 },
    lowStock: { count: 12, percentage: 12 },
    inStock: { count: 83, percentage: 83 },
    criticStockAlerts: {
      content: [],
      totalPages: 0,
      totalElements: 0,
      last: true,
      first: true,
      numberOfElements: 0,
      size: 3,
      number: 0,
      empty: true,
    },
    ...overrides,
  }
}

export function makeVendorGeographicDistributionResponse(
  overrides: Partial<VendorGeographicDistributionResponse> = {},
): VendorGeographicDistributionResponse {
  return {
    cities: [
      {
        city: "New York",
        buyerCount: 42,
        percentage: 35,
        previousBuyerCount: 38,
        previousPercentage: 32,
        countChangePercentage: 10.5,
      },
    ],
    totalBuyerCount: 120,
    previousTotalBuyerCount: 108,
    ...overrides,
  }
}
