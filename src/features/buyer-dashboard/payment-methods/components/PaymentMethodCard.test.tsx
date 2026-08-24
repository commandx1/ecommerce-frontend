import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@/test/render"
import type { SavedPaymentMethod } from "../paymentMethodsData"
import PaymentMethodCard from "./PaymentMethodCard"

const makeMethod = (overrides: Partial<SavedPaymentMethod> = {}): SavedPaymentMethod => ({
  id: "pm-1",
  type: "visa",
  brandLabel: "Visa",
  nickname: "Main Clinic Card",
  last4: "4532",
  cardholder: "",
  expiryMonth: "09",
  expiryYear: "2028",
  billingAddress: "",
  status: "active",
  openToAutoPayment: false,
  autoOrderCard: false,
  ...overrides,
})

type Props = React.ComponentProps<typeof PaymentMethodCard>

const renderCard = (overrides: Partial<Props> = {}) => {
  const handlers = {
    setDeletePopoverOpenId: vi.fn(),
    setDefaultPopoverOpenId: vi.fn(),
    onRename: vi.fn(),
    onRemove: vi.fn(),
    onSetDefault: vi.fn(),
    onEnableAutoPayments: vi.fn(),
    onUseForAutoOrders: vi.fn(),
    onRequestStopAutoOrders: vi.fn(),
  }

  render(
    <PaymentMethodCard
      method={makeMethod()}
      deletingId={null}
      settingDefaultId={null}
      upgradingId={null}
      autoOrderCardActionId={null}
      deletePopoverOpenId={null}
      defaultPopoverOpenId={null}
      {...handlers}
      {...overrides}
    />,
  )

  return handlers
}

describe("PaymentMethodCard", () => {
  it("shows the masked number and expiry, never a full card number", () => {
    renderCard({ method: makeMethod({ last4: "4532", expiryMonth: "09", expiryYear: "2028" }) })

    expect(screen.getByText("•••• 4532")).toBeInTheDocument()
    expect(screen.getByText("09/2028")).toBeInTheDocument()
  })

  it("marks the default card and offers no way to re-select it", () => {
    renderCard({ method: makeMethod({ status: "default" }) })

    expect(screen.getByText("Default")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Default Card" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Set as Default" })).not.toBeInTheDocument()
  })

  it("asks for confirmation before promoting a card to default", async () => {
    const user = userEvent.setup()
    const handlers = renderCard({ method: makeMethod({ status: "active" }), defaultPopoverOpenId: "pm-1" })

    expect(handlers.onSetDefault).not.toHaveBeenCalled()
    const popover = await screen.findByText("Set as default?")
    await user.click(within(popover.closest("div") as HTMLElement).getByRole("button", { name: "OK" }))

    expect(handlers.onSetDefault).toHaveBeenCalledWith(expect.objectContaining({ id: "pm-1" }))
  })

  it("warns inside the delete confirmation that removing the auto order card pauses auto orders", async () => {
    const user = userEvent.setup()
    const handlers = renderCard({
      method: makeMethod({ openToAutoPayment: true, autoOrderCard: true }),
      deletePopoverOpenId: "pm-1",
    })

    const popover = (await screen.findByText("Remove card?")).closest("div") as HTMLElement
    expect(within(popover).getByText(/removing it pauses all of your active auto orders/)).toBeInTheDocument()

    await user.click(within(popover).getByRole("button", { name: "Remove" }))
    expect(handlers.onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: "pm-1" }))
  })

  it("omits the auto order warning for an ordinary card", async () => {
    renderCard({ method: makeMethod({ autoOrderCard: false }), deletePopoverOpenId: "pm-1" })

    expect(await screen.findByText("Remove card?")).toBeInTheDocument()
    expect(screen.queryByText(/pauses all of your active auto orders/)).not.toBeInTheDocument()
  })

  it("offers the auto-payment upgrade, not the auto order switch, for an on-session card", async () => {
    const user = userEvent.setup()
    const handlers = renderCard({ method: makeMethod({ openToAutoPayment: false }) })

    expect(screen.queryByRole("button", { name: "Use for auto orders" })).not.toBeInTheDocument()
    expect(screen.getByText("Why can't I use this card for auto orders?")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Enable automatic payments" }))
    expect(handlers.onEnableAutoPayments).toHaveBeenCalledWith(expect.objectContaining({ id: "pm-1" }))
  })

  it("offers the auto order switch once the card carries an off-session mandate", async () => {
    const user = userEvent.setup()
    const handlers = renderCard({ method: makeMethod({ openToAutoPayment: true, autoOrderCard: false }) })

    expect(screen.getByText("Auto payments on")).toBeInTheDocument()
    expect(screen.queryByText("Why can't I use this card for auto orders?")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Use for auto orders" }))
    expect(handlers.onUseForAutoOrders).toHaveBeenCalledWith(expect.objectContaining({ id: "pm-1" }))
  })

  it("routes stopping auto orders through a confirmation request", async () => {
    const user = userEvent.setup()
    const handlers = renderCard({ method: makeMethod({ openToAutoPayment: true, autoOrderCard: true }) })

    expect(screen.getByText("Auto order card")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Stop using for auto orders" }))
    expect(handlers.onRequestStopAutoOrders).toHaveBeenCalledWith(expect.objectContaining({ id: "pm-1" }))
  })

  it("disables the destructive action while its request is in flight", async () => {
    renderCard({ method: makeMethod(), deletePopoverOpenId: "pm-1", deletingId: "pm-1" })

    const popover = (await screen.findByText("Remove card?")).closest("div") as HTMLElement
    expect(within(popover).getByRole("button", { name: "Remove" })).toBeDisabled()
  })

  it("opens the rename flow", async () => {
    const user = userEvent.setup()
    const handlers = renderCard()

    await user.click(screen.getByRole("button", { name: "Rename" }))
    expect(handlers.onRename).toHaveBeenCalledWith(expect.objectContaining({ id: "pm-1" }))
  })
})
