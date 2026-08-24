import { describe, expect, it } from "vitest"
import type { AutoOrderLine } from "@/features/checkout/hooks/useCheckoutAutoOrder"
import { render, screen } from "@/test/render"
import FinalReviewAutoOrderSummary from "./FinalReviewAutoOrderSummary"

const line = (overrides: Partial<AutoOrderLine> = {}): AutoOrderLine => ({
  userProductId: "up-1",
  productName: "Intra Oral Mixing Tips",
  quantity: 2,
  period: "ONE_MONTH",
  periodLabel: "Every 30 days",
  ...overrides,
})

describe("FinalReviewAutoOrderSummary", () => {
  it("renders nothing when the order has no recurring lines", () => {
    render(<FinalReviewAutoOrderSummary autoOrderLines={[]} />)

    expect(screen.queryByRole("heading", { name: "Repeat orders" })).not.toBeInTheDocument()
  })

  it("lists each recurring line with its quantity and cadence", () => {
    render(
      <FinalReviewAutoOrderSummary
        autoOrderLines={[
          line({ userProductId: "up-1", productName: "Mixing Tips", quantity: 2, periodLabel: "Every 30 days" }),
          line({ userProductId: "up-2", productName: "Gloves", quantity: 5, periodLabel: "Every 15 days" }),
        ]}
      />,
    )

    expect(screen.getByRole("heading", { name: "Repeat orders" })).toBeInTheDocument()
    expect(screen.getByText("Mixing Tips").textContent).toContain("× 2")
    expect(screen.getByText("Gloves").textContent).toContain("× 5")
    expect(screen.getByText("Every 30 days")).toBeInTheDocument()
    expect(screen.getByText("Every 15 days")).toBeInTheDocument()
  })

  it("tells the buyer the countdown starts at payment and where to manage it", () => {
    render(<FinalReviewAutoOrderSummary autoOrderLines={[line()]} />)

    expect(screen.getByText(/Repeats start counting from the day this payment goes through/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Auto Orders" })).toHaveAttribute("href", "/buyer-dashboard/auto-orders")
  })
})
