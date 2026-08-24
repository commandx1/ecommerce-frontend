import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CartTotals } from "@/features/cart/types"
import { render, screen } from "@/test/render"
import CartSummaryPanel from "./CartSummaryPanel"

const makeTotals = (overrides: Partial<CartTotals> = {}): CartTotals => ({
  subtotal: 112,
  shipmentFee: 10,
  heavyShipmentFee: 0,
  totalShipmentFee: 10,
  tax: 8.5,
  total: 130.5,
  ...overrides,
})

type PanelProps = Parameters<typeof CartSummaryPanel>[0]

const renderPanel = (overrides: Partial<PanelProps> = {}) => {
  const props: PanelProps = {
    autoOrderItemsCount: 0,
    blockingItemsCount: 0,
    hasBlockingItems: false,
    isCheckoutDisabled: false,
    isLicenseBlocked: false,
    isTaxLoading: false,
    itemsCount: 2,
    onCheckout: vi.fn(),
    totals: makeTotals(),
    ...overrides,
  }
  render(<CartSummaryPanel {...props} />)
  return props
}

const checkoutButton = () => screen.getByRole("button", { name: /Proceed to Checkout/i })

describe("CartSummaryPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("breaks the order down into formatted money rows", () => {
    renderPanel({ itemsCount: 3, totals: makeTotals({ subtotal: 1234.5, total: 1253 }) })

    expect(screen.getByText("Subtotal (3 items)")).toBeInTheDocument()
    expect(screen.getByText("$1,234.50")).toBeInTheDocument()
    expect(screen.getByText("$1,253.00")).toBeInTheDocument()
    expect(screen.getByText("$8.50")).toBeInTheDocument()
  })

  it('labels a zero shipment fee as "Free" rather than $0.00', () => {
    renderPanel({ totals: makeTotals({ shipmentFee: 0, heavyShipmentFee: 0, totalShipmentFee: 0 }) })

    expect(screen.getAllByText("Free")).toHaveLength(3)
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument()
  })

  it("hides the tax figure behind a spinner while it is being estimated", () => {
    renderPanel({ isTaxLoading: true })

    expect(screen.getByText("Estimated Tax")).toBeInTheDocument()
    expect(screen.queryByText("$8.50")).not.toBeInTheDocument()
  })

  it("disables checkout and explains that unavailable items block it", () => {
    renderPanel({ hasBlockingItems: true, blockingItemsCount: 2, isCheckoutDisabled: true })

    expect(checkoutButton()).toBeDisabled()
    expect(screen.getByText("Checkout is blocked")).toBeInTheDocument()
    expect(screen.getByText("Remove 2 unavailable items to continue.")).toBeInTheDocument()
  })

  it("singularises the blocking reason for a single item", () => {
    renderPanel({ hasBlockingItems: true, blockingItemsCount: 1 })

    expect(screen.getByText("Remove 1 unavailable item to continue.")).toBeInTheDocument()
  })

  // BULGU: neither the blocking nor the licence notice carries `role="alert"`/`aria-live`, so a
  // screen-reader user gets no announcement when checkout becomes unavailable. Locking today's
  // behaviour: the copy is present in the DOM but exposes no alert role.
  it("renders the blocking notice as plain text with no alert role (current behaviour)", () => {
    renderPanel({ hasBlockingItems: true, blockingItemsCount: 1, isLicenseBlocked: true })

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("shows a distinct licence message with a link to add one", () => {
    renderPanel({ isLicenseBlocked: true })

    expect(screen.getByText("Dental license required")).toBeInTheDocument()
    expect(screen.getByText(/require a valid, approved dental license/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Add your license/i })).toHaveAttribute("href", "/buyer-dashboard/settings")
    expect(screen.queryByText("Checkout is blocked")).not.toBeInTheDocument()
  })

  // The licence gate is advisory in this component: the button stays clickable and `useCartPage`
  // is what actually refuses the navigation.
  it("leaves the checkout button clickable when only the licence is missing", async () => {
    const user = userEvent.setup()
    const props = renderPanel({ isLicenseBlocked: true })

    expect(checkoutButton()).toBeEnabled()
    await user.click(checkoutButton())
    expect(props.onCheckout).toHaveBeenCalledTimes(1)
  })

  it("announces how many lines are set to repeat", () => {
    renderPanel({ autoOrderItemsCount: 3 })

    expect(screen.getByText("3 items set to repeat.")).toBeInTheDocument()
  })

  it("singularises the repeating-items note", () => {
    renderPanel({ autoOrderItemsCount: 1 })

    expect(screen.getByText("1 item set to repeat.")).toBeInTheDocument()
  })

  it("says nothing about repeats when no line has a schedule", () => {
    renderPanel({ autoOrderItemsCount: 0 })

    expect(screen.queryByText(/set to repeat/i)).not.toBeInTheDocument()
  })

  it("does not fire checkout while the button is disabled", async () => {
    const user = userEvent.setup()
    const props = renderPanel({ isCheckoutDisabled: true })

    await user.click(checkoutButton())

    expect(props.onCheckout).not.toHaveBeenCalled()
  })
})
