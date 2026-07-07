import apiClient from "./client"

export interface VendorRevenueSummary {
  totalRevenue: number
  orderItemCount: number
  totalApprovedVendorPayment: number
  approvedVendorPaymentCount: number
  message: string
}

export interface VendorReviewSummary {
  currentAverageRating: number
  currentReviewCount: number
  previousAverageRating: number
  previousReviewCount: number
  ratingChangePercentage: number | null
}

export interface VendorRevenuePeriod {
  period: string
  periodMonth: number | null
  periodYear: number
  totalRevenue: number
  orderItemCount: number
  totalApprovedVendorPayment: number
  approvedVendorPaymentCount: number
}

export interface VendorPeriodicRevenueResponse {
  periods: VendorRevenuePeriod[]
}

export interface SpringPage<T> {
  content: T[]
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  numberOfElements: number
  size: number
  number: number
  empty: boolean
}

export interface VendorTopSellingProduct {
  sellCount: number
  skuCode: string | null
  code: string | null
  manufacturerCode: string | null
  productId: string
  userProductId: string
  coverPhotoPath: string | null
  name: string
}

export interface VendorStockBucket {
  count: number
  percentage: number
}

export interface VendorCriticalStockAlert {
  stock: number
  name: string
  coverPhotoPath: string | null
  manufacturerCode: string | null
  skuCode: string | null
  userProductId: string
}

export interface VendorStockSummaryResponse {
  outOfStock: VendorStockBucket
  lowStock: VendorStockBucket
  inStock: VendorStockBucket
  criticStockAlerts: SpringPage<VendorCriticalStockAlert>
}

export interface VendorGeographicCity {
  city: string
  buyerCount: number
  percentage: number
  previousBuyerCount: number | null
  previousPercentage: number | null
  countChangePercentage: number | null
}

export interface VendorGeographicDistributionResponse {
  cities: VendorGeographicCity[]
  totalBuyerCount: number
  previousTotalBuyerCount: number | null
}

class VendorDashboardAPI {
  async getRevenueSummary(daysFromNow = 30, signal?: AbortSignal): Promise<VendorRevenueSummary> {
    const response = await apiClient.get<VendorRevenueSummary>("/dashboard/vendor/total-revenue-and-order-item-count", {
      params: { daysFromNow },
      signal,
    })
    return response.data
  }

  async getReviewSummary(signal?: AbortSignal): Promise<VendorReviewSummary> {
    const response = await apiClient.get<VendorReviewSummary>("/dashboard/vendor/review-summary", { signal })
    return response.data
  }

  async getPeriodicRevenue(
    params?: { months?: number; year?: number },
    signal?: AbortSignal,
  ): Promise<VendorPeriodicRevenueResponse> {
    const response = await apiClient.get<VendorPeriodicRevenueResponse>("/dashboard/vendor/periodic-revenue", {
      params,
      signal,
    })
    return response.data
  }

  async getTopSellingProducts(
    page = 0,
    size = 4,
    daysFromNow = 30,
    sortDir: "asc" | "desc" = "desc",
    signal?: AbortSignal,
  ): Promise<SpringPage<VendorTopSellingProduct>> {
    const response = await apiClient.get<SpringPage<VendorTopSellingProduct>>(
      "/dashboard/vendor/top-selling-products",
      { params: { page, size, daysFromNow, sortDir }, signal },
    )
    return response.data
  }

  async getStockSummary(page = 0, size = 3, signal?: AbortSignal): Promise<VendorStockSummaryResponse> {
    const response = await apiClient.get<VendorStockSummaryResponse>("/dashboard/vendor/stock-summary", {
      params: { page, size },
      signal,
    })
    return response.data
  }

  async getGeographicDistribution(
    daysFromNow?: number,
    signal?: AbortSignal,
  ): Promise<VendorGeographicDistributionResponse> {
    const response = await apiClient.get<VendorGeographicDistributionResponse>(
      "/dashboard/vendor/geographic-distribution",
      { params: daysFromNow ? { daysFromNow } : undefined, signal },
    )
    return response.data
  }
}

export const vendorDashboardAPI = new VendorDashboardAPI()
