import userEvent from "@testing-library/user-event"
import type { ComponentProps } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"

vi.mock("@stripe/react-stripe-js", async () => {
  const { reactStripeMock } = await import("@/test/mocks/stripe")
  return reactStripeMock()
})

import NewCardForm from "./NewCardForm"

type NewCardFormProps = ComponentProps<typeof NewCardForm>

const defaultProps = (): NewCardFormProps => ({
  cardName: "",
  setCardName: vi.fn(),
  saveCard: false,
  setSaveCard: vi.fn(),
  hasAutoOrderItems: false,
  newCardAutoPaymentConsent: false,
  setNewCardAutoPaymentConsent: vi.fn(),
})

const renderForm = (overrides: Partial<NewCardFormProps> = {}) =>
  render(<NewCardForm {...defaultProps()} {...overrides} />)

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("NewCardForm", () => {
  it("shows the Stripe fields", () => {
    renderForm()

    expect(screen.getByLabelText("Card number")).toBeInTheDocument()
    expect(screen.getByLabelText("Expiration date")).toBeInTheDocument()
    expect(screen.getByLabelText("CVC")).toBeInTheDocument()
  })

  it("checking 'save card' notifies the parent (controlled prop, no local state)", async () => {
    const user = userEvent.setup()
    const setSaveCard = vi.fn()
    renderForm({ setSaveCard })

    expect(screen.queryByLabelText("Card Name")).not.toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: /Save this card for future purchases/ }))

    expect(setSaveCard).toHaveBeenCalledWith(true)
  })

  it("shows the Card Name field when saveCard is true", () => {
    renderForm({ saveCard: true })

    expect(screen.getByLabelText("Card Name")).toBeInTheDocument()
  })

  it("forces and locks 'save card' when the order has auto order items", () => {
    renderForm({ hasAutoOrderItems: true })

    const checkbox = screen.getByRole("checkbox", { name: /Save this card for future purchases/ })
    expect(checkbox).toBeChecked()
    expect(checkbox).toBeDisabled()
    expect(screen.getByText(/Required for auto order items/)).toBeInTheDocument()
    expect(screen.getByLabelText("Card Name")).toBeInTheDocument()
  })

  it("offers the 'also allow auto orders' checkbox for a saved card, not for auto order items", () => {
    renderForm({ saveCard: true })

    expect(screen.getByText(/Also allow this card for automatic orders/)).toBeInTheDocument()
  })

  it("never renders a submit/cancel button of its own — tokenization happens on Continue to Review", () => {
    renderForm()

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
