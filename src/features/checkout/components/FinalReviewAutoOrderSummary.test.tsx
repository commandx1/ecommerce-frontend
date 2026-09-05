import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { AutoOrderLine } from "@/features/checkout/hooks/useCheckoutAutoOrder"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor } from "@/test/render"
import FinalReviewAutoOrderSummary from "./FinalReviewAutoOrderSummary"

installRadixPointerPolyfills()

const line = (overrides: Partial<AutoOrderLine> = {}): AutoOrderLine => ({
  userProductId: "up-1",
  productName: "Intra Oral Mixing Tips",
  quantity: 2,
  period: "ONE_MONTH",
  periodLabel: "Every 30 days",
  ...overrides,
})

/** `pointerEventsCheck: 0` — Radix marks `<body>` as `pointer-events: none` while a Select is open. */
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

/** Fresh no-op callbacks per render so assertions don't leak between tests. */
const noopHandlers = () => ({
  onPeriodChange: vi.fn().mockResolvedValue(undefined),
  onCancelRecurrence: vi.fn().mockResolvedValue(undefined),
})

describe("FinalReviewAutoOrderSummary", () => {
  it("renders nothing when the order has no recurring lines", () => {
    const { onPeriodChange, onCancelRecurrence } = noopHandlers()
    render(
      <FinalReviewAutoOrderSummary
        autoOrderLines={[]}
        pendingUserProductIds={new Set()}
        onPeriodChange={onPeriodChange}
        onCancelRecurrence={onCancelRecurrence}
      />,
    )

    expect(screen.queryByRole("heading", { name: "Auto orders" })).not.toBeInTheDocument()
  })

  it("lists each recurring line with its quantity and cadence", () => {
    const { onPeriodChange, onCancelRecurrence } = noopHandlers()
    render(
      <FinalReviewAutoOrderSummary
        autoOrderLines={[
          line({ userProductId: "up-1", productName: "Mixing Tips", quantity: 2, periodLabel: "Every 30 days" }),
          line({
            userProductId: "up-2",
            productName: "Gloves",
            quantity: 5,
            period: "TWO_WEEKS",
            periodLabel: "Every 15 days",
          }),
        ]}
        pendingUserProductIds={new Set()}
        onPeriodChange={onPeriodChange}
        onCancelRecurrence={onCancelRecurrence}
      />,
    )

    expect(screen.getByRole("heading", { name: "Auto orders" })).toBeInTheDocument()
    expect(screen.getByText("Mixing Tips").textContent).toContain("× 2")
    expect(screen.getByText("Gloves").textContent).toContain("× 5")
  })

  it("tells the buyer the countdown starts at payment and where to manage it, without pointing back at the cart", () => {
    const { onPeriodChange, onCancelRecurrence } = noopHandlers()
    render(
      <FinalReviewAutoOrderSummary
        autoOrderLines={[line()]}
        pendingUserProductIds={new Set()}
        onPeriodChange={onPeriodChange}
        onCancelRecurrence={onCancelRecurrence}
      />,
    )

    expect(screen.getByText(/Auto orders start counting from the day this payment goes through/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Auto Orders" })).toHaveAttribute("href", "/buyer-dashboard/auto-orders")
    expect(screen.queryByText(/go back to your cart/)).not.toBeInTheDocument()
  })

  it("changing a row's period calls onPeriodChange with the row's id and the new period", async () => {
    const user = setupUser()
    const { onPeriodChange, onCancelRecurrence } = noopHandlers()
    render(
      <FinalReviewAutoOrderSummary
        autoOrderLines={[line({ userProductId: "up-1", productName: "Mixing Tips" })]}
        pendingUserProductIds={new Set()}
        onPeriodChange={onPeriodChange}
        onCancelRecurrence={onCancelRecurrence}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "Change repeat schedule for Mixing Tips" }))
    await user.click(await screen.findByRole("option", { name: "Every 60 days" }))

    expect(onPeriodChange).toHaveBeenCalledWith("up-1", "TWO_MONTHS")
  })

  it("clicking cancel opens the confirmation modal without calling onCancelRecurrence until confirmed", async () => {
    const user = setupUser()
    const { onPeriodChange, onCancelRecurrence } = noopHandlers()
    render(
      <FinalReviewAutoOrderSummary
        autoOrderLines={[line({ userProductId: "up-1", productName: "Mixing Tips" })]}
        pendingUserProductIds={new Set()}
        onPeriodChange={onPeriodChange}
        onCancelRecurrence={onCancelRecurrence}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Cancel repeat for Mixing Tips" }))

    expect(await screen.findByRole("heading", { name: "Cancel repeat?", level: 3 })).toBeInTheDocument()
    expect(onCancelRecurrence).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Cancel repeat" }))
    expect(onCancelRecurrence).toHaveBeenCalledWith("up-1")
  })

  it("dismissing the confirmation modal calls nothing", async () => {
    const user = setupUser()
    const { onPeriodChange, onCancelRecurrence } = noopHandlers()
    render(
      <FinalReviewAutoOrderSummary
        autoOrderLines={[line({ userProductId: "up-1", productName: "Mixing Tips" })]}
        pendingUserProductIds={new Set()}
        onPeriodChange={onPeriodChange}
        onCancelRecurrence={onCancelRecurrence}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Cancel repeat for Mixing Tips" }))
    expect(await screen.findByRole("heading", { name: "Cancel repeat?", level: 3 })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Keep repeat" }))

    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Cancel repeat?", level: 3 })).not.toBeInTheDocument(),
    )
    expect(onCancelRecurrence).not.toHaveBeenCalled()
    expect(onPeriodChange).not.toHaveBeenCalled()
  })

  it("disables a row's controls while its write is in flight", () => {
    const { onPeriodChange, onCancelRecurrence } = noopHandlers()
    render(
      <FinalReviewAutoOrderSummary
        autoOrderLines={[line({ userProductId: "up-1", productName: "Mixing Tips" })]}
        pendingUserProductIds={new Set(["up-1"])}
        onPeriodChange={onPeriodChange}
        onCancelRecurrence={onCancelRecurrence}
      />,
    )

    expect(screen.getByRole("combobox", { name: "Change repeat schedule for Mixing Tips" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel repeat for Mixing Tips" })).toBeDisabled()
  })
})
