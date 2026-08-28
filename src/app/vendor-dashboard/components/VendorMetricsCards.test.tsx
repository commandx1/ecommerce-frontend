import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorRevenueSummary, makeVendorReviewSummary } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import VendorMetricsCards from "./VendorMetricsCards"

const REVENUE_URL = "*/backend-api/dashboard/vendor/total-revenue-and-order-item-count"
const REVIEW_URL = "*/backend-api/dashboard/vendor/review-summary"

const signInVendor = () => {
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "token",
    isAuthenticated: true,
  })
}

const serveDashboard = (
  overrides: {
    revenue?: Partial<ReturnType<typeof makeVendorRevenueSummary>>
    review?: Partial<ReturnType<typeof makeVendorReviewSummary>>
  } = {},
) => {
  const revenueRequests: URLSearchParams[] = []
  server.use(
    http.get(REVENUE_URL, ({ request }) => {
      revenueRequests.push(new URL(request.url).searchParams)
      return HttpResponse.json(makeVendorRevenueSummary(overrides.revenue))
    }),
    http.get(REVIEW_URL, () => HttpResponse.json(makeVendorReviewSummary(overrides.review))),
  )
  return revenueRequests
}

/** Serves raw JSON bodies so C-axis cases can send malformed shapes the factories forbid. */
const serveRawDashboard = (revenueBody: unknown, reviewBody: unknown) => {
  server.use(
    http.get(REVENUE_URL, () => HttpResponse.json(revenueBody as object)),
    http.get(REVIEW_URL, () => HttpResponse.json(reviewBody as object)),
  )
}

beforeEach(() => {
  signInVendor()
})

