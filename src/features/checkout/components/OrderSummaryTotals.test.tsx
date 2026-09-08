import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import OrderSummaryTotals from "./OrderSummaryTotals"

const renderTotals = (overrides: Partial<React.ComponentProps<typeof OrderSummaryTotals>> = {}) =>
  render(
    <OrderSummaryTotals
      isTaxLoading={false}
      itemCount={3}
      subtotal={1234.5}
      shipping={0}
      hasSelectedShipping={false}
      heavyShipmentFee={0}
      tax={98.76}
      total={1333.26}
      volumeDiscount={0}
      {...overrides}
    />,
  )

const amountFor = (label: string | RegExp) => screen.getByText(label).nextElementSibling?.textContent

describe("OrderSummaryTotals", () => {
  it("formats money with a thousands separator", () => {
    renderTotals()

    expect(amountFor("Subtotal (3 items)")).toBe("$1,234.50")
    expect(screen.getByText("$1,333.26")).toBeInTheDocument()
  })

  it("does not show the shipment fee row until a shipping method is selected", () => {
    renderTotals({ hasSelectedShipping: false, shipping: 0 })

    expect(screen.queryByText("Shipment fee")).not.toBeInTheDocument()
  })

  it("shows 'Free' rather than $0.00 for waived shipping once a method is selected", () => {
    renderTotals({ hasSelectedShipping: true, shipping: 0, heavyShipmentFee: 0 })

    expect(amountFor("Shipment fee")).toBe("Free")
    expect(screen.queryByText("Heavy shipment fee")).not.toBeInTheDocument()
  })

  it("shows the selected method's shipping cost once a method is selected", () => {
    renderTotals({ hasSelectedShipping: true, shipping: 8.5, heavyShipmentFee: 75 })

    expect(amountFor("Shipment fee")).toBe("$8.50")
    expect(amountFor("Heavy shipment fee")).toBe("$75.00")
  })

  it("hides the heavy shipment fee row when it is zero", () => {
    renderTotals({ hasSelectedShipping: true, shipping: 8.5, heavyShipmentFee: 0 })

    expect(screen.queryByText("Heavy shipment fee")).not.toBeInTheDocument()
  })

  it("never renders a 'Total shipment fee' row", () => {
    renderTotals({ hasSelectedShipping: true, shipping: 8.5, heavyShipmentFee: 75 })

    expect(screen.queryByText("Total shipment fee")).not.toBeInTheDocument()
  })

  it("hides the volume discount row when there is no discount", () => {
    renderTotals({ volumeDiscount: 0 })

    expect(screen.queryByText("Volume discount (5%)")).not.toBeInTheDocument()
  })

  it("shows the volume discount as a negative amount", () => {
    renderTotals({ volumeDiscount: 61.73 })

    expect(amountFor("Volume discount (5%)")).toBe("-$61.73")
  })

  it("replaces the tax amount with a spinner while it is being estimated", () => {
    const { container } = renderTotals({ isTaxLoading: true, tax: 98.76 })

    expect(screen.queryByText("$98.76")).not.toBeInTheDocument()
    expect(container.querySelector(".animate-spin")).toBeInTheDocument()
  })

  // Regression: an unestimated tax (no address yet, or the estimate call failed) used to render
  // as "$0.00", which understated the real charge the backend collects at payment time.
  it("shows 'Calculated at checkout' instead of $0.00 when tax could not be estimated", () => {
    renderTotals({ tax: null, total: 1234.5 })

    expect(screen.getByText("Calculated at checkout")).toBeInTheDocument()
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument()
    expect(screen.getByText("Excludes tax — calculated at checkout.")).toBeInTheDocument()
  })

  it("does not show the excludes-tax note while a real tax figure is shown", () => {
    renderTotals({ tax: 98.76 })

    expect(screen.queryByText(/Excludes tax/)).not.toBeInTheDocument()
  })

  it("does not show the excludes-tax note while tax is still loading", () => {
    renderTotals({ isTaxLoading: true, tax: null })

    expect(screen.queryByText(/Excludes tax/)).not.toBeInTheDocument()
  })
})
