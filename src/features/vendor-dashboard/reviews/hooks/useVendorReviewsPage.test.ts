import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { VendorReviewDashboard, VendorReviewItem } from "@/lib/api/vendor-reviews"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import { useVendorReviewsPage } from "./useVendorReviewsPage"

const review = (overrides: Partial<VendorReviewItem> = {}): VendorReviewItem => ({
  id: "r-1",
  productId: "p-1",
  productName: "Composite Kit",
  star: 5,
  title: "Excellent",
  comment: "Works exactly as described.",
  reviewerName: "Jane Doe",
  reviewerClinic: "Pacific Dental",
  createdDate: "2026-08-01T10:00:00Z",
  peopleFoundHelpful: 3,
  ...overrides,
})

const dashboard = (overrides: Partial<VendorReviewDashboard> = {}): VendorReviewDashboard => ({
  averageRating: 4.5,
  totalReviews: 2,
  positiveReviews: 2,
  positiveRatio: 100,
  reviewedProducts: 1,
  starBreakdown: { "5": 1, "4": 1, "3": 0, "2": 0, "1": 0 },
  reviews: [review(), review({ id: "r-2", star: 4 })],
  ...overrides,
})

const serveDashboard = (body: VendorReviewDashboard) => {
  server.use(http.get("*/api/reviews/vendor", () => HttpResponse.json(body)))
}

beforeEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("useVendorReviewsPage", () => {
  it("starts loading and resolves into the KPIs and rating breakdown once the dashboard loads", async () => {
    serveDashboard(dashboard())
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorReviewsPage(), { wrapper })

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(false)
    expect(result.current.totalReviews).toBe(2)
    expect(result.current.averageRating).toBe(4.5)
    expect(result.current.reviews).toHaveLength(2)
    expect(result.current.ratingBreakdown.map((entry) => entry.stars)).toEqual([5, 4, 3, 2, 1])
  })

  it("flags an error and zeroes the KPIs when the dashboard fetch fails, without ever retrying", async () => {
    let requests = 0
    server.use(
      http.get("*/api/reviews/vendor", () => {
        requests += 1
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorReviewsPage(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(true)
    expect(result.current.totalReviews).toBe(0)
    expect(result.current.averageRating).toBe(0)
    expect(result.current.reviews).toEqual([])
    expect(requests).toBe(1)
  })

  it("shows the empty state (no loading, no error) instead of calling the API when there is no access token", async () => {
    useAuthStore.getState().clearAuth()
    const requested = vi.fn()
    server.use(
      http.get("*/api/reviews/vendor", () => {
        requested()
        return HttpResponse.json(dashboard())
      }),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorReviewsPage(), { wrapper })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
    expect(result.current.reviews).toEqual([])
    expect(requested).not.toHaveBeenCalled()
  })

  it("normalizes a malformed 200 body (non-array reviews) into an empty list instead of crashing", async () => {
    serveDashboard({ ...dashboard(), reviews: null as unknown as VendorReviewItem[] })
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorReviewsPage(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(false)
    expect(result.current.reviews).toEqual([])
  })

  it("filters reviews by the selected star and clears back to the full list", async () => {
    serveDashboard(dashboard())
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorReviewsPage(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setSelectedStars(4))
    expect(result.current.selectedStars).toBe(4)
    expect(result.current.reviews).toHaveLength(1)
    expect(result.current.reviews[0]?.id).toBe("r-2")

    act(() => result.current.setSelectedStars(null))
    expect(result.current.selectedStars).toBeNull()
    expect(result.current.reviews).toHaveLength(2)
  })
})
