import { describe, expect, it } from "vitest"
import type { VendorRevenueSummary, VendorReviewSummary } from "@/lib/api/vendor-dashboard"
import { buildMetricCards } from "./build-metric-cards"

const revenue = (overrides: Partial<VendorRevenueSummary> = {}): VendorRevenueSummary => ({
  totalRevenue: 12500.5,
  orderItemCount: 240,
  totalApprovedVendorPayment: 11800.75,
  approvedVendorPaymentCount: 230,
  message: "",
  ...overrides,
})

const review = (overrides: Partial<VendorReviewSummary> = {}): VendorReviewSummary => ({
  currentAverageRating: 4.567,
  currentReviewCount: 128,
  previousAverageRating: 4.4,
  previousReviewCount: 100,
  ratingChangePercentage: 4.5,
  ...overrides,
})

describe("buildMetricCards", () => {
  it("formats the revenue card value, description and payout footer", () => {
    const [revenueCard] = buildMetricCards(revenue(), review(), 30)
    expect(revenueCard).toMatchObject({
      id: "revenue",
      value: "$12,500.50",
      description: "Last 30 days",
      footer: "$11,800.75 approved payout (230)",
    })
  })

  it("formats the orders card count for the given range", () => {
    const [, ordersCard] = buildMetricCards(revenue({ orderItemCount: 7 }), review(), 7)
    expect(ordersCard).toMatchObject({ id: "orders", value: "7", description: "Last 7 days" })
  })

  it("rounds the rating to one decimal and shows a positive change with a leading plus", () => {
    const [, , ratingCard] = buildMetricCards(
      revenue(),
      review({ currentAverageRating: 4.567, ratingChangePercentage: 4.5 }),
      30,
    )
    expect(ratingCard).toMatchObject({ value: "4.6", change: "+4.5%", changeType: "positive" })
  })

  it("shows a negative change without a leading plus sign", () => {
    const [, , ratingCard] = buildMetricCards(revenue(), review({ ratingChangePercentage: -3.2 }), 30)
    expect(ratingCard).toMatchObject({ change: "-3.2%", changeType: "negative" })
  })

  it("shows an em dash for the rating instead of 0.0 when there are no reviews yet", () => {
    const [, , ratingCard] = buildMetricCards(
      revenue(),
      review({ currentReviewCount: 0, currentAverageRating: 0, ratingChangePercentage: null }),
      30,
    )
    expect(ratingCard).toMatchObject({ value: "—", change: undefined })
  })

  it.each([
    ["totalRevenue null", { totalRevenue: null as unknown as number }, "$0.00"],
    ["totalRevenue NaN", { totalRevenue: Number.NaN }, "$0.00"],
    ["totalRevenue negative", { totalRevenue: -50 }, "-$50.00"],
  ])("never crashes on a malformed %s", (_label, overrides, expectedValue) => {
    const [revenueCard] = buildMetricCards(revenue(overrides), review(), 30)
    expect(revenueCard?.value).toBe(expectedValue)
  })

  it.each([
    ["orderItemCount null", { orderItemCount: null as unknown as number }],
    ["approvedVendorPaymentCount null", { approvedVendorPaymentCount: null as unknown as number }],
  ])("never renders the literal string 'null' for %s", (_label, overrides) => {
    const cards = buildMetricCards(revenue(overrides), review(), 30)
    expect(cards.some((card) => card.value.includes("null") || card.footer?.includes("null"))).toBe(false)
  })

  it("does not crash and shows a dash when currentAverageRating is not a finite number", () => {
    const [, , ratingCard] = buildMetricCards(
      revenue(),
      review({ currentAverageRating: "4.5" as unknown as number, currentReviewCount: 10 }),
      30,
    )
    expect(ratingCard?.value).toBe("—")
  })

  it("does not produce a 'NaN%' change when ratingChangePercentage is not finite", () => {
    const [, , ratingCard] = buildMetricCards(
      revenue(),
      review({ currentReviewCount: 10, ratingChangePercentage: Number.NaN }),
      30,
    )
    expect(ratingCard?.change).toBeUndefined()
  })
})
