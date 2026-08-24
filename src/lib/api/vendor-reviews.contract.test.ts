import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { getVendorReviewDashboard, type VendorReviewDashboard } from "./vendor-reviews"

const mockDashboard: VendorReviewDashboard = {
  averageRating: 4.6,
  totalReviews: 128,
  positiveReviews: 110,
  positiveRatio: 0.86,
  reviewedProducts: 24,
  starBreakdown: { "5": 90, "4": 20, "3": 10, "2": 5, "1": 3 },
  reviews: [
    {
      id: "review-1",
      productId: "product-1",
      productName: "Nitrile Gloves",
      star: 5,
      title: "Great fit",
      comment: "Comfortable and durable.",
      reviewerName: "Jane Doe",
      reviewerClinic: "Bright Smile Dental",
      createdDate: "2026-08-01T10:00:00Z",
      peopleFoundHelpful: 12,
    },
  ],
}

let capturedAuthHeader: string | null = null

beforeEach(() => {
  capturedAuthHeader = null

  server.use(
    http.get("*/api/reviews/vendor", ({ request }) => {
      capturedAuthHeader = request.headers.get("Authorization")
      return HttpResponse.json(mockDashboard)
    }),
  )
})

describe("getVendorReviewDashboard contract", () => {
  it("returns the typed dashboard on a happy path", async () => {
    const dashboard = await getVendorReviewDashboard("token-1")

    expect(dashboard).toEqual(mockDashboard)
  })

  it("sends the bearer token", async () => {
    await getVendorReviewDashboard("token-1")

    expect(capturedAuthHeader).toBe("Bearer token-1")
  })

  it("tolerates an empty reviews array and zeroed dashboard for a new vendor", async () => {
    server.use(
      http.get("*/api/reviews/vendor", () =>
        HttpResponse.json({
          averageRating: 0,
          totalReviews: 0,
          positiveReviews: 0,
          positiveRatio: 0,
          reviewedProducts: 0,
          starBreakdown: {},
          reviews: [],
        }),
      ),
    )

    const dashboard = await getVendorReviewDashboard("token-1")

    expect(dashboard?.reviews).toEqual([])
    expect(dashboard?.starBreakdown).toEqual({})
  })

  it("tolerates a review with a null reviewerClinic", async () => {
    server.use(
      http.get("*/api/reviews/vendor", () =>
        HttpResponse.json({ ...mockDashboard, reviews: [{ ...mockDashboard.reviews[0], reviewerClinic: null }] }),
      ),
    )

    const dashboard = await getVendorReviewDashboard("token-1")

    expect(dashboard?.reviews[0]?.reviewerClinic).toBeNull()
  })

  // `getVendorReviewDashboard` uses a plain `fetch` (not apiClient/apiRequest) wrapped in a
  // try/catch that swallows every failure into a `null` return - callers cannot distinguish a
  // 401 from a 404 from a network error here. This is the current, intentional-looking but
  // silent-failure-prone behavior; the tests below lock it in rather than fix it (see report).
  it("returns null (not a thrown error) on a 401", async () => {
    server.use(http.get("*/api/reviews/vendor", () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })))

    await expect(getVendorReviewDashboard("expired-token")).resolves.toBeNull()
  })

  it("returns null on a 403", async () => {
    server.use(http.get("*/api/reviews/vendor", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })))

    await expect(getVendorReviewDashboard("token-1")).resolves.toBeNull()
  })

  it("returns null on a 404", async () => {
    server.use(http.get("*/api/reviews/vendor", () => HttpResponse.json({ message: "Not found" }, { status: 404 })))

    await expect(getVendorReviewDashboard("token-1")).resolves.toBeNull()
  })

  it("returns null on a 500", async () => {
    server.use(http.get("*/api/reviews/vendor", () => HttpResponse.json({ message: "Server error" }, { status: 500 })))

    await expect(getVendorReviewDashboard("token-1")).resolves.toBeNull()
  })

  it("returns null on a network failure rather than rejecting", async () => {
    server.use(http.get("*/api/reviews/vendor", () => HttpResponse.error()))

    await expect(getVendorReviewDashboard("token-1")).resolves.toBeNull()
  })

  it("returns null when the response body is not valid JSON", async () => {
    server.use(http.get("*/api/reviews/vendor", () => new HttpResponse("not json", { status: 200 })))

    await expect(getVendorReviewDashboard("token-1")).resolves.toBeNull()
  })
})