describe("VendorMetricsCards", () => {
  it("shows loading skeletons before the dashboard summaries resolve", () => {
    serveDashboard()
    const { container } = render(<VendorMetricsCards />)

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })

  it("does not request dashboard data for an unauthenticated visitor", async () => {
    useAuthStore.getState().clearAuth()
    const revenueRequests = serveDashboard()
    render(<VendorMetricsCards />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(revenueRequests).toHaveLength(0)
  })

  it("renders the revenue, orders and rating cards with backend values formatted for display", async () => {
    serveDashboard({
      revenue: {
        totalRevenue: 12500.5,
        orderItemCount: 240,
        totalApprovedVendorPayment: 11800.75,
        approvedVendorPaymentCount: 230,
      },
      review: { currentReviewCount: 128, currentAverageRating: 4.567, ratingChangePercentage: 4.5 },
    })
    render(<VendorMetricsCards />)

    expect(await screen.findByText("$12,500.50")).toBeInTheDocument()
    expect(screen.getByText("240")).toBeInTheDocument()
    expect(screen.getByText("$11,800.75 approved payout (230)")).toBeInTheDocument()
    expect(screen.getByText("4.6")).toBeInTheDocument()
    expect(screen.getByText("+4.5%")).toBeInTheDocument()
  })

  it("shows a dash for the rating instead of 0.0 when the vendor has no reviews yet", async () => {
    serveDashboard({ review: { currentReviewCount: 0, currentAverageRating: 0, ratingChangePercentage: null } })
    render(<VendorMetricsCards />)

    expect(await screen.findByText("—")).toBeInTheDocument()
    expect(screen.queryByText("%")).not.toBeInTheDocument()
  })

  it("shows a negative rating change without a leading plus sign", async () => {
    serveDashboard({ review: { currentReviewCount: 50, ratingChangePercentage: -3.2 } })
    render(<VendorMetricsCards />)

    expect(await screen.findByText("-3.2%")).toBeInTheDocument()
  })

  it("refetches with the newly selected range when a range button is clicked", async () => {
    const revenueRequests = serveDashboard()
    render(<VendorMetricsCards />)
    await screen.findByText("$12,500.50")

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "7D" }))

    await waitFor(() => {
      expect(revenueRequests.at(-1)?.get("daysFromNow")).toBe("7")
    })
  })

  it("shows an error message and a Retry button instead of the cards when the summaries fail to load", async () => {
    server.use(
      http.get(REVENUE_URL, () => new HttpResponse(null, { status: 400 })),
      http.get(REVIEW_URL, () => HttpResponse.json(makeVendorReviewSummary())),
    )
    render(<VendorMetricsCards />)

    expect(await screen.findByText("Couldn't load your metrics. Please try again.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    expect(screen.queryByText(/^\$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/bad request/i)).not.toBeInTheDocument()
  })

  it("re-requests the summaries and renders the cards after a successful retry", async () => {
    server.use(
      http.get(REVENUE_URL, () => new HttpResponse(null, { status: 400 })),
      http.get(REVIEW_URL, () => HttpResponse.json(makeVendorReviewSummary())),
    )
    render(<VendorMetricsCards />)
    await screen.findByText("Couldn't load your metrics. Please try again.")

    serveDashboard({ revenue: { totalRevenue: 500 } })
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Retry" }))

    expect(await screen.findByText("$500.00")).toBeInTheDocument()
    expect(screen.queryByText("Couldn't load your metrics. Please try again.")).not.toBeInTheDocument()
  })

  // JSON has no NaN literal (`JSON.stringify(NaN) === "null"`), so a `NaN` case sent through
  // `HttpResponse.json` actually arrives at the component as `null` — Jackson can't emit a bare
  // NaN either without non-standard config, so this is the realistic worst case, not an
  // unreachable one. `formatCurrency`'s `Number.isFinite` guard covers both identically.
  it.each([
    ["totalRevenue null", { totalRevenue: null }, "$0.00"],
    ["totalRevenue NaN", { totalRevenue: Number.NaN }, "$0.00"],
    ["totalRevenue negative", { totalRevenue: -50 }, "-$50.00"],
    ["totalRevenue huge", { totalRevenue: 9_999_999_999 }, "$9,999,999,999.00"],
  ])("renders %s in the revenue card without crashing", async (_label, revenueOverrides, expectedText) => {
    serveRawDashboard(
      { ...makeVendorRevenueSummary(), ...revenueOverrides },
      makeVendorReviewSummary({ currentReviewCount: 0 }),
    )
    render(<VendorMetricsCards />)

    expect(await screen.findByText(expectedText)).toBeInTheDocument()
  })

  it.each([
    ["orderItemCount null", { orderItemCount: null }],
    ["orderItemCount missing", {}],
    ["approvedVendorPaymentCount null", { approvedVendorPaymentCount: null }],
  ])("never renders the literal string 'null' when %s", async (_label, revenueOverrides) => {
    const body = { ...makeVendorRevenueSummary(), ...revenueOverrides }
    if ("orderItemCount" in revenueOverrides === false && Object.keys(revenueOverrides).length === 0) {
      // "missing" case: drop the field entirely rather than setting it to a value.
      delete (body as Record<string, unknown>).orderItemCount
    }
    serveRawDashboard(body, makeVendorReviewSummary({ currentReviewCount: 0 }))
    render(<VendorMetricsCards />)

    await screen.findByText("Total Revenue")
    expect(screen.queryByText(/null/)).not.toBeInTheDocument()
  })

  it.each([
    ["currentAverageRating null while reviews exist", { currentAverageRating: null, currentReviewCount: 10 }],
    ["currentAverageRating a string", { currentAverageRating: "4.5", currentReviewCount: 10 }],
  ])("does not crash when %s", async (_label, reviewOverrides) => {
    serveRawDashboard(makeVendorRevenueSummary(), { ...makeVendorReviewSummary(), ...reviewOverrides })
    render(<VendorMetricsCards />)

    expect(await screen.findByText("Rating")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  // Same JSON-can't-carry-NaN caveat as above: this arrives as `null`, which the old
  // `!== null` check already handled — the point of the `Number.isFinite` guard is the
  // *other* non-finite shape a proxy/network glitch could still deliver, e.g. `Infinity`
  // is valid to construct but also collapses to `null` through JSON; both are covered.
  it("does not render 'NaN%' when ratingChangePercentage is not a finite number", async () => {
    serveRawDashboard(makeVendorRevenueSummary(), {
      ...makeVendorReviewSummary(),
      currentReviewCount: 10,
      ratingChangePercentage: Number.NaN,
    })
    render(<VendorMetricsCards />)

    await screen.findByText("Rating")
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })
})
