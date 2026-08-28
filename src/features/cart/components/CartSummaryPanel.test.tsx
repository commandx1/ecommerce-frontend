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
    licenseCheckFailed: false,
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

  // Regression: an unestimated tax (no address yet, or the estimate call failed) used to render
  // as "$0.00", which understated the real charge the backend collects at payment time.
  it("shows 'Calculated at checkout' instead of $0.00 when tax could not be estimated", () => {
    renderPanel({ totals: makeTotals({ tax: null, total: 122 }) })

    expect(screen.getByText("Calculated at checkout")).toBeInTheDocument()
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument()
    expect(screen.getByText("Excludes tax — calculated at checkout.")).toBeInTheDocument()
  })

  it("does not show the excludes-tax note while a real tax figure is shown", () => {
    renderPanel()

    expect(screen.queryByText(/Excludes tax/)).not.toBeInTheDocument()
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

  it("announces the blocking and licence notices so a screen-reader user hears why checkout is unavailable", () => {
    renderPanel({ hasBlockingItems: true, blockingItemsCount: 1, isLicenseBlocked: true })

    const alerts = screen.getAllByRole("alert")
    expect(alerts.map((el) => el.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Checkout is blocked"),
        expect.stringContaining("Dental license required"),
      ]),
    )
  })

  it("shows a distinct licence message with a link to add one", () => {
    renderPanel({ isLicenseBlocked: true })

    expect(screen.getByText("Dental license required")).toBeInTheDocument()
    expect(screen.getByText(/require a valid, approved dental license/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Add your license/i })).toHaveAttribute("href", "/buyer-dashboard/settings")
    expect(screen.queryByText("Checkout is blocked")).not.toBeInTheDocument()
  })

  // Y3: the gate is fail-closed, so a licence-service outage also sets `isLicenseBlocked`. Telling a
  // buyer whose licence IS approved to "add your license" points them at a settings page that looks
  // correct and explains nothing - so the unverified case gets its own copy and no settings link.
  it("says the licence could not be verified, without a settings link, when the check itself failed", () => {
    renderPanel({ isLicenseBlocked: true, licenseCheckFailed: true })

    expect(screen.getByText("Couldn't verify your dental license")).toBeInTheDocument()
    expect(screen.getByText(/couldn't check yours just now/i)).toBeInTheDocument()
    expect(screen.queryByText("Dental license required")).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Add your license/i })).not.toBeInTheDocument()
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
