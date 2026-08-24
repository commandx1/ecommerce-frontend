import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import CheckoutProgress from "./CheckoutProgress"

const stepState = (title: string) => {
  const label = screen.getByText(title)
  return label.nextElementSibling?.textContent ?? ""
}

describe("CheckoutProgress", () => {
  it("names all five checkout stages", () => {
    render(<CheckoutProgress currentStep={1} />)

    for (const title of [
      "Cart Review",
      "Shipping Details",
      "Billing Information",
      "Final Review",
      "Order Confirmation",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
  })

  it("marks earlier steps as completed and hides their number", () => {
    render(<CheckoutProgress currentStep={3} />)

    expect(stepState("Cart Review")).toBe("Completed")
    expect(stepState("Shipping Details")).toBe("Completed")
    expect(screen.queryByText("1")).not.toBeInTheDocument()
    expect(screen.queryByText("2")).not.toBeInTheDocument()
  })

  it("shows the current step's own subtitle", () => {
    render(<CheckoutProgress currentStep={3} />)

    expect(stepState("Billing Information")).toBe("Current step")
  })

  it("leaves later steps pending with their number still visible", () => {
    render(<CheckoutProgress currentStep={2} />)

    expect(stepState("Final Review")).toBe("Pending")
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("treats every step as completed on the confirmation step", () => {
    render(<CheckoutProgress currentStep={5} />)

    expect(stepState("Cart Review")).toBe("Completed")
    expect(stepState("Final Review")).toBe("Completed")
    expect(stepState("Order Confirmation")).toBe("Pending")
  })
})
