import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { PaymentMethodOption } from "@/features/checkout/types"
import { render, screen } from "@/test/render"
import PaymentMethodSection from "./PaymentMethodSection"

const options: PaymentMethodOption[] = [
  { type: "card", icon: "card", title: "Credit / Debit Card", description: "Visa, Mastercard, Amex" },
  {
    type: "net30",
    icon: "file",
    title: "Net 30 Terms",
    description: "Pay within 30 days",
    badge: { label: "Approved", className: "bg-success/15 text-success" },
  },
]

describe("PaymentMethodSection", () => {
  it("renders one radio per option with its description", () => {
    render(
      <PaymentMethodSection paymentMethod={{ type: "card" }} paymentOptions={options} updatePaymentMethod={vi.fn()} />,
    )

    expect(screen.getByRole("radio", { name: /Credit \/ Debit Card/ })).toBeChecked()
    expect(screen.getByRole("radio", { name: /Net 30 Terms/ })).not.toBeChecked()
    expect(screen.getByText("Pay within 30 days")).toBeInTheDocument()
    expect(screen.getByText("Approved")).toBeInTheDocument()
  })

  it("reports the newly picked method to the store", async () => {
    const user = userEvent.setup()
    const updatePaymentMethod = vi.fn()
    render(
      <PaymentMethodSection
        paymentMethod={{ type: "card" }}
        paymentOptions={options}
        updatePaymentMethod={updatePaymentMethod}
      />,
    )

    await user.click(screen.getByRole("radio", { name: /Net 30 Terms/ }))

    expect(updatePaymentMethod).toHaveBeenCalledWith({ type: "net30" })
  })

  it("keeps all options in one radio group so only one can be chosen", () => {
    render(
      <PaymentMethodSection paymentMethod={{ type: "net30" }} paymentOptions={options} updatePaymentMethod={vi.fn()} />,
    )

    const radios = screen.getAllByRole("radio")
    expect(radios.every((radio) => radio.getAttribute("name") === "payment-method")).toBe(true)
    expect(radios.filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(1)
  })
})
