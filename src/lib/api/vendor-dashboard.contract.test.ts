import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import {
  makeVendorGeographicDistributionResponse,
  makeVendorPeriodicRevenueResponse,
  makeVendorRevenueSummary,
  makeVendorReviewSummary,
  makeVendorStockSummaryResponse,
  makeVendorTopSellingProduct,
} from "@/test/factories"
import { vendorDashboardAPI } from "./vendor-dashboard"

const revenueSummary = makeVendorRevenueSummary()
const reviewSummary = makeVendorReviewSummary()
const periodicRevenue = makeVendorPeriodicRevenueResponse()
const stockSummary = makeVendorStockSummaryResponse()
const geoDistribution = makeVendorGeographicDistributionResponse()
const topSellingPage = {
  content: [makeVendorTopSellingProduct()],
  totalPages: 1,
  totalElements: 1,
  last: true,
  first: true,
  numberOfElements: 1,
  size: 4,
  number: 0,
  empty: false,
}

let capturedRevenueQuery: URLSearchParams | null = null
let capturedPeriodicQuery: URLSearchParams | null = null
let capturedTopSellingQuery: URLSearchParams | null = null
let capturedStockQuery: URLSearchParams | null = null
let capturedGeoQuery: URLSearchParams | null = null

beforeEach(() => {
  capturedRevenueQuery = null
  capturedPeriodicQuery = null
  capturedTopSellingQuery = null
  capturedStockQuery = null
  capturedGeoQuery = null

  server.use(
    http.get("*/backend-api/dashboard/vendor/total-revenue-and-order-item-count", ({ request }) => {
      capturedRevenueQuery = new URL(request.url).searchParams
      return HttpResponse.json(revenueSummary)
    }),
    http.get("*/backend-api/dashboard/vendor/review-summary", () => HttpResponse.json(reviewSummary)),
    http.get("*/backend-api/dashboard/vendor/periodic-revenue", ({ request }) => {
      capturedPeriodicQuery = new URL(request.url).searchParams
      return HttpResponse.json(periodicRevenue)
    }),
    http.get("*/backend-api/dashboard/vendor/top-selling-products", ({ request }) => {
      capturedTopSellingQuery = new URL(request.url).searchParams
      return HttpResponse.json(topSellingPage)
    }),
    http.get("*/backend-api/dashboard/vendor/stock-summary", ({ request }) => {
      capturedStockQuery = new URL(request.url).searchParams
      return HttpResponse.json(stockSummary)
    }),
    http.get("*/backend-api/dashboard/vendor/geographic-distribution", ({ request }) => {
      capturedGeoQuery = new URL(request.url).searchParams
      return HttpResponse.json(geoDistribution)
    }),
  )
})

describe("vendorDashboardAPI.getRevenueSummary contract", () => {
  it("defaults daysFromNow to 30 and returns the typed summary", async () => {
    const response = await vendorDashboardAPI.getRevenueSummary()

    expect(capturedRevenueQuery?.get("daysFromNow")).toBe("30")
    expect(response).toEqual(revenueSummary)
  })

  it("sends a custom daysFromNow window", async () => {
    await vendorDashboardAPI.getRevenueSummary(7)

    expect(capturedRevenueQuery?.get("daysFromNow")).toBe("7")
  })

  it("returns a zeroed summary for a brand-new vendor with no sales", async () => {
    server.use(
      http.get("*/backend-api/dashboard/vendor/total-revenue-and-order-item-count", () =>
        HttpResponse.json({
          totalRevenue: 0,
          orderItemCount: 0,
          totalApprovedVendorPayment: 0,
          approvedVendorPaymentCount: 0,
          message: "No orders yet",
        }),
      ),
    )

    const response = await vendorDashboardAPI.getRevenueSummary()

    expect(response.totalRevenue).toBe(0)
    expect(response.orderItemCount).toBe(0)
  })

  it("rejects with a 401 and marks the error auth-handled", async () => {
    server.use(
      http.get("*/backend-api/dashboard/vendor/total-revenue-and-order-item-count", () =>
        HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
      ),
    )

    const error = await vendorDashboardAPI.getRevenueSummary().catch((e) => e)

    expect(error.response?.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("supports request cancellation via AbortSignal", async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(vendorDashboardAPI.getRevenueSummary(30, controller.signal)).rejects.toBeDefined()
  })
})

describe("vendorDashboardAPI.getReviewSummary contract", () => {
  it("returns the typed review summary", async () => {
    const response = await vendorDashboardAPI.getReviewSummary()

    expect(response).toEqual(reviewSummary)
  })

  it("tolerates a null ratingChangePercentage for a vendor with no prior period", async () => {
    server.use(
      http.get("*/backend-api/dashboard/vendor/review-summary", () =>
        HttpResponse.json({
          currentAverageRating: 0,
          currentReviewCount: 0,
          previousAverageRating: 0,
          previousReviewCount: 0,
          ratingChangePercentage: null,
        }),
      ),
    )

    const response = await vendorDashboardAPI.getReviewSummary()

    expect(response.ratingChangePercentage).toBeNull()
  })

  it("rejects with a 500 server error", async () => {
    server.use(
      http.get("*/backend-api/dashboard/vendor/review-summary", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 }),
      ),
    )

    await expect(vendorDashboardAPI.getReviewSummary()).rejects.toThrow(/500/)
  })
})

