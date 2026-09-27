import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorOrder, makeVendorOrderItem } from "@/test/factories"
import { installRadixPointerPolyfills } from "@/test/radix"
import { act, fireEvent, render, screen, within } from "@/test/render"
import VendorOrdersPage from "./VendorOrdersPage"

installRadixPointerPolyfills()

/**
 * Scenario coverage for "refresh while open" (refetch on focus + every 60s while visible - see
 * `REFRESH_WHILE_VISIBLE` in `lib/query/query-client.ts`). Fakes `setTimeout`/`clearTimeout` AND
 * `setInterval`/`clearInterval` (TanStack's `refetchInterval` is a `setInterval`, not a recursive
 * `setTimeout`) and mocks `vendorOrdersAPI` directly rather than going through MSW, matching
 * `useAutoOrderRegistration.test.ts`'s note that faking the whole clock deadlocks MSW + axios.
 *
 * Two testing-library quirks this file works around:
 *  - No global `jest` shim exists here, so `@testing-library/dom`'s `waitFor` takes its "real
 *    timers" branch (a real `setInterval` + `MutationObserver`) - but that `setInterval` is itself
 *    one of the timers faked above, so it would never fire without being advanced, and
 *    `findBy*`/`waitFor` would hang until Vitest's own per-test timeout. Every assertion below
 *    therefore uses `getBy*`/`queryBy*` after an explicit, `act()`-wrapped timer advance.
 *  - The expand click uses the low-level `fireEvent` instead of `userEvent`, whose own wait loop
 *    also relies on a real `setInterval` and hangs the same way once that timer is faked.
 *  - TanStack's own cross-observer notifications are scheduled via `setTimeout(fn, 0)`
 *    (`query-core`'s `notifyManager`), so after advancing the fake clock to the interval's due
 *    time, `vi.runOnlyPendingTimersAsync()` is needed to drain that zero-delay follow-up and let
 *    the observer's result reach the component - a plain second `advanceTimersByTimeAsync(0)`
 *    does not reliably pick up a timer scheduled for exactly the already-reached instant.
 */

const { getVendorOrders } = vi.hoisted(() => ({ getVendorOrders: vi.fn() }))

vi.mock("@/lib/api/vendor-orders", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/vendor-orders")>("@/lib/api/vendor-orders")
  return {
    ...actual,
    vendorOrdersAPI: { ...actual.vendorOrdersAPI, getVendorOrders },
  }
})

const { toastSpies, qzMocks } = vi.hoisted(() => ({
  toastSpies: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    love: vi.fn(),
    loading: vi.fn(),
  },
  qzMocks: { getQzConnectionStatus: vi.fn(), printShippingLabel: vi.fn(), connectQzAndGetPrinters: vi.fn() },
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
vi.mock("@/lib/qz/printLabel", () => qzMocks)

const ordersResponse = (...orders: ReturnType<typeof makeVendorOrder>[]) => ({
  orders,
  currentPage: 0,
  totalPages: 1,
  totalElements: orders.length,
  pageSize: 10,
})

const signInVendor = () => {
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "token",
    isAuthenticated: true,
  })
}

/**
 * Flushes the fake clock inside `act()` so React commits the resulting state update, then drains
 * any zero-delay follow-up timer `notifyManager` scheduled as a result (see file header).
 */
const flush = async (ms = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
  await act(async () => {
    await vi.runOnlyPendingTimersAsync()
  })
}

/** Flips `document.visibilityState` and fires the event TanStack's `focusManager` listens for. */
const setVisibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true })
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"))
  })
}

const desktopTable = () => within(screen.getByRole("table"))

const expandFirstOrder = () => {
  const table = desktopTable()
  const row = table.getAllByText("Jane Doe")[0]?.closest("tr") as HTMLElement
  const buttons = within(row).getAllByRole("button")
  act(() => {
    fireEvent.click(buttons[buttons.length - 1] as HTMLElement)
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] })
  getVendorOrders.mockReset()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  qzMocks.getQzConnectionStatus.mockResolvedValue({
    status: "connected",
    printers: ["Zebra ZD410"],
    message: "",
    version: "2.2.4",
    scriptSource: "QZ Tray localhost 8181",
    isBundledFallback: false,
    debugMessage: null,
  })
  setVisibility("visible")
  signInVendor()
})

afterAll(() => {
  vi.useRealTimers()
})

describe("VendorOrdersPage freshness", () => {
  it("shows a newly arrived order after 60s without navigation, keeps the expanded row expanded", async () => {
    getVendorOrders.mockResolvedValue(ordersResponse(makeVendorOrder({ orderId: "vorder-1" })))

    render(<VendorOrdersPage />)
    await flush()

    expect(screen.getByText("Showing 1 to 1 of 1 results")).toBeInTheDocument()
    const callsAfterMount = getVendorOrders.mock.calls.length

    expandFirstOrder()
    expect(desktopTable().getByRole("button", { name: "Collapse order details" })).toBeInTheDocument()

    // A new Shippo order landed server-side; the vendor hasn't navigated or clicked anything.
    getVendorOrders.mockResolvedValue(
      ordersResponse(
        makeVendorOrder({ orderId: "vorder-2", orderItems: [makeVendorOrderItem({ id: "vitem-2" })] }),
        makeVendorOrder({ orderId: "vorder-1" }),
      ),
    )

    await flush(60_000)

    expect(getVendorOrders.mock.calls.length).toBeGreaterThan(callsAfterMount)
    expect(screen.getByText("Showing 1 to 2 of 2 results")).toBeInTheDocument()
    // The refetch swapped in new data, but the row the vendor had expanded stays expanded.
    expect(desktopTable().getByRole("button", { name: "Collapse order details" })).toBeInTheDocument()
  })

  it("does not poll while the document is hidden, and refetches immediately once it regains focus", async () => {
    getVendorOrders.mockResolvedValue(ordersResponse(makeVendorOrder({ orderId: "vorder-1" })))

    render(<VendorOrdersPage />)
    await flush()

    expect(screen.getByText("Showing 1 to 1 of 1 results")).toBeInTheDocument()
    const callsAfterMount = getVendorOrders.mock.calls.length

    setVisibility("hidden")
    await flush(60_000)
    expect(getVendorOrders.mock.calls.length).toBe(callsAfterMount)

    setVisibility("visible")
    await flush()
    expect(getVendorOrders.mock.calls.length).toBeGreaterThan(callsAfterMount)
  })
})
