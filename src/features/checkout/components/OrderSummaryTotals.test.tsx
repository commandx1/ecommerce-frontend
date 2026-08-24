import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import OrderSummaryTotals from "./OrderSummaryTotals"

const renderTotals = (overrides: Partial<React.ComponentProps<typeof OrderSummaryTotals>> = {}) =>
  render(
    <OrderSummaryTotals
      isTaxLoading={false}
      itemCount={3}
      subtotal={1234.5}
      shipmentFee={0}
      heavyShipmentFee={0}
      totalShipmentFee={0}
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

  it("shows 'Free' rather than $0.00 for waived shipping", () => {
    renderTotals({ shipmentFee: 0, heavyShipmentFee: 0, totalShipmentFee: 0 })

    expect(amountFor("Shipment fee")).toBe("Free")
    expect(amountFor("Heavy shipment fee")).toBe("Free")
    expect(amountFor("Total shipment fee")).toBe("Free")
  })

  it("shows real shipping amounts when they are charged", () => {
    renderTotals({ shipmentFee: 8.5, heavyShipmentFee: 75, totalShipmentFee: 83.5 })

    expect(amountFor("Shipment fee")).toBe("$8.50")
    expect(amountFor("Heavy shipment fee")).toBe("$75.00")
    expect(amountFor("Total shipment fee")).toBe("$83.50")
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
})
