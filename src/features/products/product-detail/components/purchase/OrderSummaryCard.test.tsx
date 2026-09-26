import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import OrderSummaryCard from "./OrderSummaryCard"

const baseProps = {
  orderSummary: { product: "Dental Kit" },
  quantity: 1,
  unitPrice: 10,
  productTotal: 10,
  shippingFeePrice: 5,
  shippingPrice: 5,
  subtotal: 10,
  total: 15,
}

describe("OrderSummaryCard", () => {
  it("hides the heavy shipping surcharge row when there is no heavy fee", () => {
    render(<OrderSummaryCard {...baseProps} heavyShippingFeePrice={0} />)

    expect(screen.queryByText("Heavy shipping surcharge")).not.toBeInTheDocument()
  })

  it("shows the heavy shipping surcharge row when the fee is positive", () => {
    render(<OrderSummaryCard {...baseProps} heavyShippingFeePrice={7.5} />)

    expect(screen.getByText("Heavy shipping surcharge")).toBeInTheDocument()
    expect(screen.getByText("$7.50")).toBeInTheDocument()
  })
})
