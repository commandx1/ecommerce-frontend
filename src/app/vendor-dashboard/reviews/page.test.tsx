import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { VendorReviewDashboard, VendorReviewItem } from "@/lib/api/vendor-reviews"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import VendorReviewsPage from "./page"

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
  reviews: [review(), review({ id: "r-2", star: 4, title: "Good", productName: "Mixing Tips" })],
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

describe("VendorReviewsPage", () => {
  it("summarises the review KPIs once loaded", async () => {
    serveDashboard(dashboard({ averageRating: 4.5, totalReviews: 2, positiveRatio: 100, reviewedProducts: 1 }))

    render(<VendorReviewsPage />)

    expect((await screen.findAllByText("4.5")).length).toBeGreaterThan(0)
    expect(screen.getByText("100%")).toBeInTheDocument()
    expect(screen.getByText("2 positive reviews (100%)")).toBeInTheDocument()
  })

  it("lists the latest reviews with reviewer and helpfulness context", async () => {
    serveDashboard(dashboard())

    render(<VendorReviewsPage />)

    expect(await screen.findByRole("heading", { name: "Excellent" })).toBeInTheDocument()
    expect(screen.getAllByText("Jane Doe • Pacific Dental").length).toBe(2)
    expect(screen.getAllByText("3 found helpful").length).toBe(2)
  })

  it("filters the feed when a star bucket is picked and clears again", async () => {
    const user = userEvent.setup()
    serveDashboard(dashboard())

    render(<VendorReviewsPage />)

    await user.click(await screen.findByRole("button", { name: /^4★/ }))

    expect(screen.getByText("4-Star Reviews")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Good" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Excellent" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show all" }))
    expect(screen.getByRole("heading", { name: "Excellent" })).toBeInTheDocument()
  })

  it("says which bucket is empty rather than showing a blank feed", async () => {
    const user = userEvent.setup()
    serveDashboard(dashboard({ starBreakdown: { "5": 2, "4": 0, "3": 0, "2": 0, "1": 0 } }))

    render(<VendorReviewsPage />)

    await user.click(await screen.findByRole("button", { name: /^1★/ }))

    expect(screen.getByText("No 1-star reviews yet.")).toBeInTheDocument()
  })

  it("shows an empty state when the vendor has no reviews at all", async () => {
    serveDashboard(dashboard({ reviews: [], totalReviews: 0, positiveReviews: 0, positiveRatio: 0, averageRating: 0 }))

    render(<VendorReviewsPage />)

    expect(await screen.findByText("No reviews yet for your products.")).toBeInTheDocument()
  })

  it("warns the vendor when the review feed cannot be loaded", async () => {
    server.use(http.get("*/api/reviews/vendor", () => new HttpResponse(null, { status: 500 })))

    render(<VendorReviewsPage />)

    expect(
      await screen.findByText("Reviews could not be loaded. Please refresh the page to try again."),
    ).toBeInTheDocument()
    // Zeroed KPIs are shown alongside the warning, so the numbers cannot be mistaken for real data
    expect(screen.getAllByText("0.0").length).toBeGreaterThan(0)
  })

  it("does not call the API when the vendor is not signed in", async () => {
    useAuthStore.getState().clearAuth()
    const requested = vi.fn()
    server.use(
      http.get("*/api/reviews/vendor", () => {
        requested()
        return HttpResponse.json(dashboard())
      }),
    )

    render(<VendorReviewsPage />)

    await waitFor(() => expect(screen.getByText("No reviews yet for your products.")).toBeInTheDocument())
    expect(requested).not.toHaveBeenCalled()
  })
})