describe("vendorDashboardAPI.getPeriodicRevenue contract", () => {
  it("sends no params by default", async () => {
    await vendorDashboardAPI.getPeriodicRevenue()

    expect(capturedPeriodicQuery?.has("months")).toBe(false)
    expect(capturedPeriodicQuery?.has("year")).toBe(false)
  })

  it("sends months/year filters when provided", async () => {
    await vendorDashboardAPI.getPeriodicRevenue({ months: 6, year: 2026 })

    expect(capturedPeriodicQuery?.get("months")).toBe("6")
    expect(capturedPeriodicQuery?.get("year")).toBe("2026")
  })

  it("tolerates an empty periods array for a new vendor", async () => {
    server.use(http.get("*/backend-api/dashboard/vendor/periodic-revenue", () => HttpResponse.json({ periods: [] })))

    const response = await vendorDashboardAPI.getPeriodicRevenue()

    expect(response.periods).toEqual([])
  })
})

describe("vendorDashboardAPI.getTopSellingProducts contract", () => {
  it("defaults to page 0, size 4, daysFromNow 30, sortDir desc (0-indexed pagination)", async () => {
    await vendorDashboardAPI.getTopSellingProducts()

    expect(capturedTopSellingQuery?.get("page")).toBe("0")
    expect(capturedTopSellingQuery?.get("size")).toBe("4")
    expect(capturedTopSellingQuery?.get("daysFromNow")).toBe("30")
    expect(capturedTopSellingQuery?.get("sortDir")).toBe("desc")
  })

  it("sends explicit paging and sort params", async () => {
    await vendorDashboardAPI.getTopSellingProducts(2, 10, 90, "asc")

    expect(capturedTopSellingQuery?.get("page")).toBe("2")
    expect(capturedTopSellingQuery?.get("size")).toBe("10")
    expect(capturedTopSellingQuery?.get("daysFromNow")).toBe("90")
    expect(capturedTopSellingQuery?.get("sortDir")).toBe("asc")
  })

  it("returns the typed Spring page envelope", async () => {
    const response = await vendorDashboardAPI.getTopSellingProducts()

    expect(response.content).toEqual([makeVendorTopSellingProduct()])
    expect(response.empty).toBe(false)
  })

  it("tolerates an empty page for a vendor with no sales yet", async () => {
    server.use(
      http.get("*/backend-api/dashboard/vendor/top-selling-products", () =>
        HttpResponse.json({
          content: [],
          totalPages: 0,
          totalElements: 0,
          last: true,
          first: true,
          numberOfElements: 0,
          size: 4,
          number: 0,
          empty: true,
        }),
      ),
    )

    const response = await vendorDashboardAPI.getTopSellingProducts()

    expect(response.content).toEqual([])
    expect(response.empty).toBe(true)
  })
})

describe("vendorDashboardAPI.getStockSummary contract", () => {
  it("defaults to page 0, size 3 (0-indexed pagination)", async () => {
    await vendorDashboardAPI.getStockSummary()

    expect(capturedStockQuery?.get("page")).toBe("0")
    expect(capturedStockQuery?.get("size")).toBe("3")
  })

  it("sends explicit paging params", async () => {
    await vendorDashboardAPI.getStockSummary(1, 5)

    expect(capturedStockQuery?.get("page")).toBe("1")
    expect(capturedStockQuery?.get("size")).toBe("5")
  })

  it("returns the typed stock buckets and critical stock alert page", async () => {
    const response = await vendorDashboardAPI.getStockSummary()

    expect(response).toEqual(stockSummary)
  })

  it("tolerates a new vendor with 100% in-stock and no critical alerts", async () => {
    server.use(
      http.get("*/backend-api/dashboard/vendor/stock-summary", () =>
        HttpResponse.json({
          outOfStock: { count: 0, percentage: 0 },
          lowStock: { count: 0, percentage: 0 },
          inStock: { count: 0, percentage: 0 },
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
        }),
      ),
    )

    const response = await vendorDashboardAPI.getStockSummary()

    expect(response.criticStockAlerts.content).toEqual([])
  })
})

describe("vendorDashboardAPI.getGeographicDistribution contract", () => {
  it("omits daysFromNow when not provided", async () => {
    await vendorDashboardAPI.getGeographicDistribution()

    expect(capturedGeoQuery?.has("daysFromNow")).toBe(false)
  })

  it("sends daysFromNow when provided", async () => {
    await vendorDashboardAPI.getGeographicDistribution(14)

    expect(capturedGeoQuery?.get("daysFromNow")).toBe("14")
  })

  it("returns the typed city breakdown", async () => {
    const response = await vendorDashboardAPI.getGeographicDistribution()

    expect(response).toEqual(geoDistribution)
  })

  it("tolerates an empty city list and null previous-period counts for a new vendor", async () => {
    server.use(
      http.get("*/backend-api/dashboard/vendor/geographic-distribution", () =>
        HttpResponse.json({ cities: [], totalBuyerCount: 0, previousTotalBuyerCount: null }),
      ),
    )

    const response = await vendorDashboardAPI.getGeographicDistribution()

    expect(response.cities).toEqual([])
    expect(response.previousTotalBuyerCount).toBeNull()
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/backend-api/dashboard/vendor/geographic-distribution", () => HttpResponse.error()))

    await expect(vendorDashboardAPI.getGeographicDistribution()).rejects.toThrow()
  })
})
