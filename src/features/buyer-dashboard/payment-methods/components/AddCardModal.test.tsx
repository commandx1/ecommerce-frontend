import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { reactStripeMock } from "@/test/mocks/stripe"
import { render, screen } from "@/test/render"
import AddCardModal from "./AddCardModal"

vi.mock("@stripe/react-stripe-js", async () => reactStripeMock())

type Props = React.ComponentProps<typeof AddCardModal>

const renderModal = (overrides: Partial<Props> = {}) => {
  const handlers = {
    onNicknameChange: vi.fn(),
    onMakeDefaultChange: vi.fn(),
    onAllowAutoPaymentsChange: vi.fn(),
    onUseForAutoOrdersChange: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  }

  render(
    <AddCardModal
      isOpen
      isSaving={false}
      nickname=""
      makeDefault={false}
      allowAutoPayments
      useForAutoOrders={false}
      hasExistingAutoOrderCard={false}
      cardElementOptions={{}}
      {...handlers}
      {...overrides}
    />,
  )

  return handlers
}

describe("AddCardModal", () => {
  it("renders nothing while closed", () => {
    renderModal({ isOpen: false })

    expect(screen.queryByRole("heading", { name: "Add new card" })).not.toBeInTheDocument()
  })

  it("collects the card details through Stripe elements, never a raw input", () => {
    renderModal()

    expect(screen.getByLabelText("Card number")).toBeInTheDocument()
    expect(screen.getByLabelText("Expiration date")).toBeInTheDocument()
    expect(screen.getByLabelText("CVC")).toBeInTheDocument()
    expect(screen.getByText(/never stored on our servers/)).toBeInTheDocument()
  })

  it("reports nickname edits to the parent", async () => {
    const user = userEvent.setup()
    const handlers = renderModal()

    await user.type(screen.getByPlaceholderText("e.g. Main Clinic Card"), "A")

    expect(handlers.onNicknameChange).toHaveBeenCalledWith("A")
  })

  it("clears the auto order choice when automatic payments are switched off", async () => {
    const user = userEvent.setup()
    const handlers = renderModal({ allowAutoPayments: true, useForAutoOrders: true })

    await user.click(screen.getByLabelText(/Allow automatic payments for repeat orders/))

    expect(handlers.onAllowAutoPaymentsChange).toHaveBeenCalledWith(false)
    expect(handlers.onUseForAutoOrdersChange).toHaveBeenCalledWith(false)
  })

  it("does not reset the auto order choice when automatic payments are switched on", async () => {
    const user = userEvent.setup()
    const handlers = renderModal({ allowAutoPayments: false, useForAutoOrders: false })

    await user.click(screen.getByLabelText(/Allow automatic payments for repeat orders/))

    expect(handlers.onAllowAutoPaymentsChange).toHaveBeenCalledWith(true)
    expect(handlers.onUseForAutoOrdersChange).not.toHaveBeenCalled()
  })

  it("locks the auto order checkbox while automatic payments are off", () => {
    renderModal({ allowAutoPayments: false })

    expect(screen.getByLabelText(/Use this card for my auto orders/)).toBeDisabled()
  })

  it("warns that an existing auto order card will be replaced", () => {
    renderModal({ hasExistingAutoOrderCard: true })

    expect(screen.getByText(/this replaces the one you use today/)).toBeInTheDocument()
  })

  it("promises future repeats on this card when there is no auto order card yet", () => {
    renderModal({ hasExistingAutoOrderCard: false })

    expect(screen.getByText("Future repeat orders will be charged to this card.")).toBeInTheDocument()
  })

  it("disables every control while the card is being saved", () => {
    renderModal({ isSaving: true })

    expect(screen.getByPlaceholderText("e.g. Main Clinic Card")).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Save Card" })).toBeDisabled()
  })

  it("submits and cancels through the parent's callbacks", async () => {
    const user = userEvent.setup()
    const handlers = renderModal()

    await user.click(screen.getByRole("button", { name: "Save Card" }))
    expect(handlers.onSubmit).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(handlers.onClose).toHaveBeenCalledTimes(1)
  })
})
