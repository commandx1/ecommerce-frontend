import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import {
  makeAccountUser,
  makeSellerConfirmReturnResponse,
  makeVendorOrder,
  makeVendorOrderItem,
} from "@/test/factories"
import { setSearchParams } from "@/test/mocks/next-navigation"
import { installRadixPointerPolyfills } from "@/test/radix"
import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import VendorOrdersPage from "./VendorOrdersPage"

installRadixPointerPolyfills()

/** Radix Select needs pointer-capture support that plain `userEvent.setup()` doesn't provide. */
const setupSelectUser = () => userEvent.setup({ pointerEventsCheck: 0 })

/**
 * `role="combobox"` gets its accessible name from the author only, so a Radix `SelectTrigger`
 * is nameless. Pick it by the value it currently displays instead.
 */
const selectShowing = (text: string): HTMLElement => {
  const trigger = screen.getAllByRole("combobox").find((element) => element.textContent?.trim() === text)
  if (!trigger) {
    throw new Error(`No select trigger showing "${text}"`)
  }
  return trigger
}

/**
 * jsdom renders the desktop table AND the mobile card list at once (CSS hides one of them).
 * This scopes queries to the mobile wrapper (`.lg:hidden`) so mobile-only interactions don't
 * collide with the desktop table's copies of the same text/buttons.
 */
const mobileContainer = (): HTMLElement => {
  const container = document.querySelector(".px-4.py-4.lg\\:hidden")
  if (!container) {
    throw new Error("Mobile list container not found")
  }
  return container as HTMLElement
}

const mobileList = (): ReturnType<typeof within> => within(mobileContainer())

/** Lets a test hold an in-flight request open to assert on loading/disabled UI before resolving it. */
const createDeferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

/** Serves `/orders/seller` and records every request's query params for assertions. */
const serveOrdersTracking = (
  orders: ReturnType<typeof makeVendorOrder>[],
  overrides: { totalPages?: number; totalElements?: number } = {},
) => {
  const requests: URLSearchParams[] = []
  server.use(
    http.get("*/backend-api/orders/seller", ({ request }) => {
      requests.push(new URL(request.url).searchParams)
      return HttpResponse.json({
        orders,
        currentPage: 0,
        totalPages: overrides.totalPages ?? 1,
        totalElements: overrides.totalElements ?? orders.length,
        pageSize: 10,
      })
    }),
  )
  return requests
}

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

const serveOrders = (...orders: ReturnType<typeof makeVendorOrder>[]) => {
  server.use(
    http.get("*/backend-api/orders/seller", () =>
      HttpResponse.json({
        orders,
        currentPage: 0,
        totalPages: 1,
        totalElements: orders.length,
        pageSize: 10,
      }),
    ),
  )
}

const signInVendor = () => {
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "token",
    isAuthenticated: true,
  })
}

/**
 * jsdom applies no media queries, so the desktop table AND the mobile list both render.
 * Every table-level assertion is therefore scoped to the desktop `<table>`.
 */
const desktopTable = async () => within(await screen.findByRole("table"))

const expandFirstOrder = async (user: ReturnType<typeof userEvent.setup>) => {
  const table = await desktopTable()
  const row = (await table.findAllByText("Jane Doe"))[0]?.closest("tr") as HTMLElement
  const buttons = within(row).getAllByRole("button")
  await user.click(buttons[buttons.length - 1] as HTMLElement)
}

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  qzMocks.getQzConnectionStatus.mockResolvedValue({
    status: "connected",
    printers: ["Zebra ZD410", "PDF Printer"],
    message: "",
    version: "2.2.4",
    scriptSource: "QZ Tray localhost 8181",
    isBundledFallback: false,
    debugMessage: null,
  })
  qzMocks.printShippingLabel.mockResolvedValue(undefined)
  signInVendor()
})

describe("VendorOrdersPage", () => {
  it("asks an unauthenticated visitor to sign in instead of fetching orders", async () => {
    useAuthStore.getState().clearAuth()
    const requested = vi.fn()
    server.use(
      http.get("*/backend-api/orders/seller", () => {
        requested()
        return HttpResponse.json({ orders: [], currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 10 })
      }),
    )

    render(<VendorOrdersPage />)

    expect(screen.getByText("Please log in to view your orders.")).toBeInTheDocument()
    expect(requested).not.toHaveBeenCalled()
  })

  it("lists the vendor's orders with the pagination summary", async () => {
    serveOrders(makeVendorOrder({ orderId: "vorder-1" }))

    render(<VendorOrdersPage />)

    expect(await screen.findByRole("heading", { name: "Orders" })).toBeInTheDocument()
    expect(await screen.findByText("Showing 1 to 1 of 1 results")).toBeInTheDocument()
  })

  it("labels the row expander so it has an accessible name that flips with its state", async () => {
    const user = userEvent.setup()
    serveOrders(makeVendorOrder({ orderId: "vorder-1" }))

    render(<VendorOrdersPage />)
    const table = await desktopTable()

    const expandButton = await table.findByRole("button", { name: "Expand order details" })
    await user.click(expandButton)

    expect(table.getByRole("button", { name: "Collapse order details" })).toBeInTheDocument()
  })

  it("filters by status tab through the query string", async () => {
    const user = userEvent.setup()
    serveOrders(makeVendorOrder())
    const requestedFilters: (string | null)[] = []
    server.use(
      http.get("*/backend-api/orders/seller", ({ request }) => {
        requestedFilters.push(new URL(request.url).searchParams.get("type"))
        return HttpResponse.json({ orders: [], currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 10 })
      }),
    )

    const { router } = render(<VendorOrdersPage />)

    await waitFor(() => expect(requestedFilters).toContain("ALL"))
    await user.click(screen.getByRole("button", { name: "Shipped" }))

    expect(router.replace).toHaveBeenCalledWith(expect.stringContaining("selectedTab=Shipped"), { scroll: false })
  })

  it("marks the active tab with aria-pressed", async () => {
    serveOrders(makeVendorOrder())

    render(<VendorOrdersPage />, { searchParams: "selectedTab=Delivered" })

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delivered" })).toHaveAttribute("aria-pressed", "true"),
    )
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false")
  })

  it("requests only the notified order when a valid orderId is in the URL, and clears it via View all orders", async () => {
    const user = userEvent.setup()
    const requests = serveOrdersTracking([makeVendorOrder({ orderId: "vorder-1" })])

    const { router } = render(<VendorOrdersPage />, {
      searchParams: "orderId=11111111-1111-1111-1111-111111111111",
    })

    await waitFor(() => expect(requests.length).toBeGreaterThan(0))
    expect(requests[0]?.get("orderId")).toBe("11111111-1111-1111-1111-111111111111")
    expect(await screen.findByText("Showing a single order from your notification.")).toBeInTheDocument()
    expect(screen.getByRole("status")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "View all orders" }))
    // orderId was the only param, so clearing it must replace to exactly the pathname - no
    // trailing "?" (F4). This suite doesn't set a `route`, so the mocked pathname is "/".
    expect(router.replace).toHaveBeenCalledWith("/", { scroll: false })
  })

  it("does not send a non-UUID orderId to the backend", async () => {
    const requests = serveOrdersTracking([makeVendorOrder()])

    render(<VendorOrdersPage />, { searchParams: "orderId=not-a-uuid" })

    await waitFor(() => expect(requests.length).toBeGreaterThan(0))
    expect(requests[0]?.has("orderId")).toBe(false)
    expect(screen.queryByText("Showing a single order from your notification.")).not.toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("lowercases an UPPERCASE orderId before sending it to the backend", async () => {
    const requests = serveOrdersTracking([makeVendorOrder({ orderId: "vorder-1" })])

    render(<VendorOrdersPage />, {
      searchParams: `orderId=${"11111111-1111-1111-1111-111111111111".toUpperCase()}`,
    })

    await waitFor(() => expect(requests.length).toBeGreaterThan(0))
    expect(requests[0]?.get("orderId")).toBe("11111111-1111-1111-1111-111111111111")
  })

  it("still shows the single-order notice alongside an empty result set (ownership-checked orderId)", async () => {
    serveOrdersTracking([])

    render(<VendorOrdersPage />, { searchParams: "orderId=11111111-1111-1111-1111-111111111111" })

    expect(await screen.findByRole("status")).toBeInTheDocument()
    expect(screen.getByText("Showing a single order from your notification.")).toBeInTheDocument()
  })

  it("drops orderId and keeps other params when a status tab is clicked", async () => {
    const user = userEvent.setup()
    serveOrdersTracking([makeVendorOrder({ orderId: "vorder-1" })])

    const { router } = render(<VendorOrdersPage />, {
      searchParams: "orderId=11111111-1111-1111-1111-111111111111&foo=bar",
    })

    await screen.findByText("Showing a single order from your notification.")
    await user.click(screen.getByRole("button", { name: "Shipped" }))

    const replacedUrl = router.replace.mock.calls[0]?.[0] as string
    const params = new URL(replacedUrl, "http://localhost").searchParams
    expect(params.get("selectedTab")).toBe("Shipped")
    expect(params.has("orderId")).toBe(false)
    expect(params.get("foo")).toBe("bar")
  })

  it("resets to page 0 once an orderId appears in the URL while on a later page", async () => {
    const requests = serveOrdersTracking([makeVendorOrder({ orderId: "vorder-1" })], {
      totalPages: 5,
      totalElements: 50,
    })

    const { rerender } = render(<VendorOrdersPage />)
    await waitFor(() => expect(requests.length).toBeGreaterThan(0))

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "2" }))
    await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("1"))

    setSearchParams("orderId=11111111-1111-1111-1111-111111111111")
    rerender(<VendorOrdersPage />)

    await waitFor(() => expect(requests.at(-1)?.get("orderId")).toBe("11111111-1111-1111-1111-111111111111"))
    // Exactly one filtered request: the page is derived, so there is no stale-page request to abort and re-send.
    expect(requests.filter((request) => request.get("orderId")).map((request) => request.get("page"))).toEqual(["0"])
  })

  it("shows Cancel only while at least one item is still cancelable", async () => {
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
      }),
      makeVendorOrder({
        orderId: "vorder-2",
        orderItems: [makeVendorOrderItem({ id: "vitem-2", status: "DELIVERED" })],
      }),
    )

    render(<VendorOrdersPage />)

    const table = await desktopTable()
    await table.findAllByText("Jane Doe")
    expect(table.getAllByRole("button", { name: "Cancel" })).toHaveLength(1)
  })

  it("hides Cancel for an item the customer already cancelled", async () => {
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT", cancelledByCustomer: true })],
      }),
    )

    render(<VendorOrdersPage />)

    const table = await desktopTable()
    await table.findAllByText("Jane Doe")
    expect(table.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument()
  })

  it("enables Call Uber only for Uber-waiting or Uber-error items", async () => {
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_UBER_DIRECT" })],
      }),
      makeVendorOrder({
        orderId: "vorder-2",
        orderItems: [makeVendorOrderItem({ id: "vitem-2", status: "DELIVERED" })],
      }),
    )

    render(<VendorOrdersPage />)

    const table = await desktopTable()
    await table.findAllByText("Jane Doe")
    const uberButtons = table.getAllByRole("button", { name: "Call Uber" })
    expect(uberButtons[0]).toBeEnabled()
    expect(uberButtons[1]).toBeDisabled()
  })

  it("requires confirmation before submitting a cancellation", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
      }),
    )
    let cancelPayload: unknown = null
    server.use(
      http.post("*/backend-api/orders/cancelBySeller", async ({ request }) => {
        cancelPayload = await request.json()
        return HttpResponse.json({
          message: "Cancellation queued",
          successCount: 1,
          failureCount: 0,
          cancelledOrderItemIds: ["vitem-1"],
        })
      }),
    )

    render(<VendorOrdersPage />)

    const table = await desktopTable()
    await user.click((await table.findAllByRole("button", { name: "Cancel" }))[0] as HTMLElement)
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { level: 3, name: "Cancel this order item?" })).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Keep order" }))
    expect(cancelPayload).toBeNull()

    await user.click(table.getAllByRole("button", { name: "Cancel" })[0] as HTMLElement)
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirm cancel" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Cancellation sent", "Cancellation queued"))
    expect(cancelPayload).toEqual({ orderItemIds: ["vitem-1"] })
  })

  // Regression: `CancelDuringDeliveryByCustomerResponse.cancelledOrderItemIds` is always set by
  // `OrderCancellationService` on every path it controls, but a malformed 200 (a proxy/gateway
  // hiccup returning a partial body) is a wire-level risk independent of that - and
  // `response.cancelledOrderItemIds.includes(...)` used to run unguarded.
  it("shows a success toast without crashing when the cancellation response omits cancelledOrderItemIds", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
      }),
    )
    server.use(
      http.post("*/backend-api/orders/cancelBySeller", () =>
        HttpResponse.json({ message: "Cancellation queued", successCount: 1, failureCount: 0 }),
      ),
    )

    render(<VendorOrdersPage />)

    const table = await desktopTable()
    await user.click((await table.findAllByRole("button", { name: "Cancel" }))[0] as HTMLElement)
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirm cancel" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Cancellation sent", "Cancellation queued"))
  })

  it("reports a rejected cancellation with the backend's message", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
      }),
    )
    server.use(
      http.post("*/backend-api/orders/cancelBySeller", () =>
        HttpResponse.json({ message: "Already shipped." }, { status: 400 }),
      ),
    )

    render(<VendorOrdersPage />)

    const table = await desktopTable()
    await user.click((await table.findAllByRole("button", { name: "Cancel" }))[0] as HTMLElement)
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirm cancel" }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Cancellation failed", "Already shipped."))
  })

  it("shows the Uber result summary after dispatching a delivery", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_UBER_DIRECT" })],
      }),
    )

    render(<VendorOrdersPage />)

    const table = await desktopTable()
    await user.click((await table.findAllByRole("button", { name: "Call Uber" }))[0] as HTMLElement)

    expect(await screen.findByText("Uber Delivery Result")).toBeInTheDocument()
    expect(screen.getByText("delivery-1")).toBeInTheDocument()
    expect(screen.getByText("$12.50")).toBeInTheDocument()
    // The same order cannot be dispatched twice. The result dialog above is now a real Radix
    // modal, which aria-hides the rest of the page while it's open (an approved a11y side effect
    // of the S8c conversion) - `hidden: true` reaches into that aria-hidden table on purpose.
    expect(table.getAllByRole("button", { name: "Call Uber", hidden: true })[0]).toBeDisabled()
  })

  it("opens the label modal from an expanded row and prints through QZ", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [
          makeVendorOrderItem({
            id: "vitem-1",
            status: "ON_WAY",
            shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
            trackingLinks: [{ trackingUrl: "https://track.example/1" }],
          }),
        ],
      }),
    )

    render(<VendorOrdersPage />)
    await expandFirstOrder(user)

    await user.click(
      (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
    )

    expect(await screen.findByText("Labels & tracking")).toBeInTheDocument()
    expect(await screen.findByText(/QZ Tray connected/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Print/ }))

    expect(qzMocks.printShippingLabel).toHaveBeenCalledWith("https://labels.example/label-1.pdf", {
      printer: "Zebra ZD410",
      copies: 1,
      colorType: "color",
    })
  })

  it("prints in black and white with the chosen number of copies", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [
          makeVendorOrderItem({
            id: "vitem-1",
            status: "ON_WAY",
            shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
          }),
        ],
      }),
    )

    render(<VendorOrdersPage />)
    await expandFirstOrder(user)
    await user.click(
      (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
    )

    await user.click(await screen.findByRole("radio", { name: "B/W" }))
    // The field is a controlled input starting at 1; a single change event to "7" keeps it
    // within the advertised 1-10 range without the intermediate states `type()` would produce.
    fireEvent.change(screen.getByLabelText("Copies"), { target: { value: "7" } })
    await user.click(screen.getByRole("button", { name: /Print/ }))

    expect(qzMocks.printShippingLabel).toHaveBeenCalledWith("https://labels.example/label-1.pdf", {
      printer: "Zebra ZD410",
      copies: 7,
      colorType: "grayscale",
    })
  })

  it("warns that labels open as PDFs when QZ Tray is unreachable", async () => {
    const user = userEvent.setup()
    qzMocks.getQzConnectionStatus.mockResolvedValue({
      status: "script_load_failed",
      printers: [],
      message: "QZ Tray script could not be loaded. Labels will open in your browser.",
      version: null,
      scriptSource: null,
      isBundledFallback: false,
      debugMessage: "boom",
    })
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [
          makeVendorOrderItem({
            id: "vitem-1",
            status: "ON_WAY",
            shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
          }),
        ],
      }),
    )

    render(<VendorOrdersPage />)
    await expandFirstOrder(user)
    await user.click(
      (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
    )

    expect(await screen.findByText(/QZ Tray not connected/)).toBeInTheDocument()
    expect(
      screen.getByText("QZ Tray script could not be loaded. Labels will open in your browser."),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("Copies")).not.toBeInTheDocument()
  })

  // CLOSED PRODUCT RULE (confirmed by the product owner, 27 Aug 2026): a vendor may only approve
  // a return, never reject one. The Reject Return button is commented out in
  // `components/order-expanded-content.tsx` (~line 238) on purpose.
  //
  // This is NOT a defect being locked in - it is the intended behaviour, so it gets a real test.
  // The guard matters because everything behind the button still exists (openRejectReturnModal,
  // handleRejectReturn, the reason modal, the onRejectReturn prop), which makes it very easy for
  // someone - human or agent - to "helpfully" re-enable it. If that happens, this test fails.
  it("does not offer a way to reject a return, only to approve one", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
      }),
    )

    render(<VendorOrdersPage />)
    await expandFirstOrder(user)

    const table = await desktopTable()
    expect((await table.findAllByRole("button", { name: /Approve Return/ })).length).toBeGreaterThan(0)
    expect(table.queryByRole("button", { name: /Reject Return/ })).not.toBeInTheDocument()
  })

  it("approves a return in one step", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
      }),
    )

    render(<VendorOrdersPage />)
    await expandFirstOrder(user)

    await user.click(
      (await (await desktopTable()).findAllByRole("button", { name: /Approve Return/ }))[0] as HTMLElement,
    )

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Return approved", "Return confirmed"))
  })

  // The above only checks the toast - this closes the two things it doesn't: the exact wire
  // body sellerConfirmReturn gets (SellerConfirmReturnRequest is `{ orderItemIds: string[] }`,
  // OrderController#sellerConfirmReturn), and that a real, visible status change follows -
  // patchConfirmedReturns (order-patches.ts) flips returnRefundStatus to APPROVED client-side, so
  // the row's tag becomes "Return Approved" and, since canManageDeliveredReturn no longer matches,
  // "Approve Return" itself disappears.
  it("sends orderItemIds and marks the item Return Approved, removing the Approve Return action", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
      }),
    )
    let requestBody: unknown
    server.use(
      http.post("*/backend-api/orders/sellerConfirmReturn", async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(makeSellerConfirmReturnResponse())
      }),
    )

    render(<VendorOrdersPage />)
    await expandFirstOrder(user)

    await user.click(
      (await (await desktopTable()).findAllByRole("button", { name: /Approve Return/ }))[0] as HTMLElement,
    )

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Return approved", "Return confirmed"))
    expect(requestBody).toEqual({ orderItemIds: ["vitem-1"] })

    const table = await desktopTable()
    expect(await table.findByText("Return Approved")).toBeInTheDocument()
    expect(table.queryByRole("button", { name: /Approve Return/ })).not.toBeInTheDocument()
  })

  // Regression: `SellerConfirmReturnResponse.orderItemIds` is always set by
  // `OrderRefundService` on every path it controls, but a malformed 200 (a proxy/gateway
  // hiccup returning a partial body) is a wire-level risk independent of that - and
  // `response.orderItemIds.includes(...)` used to run unguarded.
  it("shows a success toast without crashing when the return-approval response omits orderItemIds", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
      }),
    )
    server.use(
      http.post("*/backend-api/orders/sellerConfirmReturn", () =>
        HttpResponse.json({ message: "Return confirmed", refundAmount: 50 }),
      ),
    )

    render(<VendorOrdersPage />)
    await expandFirstOrder(user)

    await user.click(
      (await (await desktopTable()).findAllByRole("button", { name: /Approve Return/ }))[0] as HTMLElement,
    )

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Return approved", "Return confirmed"))
  })

  it("shows an empty table rather than stale rows when the fetch fails", async () => {
    server.use(http.get("*/backend-api/orders/seller", () => new HttpResponse(null, { status: 500 })))

    render(<VendorOrdersPage />)

    expect((await screen.findAllByText("No orders found.")).length).toBeGreaterThan(0)
    expect(screen.getByText("Showing 0 results")).toBeInTheDocument()
  })

  it("shows an empty list when the backend succeeds with zero results (distinct from a fetch failure)", async () => {
    serveOrdersTracking([], { totalPages: 0, totalElements: 0 })

    render(<VendorOrdersPage />)

    expect((await screen.findAllByText("No orders found.")).length).toBeGreaterThan(0)
    expect(screen.getByText("Showing 0 results")).toBeInTheDocument()
  })

  it("defaults an unknown tab value in the URL to All instead of crashing", async () => {
    serveOrders(makeVendorOrder())

    render(<VendorOrdersPage />, { searchParams: "selectedTab=NotARealTab" })

    await waitFor(() => expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true"))
  })

  describe("pagination", () => {
    it("requests the clicked page and reflects it in the pagination summary", async () => {
      const user = userEvent.setup()
      const requests = serveOrdersTracking([makeVendorOrder({ orderId: "vorder-1" })], {
        totalPages: 3,
        totalElements: 25,
      })

      render(<VendorOrdersPage />)

      await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("0"))
      await user.click(screen.getByRole("button", { name: "2" }))

      await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("1"))
    })

    it("resets to the first page when the page size changes", async () => {
      const user = setupSelectUser()
      const requests = serveOrdersTracking([makeVendorOrder({ orderId: "vorder-1" })], {
        totalPages: 3,
        totalElements: 25,
      })

      render(<VendorOrdersPage />)
      await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("0"))
      await user.click(screen.getByRole("button", { name: "3" }))
      await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("2"))

      await user.click(selectShowing("10"))
      await user.click(await screen.findByRole("option", { name: "25" }))

      await waitFor(() => {
        const last = requests.at(-1)
        expect(last?.get("size")).toBe("25")
        expect(last?.get("page")).toBe("0")
      })
    })

    it("has no page numbers and no next/previous controls for a single page of results", async () => {
      serveOrders(makeVendorOrder())

      render(<VendorOrdersPage />)

      await screen.findByRole("heading", { name: "Orders" })
      expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument()
    })
  })

  describe("sorting", () => {
    it("sorts by quantity on the desktop table, flips direction on a second click, and resets the page", async () => {
      const user = userEvent.setup()
      const requests = serveOrdersTracking([makeVendorOrder({ orderId: "vorder-1" })], {
        totalPages: 3,
        totalElements: 25,
      })

      render(<VendorOrdersPage />)
      await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("0"))
      await user.click(screen.getByRole("button", { name: "2" }))
      await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("1"))

      const table = await desktopTable()
      await user.click(table.getByRole("button", { name: /Sort by quantity/ }))
      await waitFor(() => {
        const last = requests.at(-1)
        expect(last?.get("sortBy")).toBe("quantity")
        expect(last?.get("sortDir")).toBe("desc")
        expect(last?.get("page")).toBe("0")
      })

      await user.click(table.getByRole("button", { name: /Sort by quantity/ }))
      await waitFor(() => expect(requests.at(-1)?.get("sortDir")).toBe("asc"))
    })

    it("sorts by price from the desktop header", async () => {
      const user = userEvent.setup()
      const requests = serveOrdersTracking([makeVendorOrder()])

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      // Wait for the initial load to settle before interacting: TanStack Query resolves the
      // first fetch one tick later than the old direct-axios effect did, and clicking a header
      // while it's still in flight would target a row/skeleton the query's own data arriving
      // is about to replace.
      await table.findAllByText("Jane Doe")
      await user.click(table.getByRole("button", { name: /Sort by price/ }))

      await waitFor(() => {
        const last = requests.at(-1)
        expect(last?.get("sortBy")).toBe("price")
        expect(last?.get("sortDir")).toBe("desc")
      })
    })

    it("sorts by quantity and price from the mobile sort chips", async () => {
      const user = userEvent.setup()
      const requests = serveOrdersTracking([makeVendorOrder()])

      render(<VendorOrdersPage />)
      await screen.findByRole("table")
      // See "sorts by price from the desktop header": wait for the initial load before clicking.
      await mobileList().findAllByText("Jane Doe")

      await user.click(mobileList().getByRole("button", { name: "Quantity" }))
      await waitFor(() => expect(requests.at(-1)?.get("sortBy")).toBe("quantity"))

      await user.click(mobileList().getByRole("button", { name: "Price" }))
      await waitFor(() => expect(requests.at(-1)?.get("sortBy")).toBe("price"))

      // Created is already the active sort field by default; clicking it flips direction in place.
      await user.click(mobileList().getByRole("button", { name: "Created" }))
      await waitFor(() => expect(requests.at(-1)?.get("sortBy")).toBe("createdDate"))
    })
  })

  describe("tab behavior", () => {
    it("resets the page when switching tabs", async () => {
      const user = userEvent.setup()
      const requests = serveOrdersTracking([makeVendorOrder()], { totalPages: 3, totalElements: 25 })

      render(<VendorOrdersPage />)
      await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("0"))
      await user.click(screen.getByRole("button", { name: "2" }))
      await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("1"))

      await user.click(screen.getByRole("button", { name: "Delivered" }))
      await waitFor(() => expect(requests.at(-1)?.get("page")).toBe("0"))
    })
  })

  describe("cancellation edge cases", () => {
    it("cancels only the still-cancelable items in a partially cancelable order", async () => {
      const user = userEvent.setup()
      let cancelPayload: unknown = null
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" }),
            makeVendorOrderItem({ id: "vitem-2", status: "DELIVERED" }),
          ],
        }),
      )
      server.use(
        http.post("*/backend-api/orders/cancelBySeller", async ({ request }) => {
          cancelPayload = await request.json()
          return HttpResponse.json({
            message: "Cancellation queued",
            successCount: 1,
            failureCount: 0,
            cancelledOrderItemIds: ["vitem-1"],
          })
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Cancel" }))[0] as HTMLElement)
      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByRole("heading", { level: 3, name: "Cancel this order item?" })).toBeInTheDocument()
      await user.click(within(dialog).getByRole("button", { name: "Confirm cancel" }))

      await waitFor(() => expect(cancelPayload).toEqual({ orderItemIds: ["vitem-1"] }))
    })

    it("shows the multi-item confirmation heading when cancelling an order with several cancelable items", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" }),
            makeVendorOrderItem({ id: "vitem-2", status: "PENDING" }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Cancel" }))[0] as HTMLElement)

      const dialog = await screen.findByRole("dialog")
      expect(
        within(dialog).getByRole("heading", { level: 3, name: "Cancel all selected order items?" }),
      ).toBeInTheDocument()
    })

    it("hides Cancel once every item has already been cancelled by the seller", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT", cancelledBySeller: true })],
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await table.findAllByText("Jane Doe")
      expect(table.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument()
    })

    it("disables Keep order and Confirm cancel while a cancellation is in flight, then resolves it", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
        }),
      )
      const deferred = createDeferred<Response>()
      server.use(
        http.post("*/backend-api/orders/cancelBySeller", async () => {
          await deferred.promise
          return HttpResponse.json({
            message: "Cancellation queued",
            successCount: 1,
            failureCount: 0,
            cancelledOrderItemIds: ["vitem-1"],
          })
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Cancel" }))[0] as HTMLElement)
      const dialog = await screen.findByRole("dialog")
      await user.click(within(dialog).getByRole("button", { name: "Confirm cancel" }))

      await waitFor(() => expect(within(dialog).getByRole("button", { name: /Canceling/ })).toBeDisabled())
      expect(within(dialog).getByRole("button", { name: "Keep order" })).toBeDisabled()
      // A repeat click while disabled must not fire a second request.
      await user.click(within(dialog).getByRole("button", { name: /Canceling/ }))

      deferred.resolve(new Response())
      await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Cancellation sent", "Cancellation queued"))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("closes the cancel confirmation via Escape without submitting", async () => {
      const user = userEvent.setup()
      const requested = vi.fn()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
        }),
      )
      server.use(
        http.post("*/backend-api/orders/cancelBySeller", () => {
          requested()
          return HttpResponse.json({ message: "ok", successCount: 1, failureCount: 0, cancelledOrderItemIds: [] })
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Cancel" }))[0] as HTMLElement)
      await screen.findByRole("dialog")

      await user.keyboard("{Escape}")
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(requested).not.toHaveBeenCalled()
    })

    it("falls back to the local description when the backend omits a success message", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
        }),
      )
      server.use(
        http.post("*/backend-api/orders/cancelBySeller", () =>
          HttpResponse.json({ successCount: 1, failureCount: 0, cancelledOrderItemIds: ["vitem-1"] }),
        ),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Cancel" }))[0] as HTMLElement)
      await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirm cancel" }))

      await waitFor(() =>
        expect(toastSpies.success).toHaveBeenCalledWith(
          "Cancellation sent",
          "Cancellation request for this order's items was submitted.",
        ),
      )
    })

    it("falls back to axios's own error message when a cancellation error has no JSON body", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
        }),
      )
      server.use(http.post("*/backend-api/orders/cancelBySeller", () => new HttpResponse(null, { status: 500 })))

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Cancel" }))[0] as HTMLElement)
      await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirm cancel" }))

      // No JSON body means `extractApiErrorMessage` can't read `response.data`, so it falls
      // back to axios's own `error.message` rather than the fully-generic local string.
      await waitFor(() =>
        expect(toastSpies.error).toHaveBeenCalledWith("Cancellation failed", "Request failed with status code 500"),
      )
    })

    it("cancels a single item from the expanded row, scoped to that item only", async () => {
      const user = userEvent.setup()
      let cancelPayload: unknown = null
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
        }),
      )
      server.use(
        http.post("*/backend-api/orders/cancelBySeller", async ({ request }) => {
          cancelPayload = await request.json()
          return HttpResponse.json({
            message: "Cancellation queued",
            successCount: 1,
            failureCount: 0,
            cancelledOrderItemIds: ["vitem-1"],
          })
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Cancel Item" }))[0] as HTMLElement)
      await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirm cancel" }))

      await waitFor(() => expect(cancelPayload).toEqual({ orderItemIds: ["vitem-1"] }))
    })

    it("hides Cancel Item in the expanded row for an item the customer already cancelled", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT", cancelledByCustomer: true }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      expect(table.queryByRole("button", { name: "Cancel Item" })).not.toBeInTheDocument()
    })

    it("cancels an order from the mobile card action row", async () => {
      const user = userEvent.setup()
      let cancelPayload: unknown = null
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
        }),
      )
      server.use(
        http.post("*/backend-api/orders/cancelBySeller", async ({ request }) => {
          cancelPayload = await request.json()
          return HttpResponse.json({
            message: "Cancellation queued",
            successCount: 1,
            failureCount: 0,
            cancelledOrderItemIds: ["vitem-1"],
          })
        }),
      )

      render(<VendorOrdersPage />)
      await screen.findByRole("table")
      // See "sorts by price from the desktop header": wait for the initial load before clicking.
      await mobileList().findAllByText("Jane Doe")
      await user.click(mobileList().getByRole("button", { name: "Cancel" }))
      await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirm cancel" }))

      await waitFor(() => expect(cancelPayload).toEqual({ orderItemIds: ["vitem-1"] }))
    })
  })

  describe("Call Uber edge cases", () => {
    it("reports a failed Uber dispatch with the backend's message", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_UBER_DIRECT" })],
        }),
      )
      server.use(
        http.post("*/backend-api/orders/uber/process-deliveries", () =>
          HttpResponse.json({ message: "Uber is unavailable in this area." }, { status: 500 }),
        ),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Call Uber" }))[0] as HTMLElement)

      await waitFor(() =>
        expect(toastSpies.error).toHaveBeenCalledWith("Call Uber failed", "Uber is unavailable in this area."),
      )
    })

    it("disables Call Uber while a dispatch is in flight and re-enables the summary close afterward", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_UBER_DIRECT" })],
        }),
      )
      const deferred = createDeferred<Response>()
      server.use(
        http.post("*/backend-api/orders/uber/process-deliveries", async () => {
          await deferred.promise
          return HttpResponse.json({
            message: "Uber delivery has been created.",
            successCount: 1,
            failureCount: 0,
            deliveryId: "delivery-1",
            shippingPrice: 12.5,
            trackingUrl: "https://track.example.com/delivery-1",
          })
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      const uberButton = (await table.findAllByRole("button", { name: /Call Uber|Processing/ }))[0] as HTMLElement
      await user.click(uberButton)

      await waitFor(() => expect(table.getByRole("button", { name: /Processing/ })).toBeDisabled())

      deferred.resolve(new Response())
      expect(await screen.findByText("Uber Delivery Result")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Close" }))
      expect(screen.queryByText("Uber Delivery Result")).not.toBeInTheDocument()
    })

    it("closes the Uber result via the header X button", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_UBER_DIRECT" })],
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Call Uber" }))[0] as HTMLElement)
      await screen.findByText("Uber Delivery Result")
      const closeButton = screen.getByRole("button", { name: "Close Uber delivery result" })
      await user.click(closeButton)

      await waitFor(() => expect(screen.queryByText("Uber Delivery Result")).not.toBeInTheDocument())
    })

    it("truncates a very long tracking URL in the Uber result summary", async () => {
      const user = userEvent.setup()
      const longUrl = `https://track.example.com/${"x".repeat(80)}`
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_UBER_DIRECT" })],
        }),
      )
      server.use(
        http.post("*/backend-api/orders/uber/process-deliveries", () =>
          HttpResponse.json({
            message: "Uber delivery has been created.",
            successCount: 1,
            failureCount: 0,
            deliveryId: "delivery-1",
            shippingPrice: 12.5,
            trackingUrl: longUrl,
          }),
        ),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Call Uber" }))[0] as HTMLElement)

      await screen.findByText("Uber Delivery Result")
      expect(screen.getByText(`${longUrl.slice(0, 72)}...`)).toBeInTheDocument()
      expect(screen.queryByText(longUrl)).not.toBeInTheDocument()
    })

    // Regression: backend `ProcessUberDeliveriesResponse.trackingUrl`/`.deliveryId` are plain
    // `String` fields sourced straight from Uber's own delivery-creation response. The backend's
    // own `OrderUberDeliveryService` gates saving a tracking link on `trackingUrl != null` and a
    // shipping link on `deliveryId != null` - i.e. it does not trust Uber to always return them -
    // so a 200 with either null is a real, backend-acknowledged possibility, not a hypothetical.
    // `uberResult.trackingUrl.length` used to run unguarded and would throw on null/undefined.
    it("shows the Uber result without crashing when trackingUrl and deliveryId are both null", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_UBER_DIRECT" })],
        }),
      )
      server.use(
        http.post("*/backend-api/orders/uber/process-deliveries", () =>
          HttpResponse.json({
            message: "Uber delivery has been created.",
            successCount: 1,
            failureCount: 0,
            deliveryId: null,
            shippingPrice: 12.5,
            trackingUrl: null,
          }),
        ),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Call Uber" }))[0] as HTMLElement)

      await screen.findByText("Uber Delivery Result")
      expect(screen.getByText("Not available yet.")).toBeInTheDocument()
      expect(screen.queryByRole("link", { name: /Open Tracking/i })).not.toBeInTheDocument()
      expect(screen.getAllByText("—").length).toBeGreaterThan(0)
    })

    it("calls Uber from the mobile card action row", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_UBER_DIRECT" })],
        }),
      )

      render(<VendorOrdersPage />)
      await screen.findByRole("table")
      // See "sorts by price from the desktop header": wait for the initial load before clicking.
      await mobileList().findAllByText("Jane Doe")
      await user.click(mobileList().getByRole("button", { name: "Call Uber" }))

      expect(await screen.findByText("Uber Delivery Result")).toBeInTheDocument()
    })
  })

  describe("labels & QZ edge cases", () => {
    it("closes the label modal via the header X and the footer Close button", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
            }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )
      await screen.findByText("Labels & tracking")
      const xButton = screen.getByRole("button", { name: "Close labels and tracking" })
      await user.click(xButton)
      await waitFor(() => expect(screen.queryByText("Labels & tracking")).not.toBeInTheDocument())

      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )
      await screen.findByText("Labels & tracking")
      await user.click(screen.getByRole("button", { name: "Close" }))
      await waitFor(() => expect(screen.queryByText("Labels & tracking")).not.toBeInTheDocument())
    })

    it("shows only the tracking-links section when an item has no shipping links", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              trackingLinks: [{ trackingUrl: "https://track.example/only-tracking" }],
            }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )

      expect(await screen.findByText("Tracking links (1)")).toBeInTheDocument()
      expect(screen.queryByText(/Shipping labels/)).not.toBeInTheDocument()
    })

    it("falls back to the legacy shippingLink/trackingLink string arrays when the new link objects are absent", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLink: ["https://legacy.example/ship-1"],
              trackingLink: ["https://legacy.example/track-1"],
            }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )

      expect(await screen.findByText("Shipping labels (1)")).toBeInTheDocument()
      expect(screen.getByText("Tracking links (1)")).toBeInTheDocument()
    })

    it("prefers return tracking links over shipping links once the return flow has started", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "DELIVERED",
              returnRefundStatus: "DELIVERED",
              shippingLinks: [{ shippingUrl: "https://labels.example/ship.pdf" }],
              returnTrackingLinks: [{ trackingUrl: "https://track.example/return-1" }],
            }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )

      expect(await screen.findByText("Tracking links (1)")).toBeInTheDocument()
      expect(screen.queryByText(/Shipping labels/)).not.toBeInTheDocument()
    })

    it("selects a different printer before printing", async () => {
      const user = setupSelectUser()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
            }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )

      await waitFor(() => expect(selectShowing("Zebra ZD410")).toBeInTheDocument())
      await user.click(selectShowing("Zebra ZD410"))
      await user.click(await screen.findByRole("option", { name: "PDF Printer" }))
      await user.click(screen.getByRole("button", { name: /Print/ }))

      expect(qzMocks.printShippingLabel).toHaveBeenCalledWith("https://labels.example/label-1.pdf", {
        printer: "PDF Printer",
        copies: 1,
        colorType: "color",
      })
    })

    it("switches back to Color after choosing B/W", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
            }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )
      await user.click(await screen.findByRole("radio", { name: "B/W" }))
      await user.click(screen.getByRole("radio", { name: "Color" }))
      await user.click(screen.getByRole("button", { name: /Print/ }))

      expect(qzMocks.printShippingLabel).toHaveBeenCalledWith("https://labels.example/label-1.pdf", {
        printer: "Zebra ZD410",
        copies: 1,
        colorType: "color",
      })
    })

    it("clamps a negative copies entry to 1 instead of sending it to the print API (regression)", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
            }),
          ],
        }),
      )
      const user = userEvent.setup()

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )
      const copiesInput = await screen.findByLabelText("Copies")
      fireEvent.change(copiesInput, { target: { value: "-5" } })
      expect(copiesInput).toHaveValue(1)

      await user.click(screen.getByRole("button", { name: /Print/ }))
      expect(qzMocks.printShippingLabel).toHaveBeenCalledWith(
        "https://labels.example/label-1.pdf",
        expect.objectContaining({ copies: 1 }),
      )
    })

    it("clamps a copies entry above the advertised 1-10 range down to 10 (regression)", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
            }),
          ],
        }),
      )
      const user = userEvent.setup()

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )
      const copiesInput = await screen.findByLabelText("Copies")
      fireEvent.change(copiesInput, { target: { value: "250" } })
      expect(copiesInput).toHaveValue(10)

      await user.click(screen.getByRole("button", { name: /Print/ }))
      expect(qzMocks.printShippingLabel).toHaveBeenCalledWith(
        "https://labels.example/label-1.pdf",
        expect.objectContaining({ copies: 10 }),
      )
    })

    it("shows a fallback printer label when QZ reports a printer with an empty name", async () => {
      qzMocks.getQzConnectionStatus.mockResolvedValue({
        status: "connected",
        printers: [""],
        message: "",
        version: "2.2.4",
        scriptSource: "QZ Tray localhost 8181",
        isBundledFallback: false,
        debugMessage: null,
      })
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
            }),
          ],
        }),
      )
      const user = userEvent.setup()

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )

      expect(await screen.findByText(/QZ Tray connected • Default printer/)).toBeInTheDocument()
    })

    it("warns that labels open as PDFs when QZ Tray initialization throws", async () => {
      qzMocks.getQzConnectionStatus.mockRejectedValue(new Error("qz-websocket-refused"))
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
            }),
          ],
        }),
      )
      const user = userEvent.setup()

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )

      expect(await screen.findByText(/QZ Tray not connected/)).toBeInTheDocument()
      expect(
        screen.getByText("QZ Tray could not be initialized. Labels will open in your browser."),
      ).toBeInTheDocument()
      expect(screen.queryByLabelText("Copies")).not.toBeInTheDocument()
    })

    it("re-checks QZ status every time the label modal is reopened, reflecting a dropped connection", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: "https://labels.example/label-1.pdf" }],
            }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const openLabels = async () =>
        user.click(
          (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
        )

      await openLabels()
      await screen.findByText(/QZ Tray connected/)
      await user.click(screen.getByRole("button", { name: "Close" }))
      await waitFor(() => expect(screen.queryByText("Labels & tracking")).not.toBeInTheDocument())

      qzMocks.getQzConnectionStatus.mockResolvedValue({
        status: "script_load_failed",
        printers: [],
        message: "QZ Tray connection dropped.",
        version: null,
        scriptSource: null,
        isBundledFallback: false,
        debugMessage: null,
      })

      await openLabels()
      expect(await screen.findByText(/QZ Tray not connected/)).toBeInTheDocument()
      expect(screen.getByText("QZ Tray connection dropped.")).toBeInTheDocument()
    })

    it("still shows an error toast and attempts to print an invalid URL", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: "ftp://bad.example/label.pdf" }],
            }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )
      await user.click(await screen.findByRole("button", { name: /Print/ }))

      expect(toastSpies.error).toHaveBeenCalledWith("Invalid URL. Please check the URL and try again.")
      expect(qzMocks.printShippingLabel).toHaveBeenCalledWith("ftp://bad.example/label.pdf", expect.anything())
    })

    it("truncates a long shipping or tracking link's displayed text but keeps the full URL as the link target", async () => {
      const longShippingUrl = `https://labels.example/${"a".repeat(60)}.pdf`
      const longTrackingUrl = `https://track.example/${"b".repeat(60)}`
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({
              id: "vitem-1",
              status: "ON_WAY",
              shippingLinks: [{ shippingUrl: longShippingUrl }],
              trackingLinks: [{ trackingUrl: longTrackingUrl }],
            }),
          ],
        }),
      )
      const user = userEvent.setup()

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Track \/ Labels/ }))[0] as HTMLElement,
      )

      expect(await screen.findByText(`${longShippingUrl.slice(0, 50)}...`)).toBeInTheDocument()
      expect(screen.getByText(`${longTrackingUrl.slice(0, 50)}...`)).toBeInTheDocument()
      expect(screen.getAllByRole("link", { name: /Open/ })[0]).toHaveAttribute("href", longShippingUrl)
    })
  })

  describe("return approval edge cases", () => {
    it("reports a failed return approval with the backend's message", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
        }),
      )
      server.use(
        http.post("*/backend-api/orders/sellerConfirmReturn", () =>
          HttpResponse.json({ message: "Refund window has closed." }, { status: 400 }),
        ),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Approve Return/ }))[0] as HTMLElement,
      )

      await waitFor(() =>
        expect(toastSpies.error).toHaveBeenCalledWith("Return approval failed", "Refund window has closed."),
      )
    })

    it("disables Approve Return while the approval is in flight", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
        }),
      )
      const deferred = createDeferred<Response>()
      server.use(
        http.post("*/backend-api/orders/sellerConfirmReturn", async () => {
          await deferred.promise
          return HttpResponse.json({
            message: "Return confirmed and refund created.",
            refundAmount: 100,
            orderItemIds: ["vitem-1"],
          })
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: /Approve Return/ }))[0] as HTMLElement)

      await waitFor(() => expect(table.getByRole("button", { name: /Approving/ })).toBeDisabled())

      deferred.resolve(new Response())
      await waitFor(() =>
        expect(toastSpies.success).toHaveBeenCalledWith("Return approved", "Return confirmed and refund created."),
      )
    })

    it("does not offer Approve Return when the item's return status is delivered but the item itself hasn't been delivered", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "ON_WAY", returnRefundStatus: "DELIVERED" })],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      expect(table.queryByRole("button", { name: /Approve Return/ })).not.toBeInTheDocument()
    })

    it("approves a return from the mobile expanded row", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      await user.click(mobileList().getByRole("button", { name: /Approve Return/ }))

      await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Return approved", "Return confirmed"))
    })
  })

  describe("data edge cases", () => {
    // Regression: `orders-mobile-list.tsx` calls `orders.length` unconditionally (it renders in
    // the DOM at all viewport widths, just CSS-hidden on desktop). `setOrders(response.orders)`
    // used to pass a malformed 200's shape straight into state - a proxy/gateway hiccup that
    // returns `{}` or `{ orders: null }` (empty/partial body, "200 with an error shape") would
    // white-screen every vendor, not just mobile ones, since `orders.length` throws on undefined.
    it("shows an empty order list instead of crashing when the backend's orders field is missing", async () => {
      server.use(
        http.get("*/backend-api/orders/seller", () =>
          HttpResponse.json({ currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 10 }),
        ),
      )

      render(<VendorOrdersPage />)

      expect((await screen.findAllByText(/No orders found\.?/i)).length).toBeGreaterThan(0)
    })

    it("shows an empty order list instead of crashing when the backend sends orders: null", async () => {
      server.use(
        http.get("*/backend-api/orders/seller", () =>
          HttpResponse.json({ orders: null, currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 10 }),
        ),
      )

      render(<VendorOrdersPage />)

      expect((await screen.findAllByText(/No orders found\.?/i)).length).toBeGreaterThan(0)
    })

    it("shows a real shipping cost instead of FREE when totalShippingCost is a positive number", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          totalShippingCost: 15.5,
          orderItems: [makeVendorOrderItem({ id: "vitem-1" })],
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await table.findAllByText("Jane Doe")
      expect(table.getAllByText("$15.50").length).toBeGreaterThan(0)
    })

    it("shows FREE shipping in the expanded row and $0.00 in the table when totalShippingCost is absent", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1" })],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      expect(table.getByText("$0.00")).toBeInTheDocument()
      expect(table.getByText("FREE")).toBeInTheDocument()
    })

    it("shows a dash for buyer name and doesn't crash when the buyer's address is missing", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          buyerName: "",
          buyerSurname: "",
          sellerAddress: undefined,
          orderItems: [makeVendorOrderItem({ id: "vitem-1" })],
        }),
      )

      const user = userEvent.setup()
      render(<VendorOrdersPage />)
      const table = await desktopTable()
      // See "sorts by price from the desktop header": wait for the initial load before
      // interacting. The buyer name is blank here, so wait for a real data row (as opposed to
      // just the header row that's present even while the skeleton is still showing) instead.
      await waitFor(() => expect(table.getAllByRole("row").length).toBeGreaterThan(1))
      const row = (await table.findAllByRole("row"))[1] as HTMLElement
      const rowButtons = within(row).getAllByRole("button")
      await user.click(rowButtons[rowButtons.length - 1] as HTMLElement)

      expect(table.getAllByText("-").length).toBeGreaterThan(0)
    })

    it("shows a dash instead of crashing for an unparsable order date", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderCreatedDate: "not-a-real-date",
          orderItems: [makeVendorOrderItem({ id: "vitem-1" })],
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await table.findAllByText("Jane Doe")
      expect(table.getAllByText("-").length).toBeGreaterThan(0)
    })

    it("labels a single-item order as singular and a multi-item order as plural", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1" })],
        }),
        makeVendorOrder({
          orderId: "vorder-2",
          buyerName: "John",
          buyerSurname: "Smith",
          orderItems: [makeVendorOrderItem({ id: "vitem-2a" }), makeVendorOrderItem({ id: "vitem-2b" })],
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await table.findAllByText("Jane Doe")
      expect(table.getByText("1 item")).toBeInTheDocument()
      expect(table.getByText("2 items")).toBeInTheDocument()
    })

    it("shows the per-unit price only when quantity is greater than one", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", quantity: 1, price: 40, totalPrice: 40 })],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      expect(screen.queryByText(/each\)/)).not.toBeInTheDocument()
    })

    it("marks a free item as FREE instead of $0.00 in the expanded row", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", price: 0, totalPrice: 0 })],
          totalShippingCost: 5,
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      expect(table.getByText("FREE")).toBeInTheDocument()
    })

    it("marks free-shipped-by-seller items distinctly from a computed shipment fee", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [
            makeVendorOrderItem({ id: "vitem-1", shipmentFreeBySeller: true }),
            makeVendorOrderItem({ id: "vitem-2", shipmentFreeBySeller: false, takedShipmentPrice: 7.25 }),
          ],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      expect(table.getByText("Free Shipping")).toBeInTheDocument()
      expect(table.getByText("Shipment: $7.25")).toBeInTheDocument()
    })

    // Uber orders can have `shipmentFreeBySeller: true` while `takedShipmentPrice` was still
    // charged, so the free flag must never zero out the actual amount collected.
    it("shows the real shipment charge instead of Free Shipping when a fee was still taken", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", shipmentFreeBySeller: true, takedShipmentPrice: 12.99 })],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      expect(table.getByText("Shipment: $12.99")).toBeInTheDocument()
      expect(table.queryByText("Free Shipping")).not.toBeInTheDocument()
    })

    it("shows the heavy shipment fee on the item row and in the order summary total", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          totalShippingCost: 0,
          orderItems: [makeVendorOrderItem({ id: "vitem-1", totalPrice: 110.6, takedHeavyShipmentFee: 50 })],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      expect(table.getByText("Heavy fee: $50.00")).toBeInTheDocument()
      expect(table.getByText("Heavy shipment fee")).toBeInTheDocument()
      expect(table.getByText("$160.60")).toBeInTheDocument()
    })

    it("hides the heavy shipment fee row and label when there is no heavy fee", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", takedHeavyShipmentFee: 0 })],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      expect(table.queryByText(/Heavy fee/)).not.toBeInTheDocument()
      expect(table.queryByText("Heavy shipment fee")).not.toBeInTheDocument()
    })

    it("shows the heavy fee refund in the cancellation strip", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          cancellationHeavyShipmentFeeRefund: 50,
          orderItems: [makeVendorOrderItem({ id: "vitem-1" })],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      expect(table.getByText(/Heavy fee refunded to buyer/)).toBeInTheDocument()
      expect(table.getByText("$50.00")).toBeInTheDocument()
    })

    it("shows no cancellation strip when none of the cancellation fields apply", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          cancellationShipmentFee: null,
          cancellationShipmentRefundFee: null,
          cancellationHeavyShipmentFeeRefund: 0,
          orderItems: [makeVendorOrderItem({ id: "vitem-1" })],
        }),
      )

      render(<VendorOrdersPage />)
      await expandFirstOrder(userEvent.setup())
      expect(screen.queryByText(/Shipping charged on cancellation/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Shipping refunded/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Heavy fee refunded to buyer/)).not.toBeInTheDocument()
    })

    it("includes the heavy shipment fee in the table's Shipping column", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          totalShippingCost: 10,
          orderItems: [makeVendorOrderItem({ id: "vitem-1", takedHeavyShipmentFee: 50 })],
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await table.findAllByText("Jane Doe")
      expect(table.getAllByText("$60.00").length).toBeGreaterThan(0)
    })

    it("shows the auto-order badge and correct status classes for a PAYMENT_SUCCESS order", async () => {
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderStatus: "PAYMENT_SUCCESS",
          autoOrder: true,
          orderItems: [makeVendorOrderItem({ id: "vitem-1" })],
        }),
      )

      render(<VendorOrdersPage />)
      const table = await desktopTable()
      await table.findAllByText("Jane Doe")
      expect(table.getAllByText("PAYMENT_SUCCESS").length).toBeGreaterThan(0)
      expect(table.getAllByText("Auto").length).toBeGreaterThan(0)
    })
  })

  describe("mobile list", () => {
    it("shows a skeleton while loading and the empty state once resolved with no orders", async () => {
      const deferred = createDeferred<Response>()
      server.use(
        http.get("*/backend-api/orders/seller", async () => {
          await deferred.promise
          return HttpResponse.json({ orders: [], currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 10 })
        }),
      )

      render(<VendorOrdersPage />)
      await waitFor(() =>
        expect(mobileContainer().querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0),
      )

      deferred.resolve(new Response())
      await waitFor(() => expect(mobileList().getByText("No orders found.")).toBeInTheDocument())
    })

    it("expands and collapses a card from its own mobile trigger", async () => {
      const user = userEvent.setup()
      serveOrders(
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1" })],
        }),
      )

      render(<VendorOrdersPage />)
      await screen.findByRole("table")
      // See "sorts by price from the desktop header": wait for the initial load before interacting.
      await mobileList().findAllByText("Jane Doe")
      const trigger = mobileList()
        .getAllByRole("button")
        .find((button: HTMLElement) => button.hasAttribute("aria-expanded")) as HTMLElement
      expect(trigger).toHaveAttribute("aria-expanded", "false")

      await user.click(trigger)
      await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"))

      await user.click(trigger)
      await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"))
    })
  })

  // S8b characterization (design §6): written against the pre-migration page, before the
  // useVendorOrdersQuery/useOrderActions extraction, and kept green afterward unmodified.
  describe("request counts", () => {
    it("sends exactly one GET per tab, page and sort change - no duplicates, no dropped requests", async () => {
      const user = userEvent.setup()
      const requests = serveOrdersTracking([makeVendorOrder({ orderId: "vorder-1" })], {
        totalPages: 3,
        totalElements: 25,
      })

      const { rerender } = render(<VendorOrdersPage />)
      await waitFor(() => expect(requests.length).toBe(1))
      expect(requests[0]?.get("type")).toBe("ALL")

      // The tab is URL-driven (`selectedTab` comes from `useSearchParams()`), and this test
      // harness's `router.replace` spy does not feed back into the mocked search params on its
      // own - only a real navigation would. Simulate the URL having actually changed, the same
      // way the existing "resets to page 0 once an orderId appears" test above does.
      setSearchParams("selectedTab=Shipped")
      rerender(<VendorOrdersPage />)
      await waitFor(() => expect(requests.length).toBe(2))
      expect(requests[1]?.get("type")).toBe("ON_WAY")

      await user.click(screen.getByRole("button", { name: "2" }))
      await waitFor(() => expect(requests.length).toBe(3))
      expect(requests[2]?.get("page")).toBe("1")

      const table = await desktopTable()
      await user.click(table.getByRole("button", { name: "Created" }))
      await waitFor(() => expect(requests.length).toBe(4))
      expect(requests[3]?.get("sortBy")).toBe("createdDate")
      expect(requests[3]?.get("sortDir")).toBe("asc")
      // The sort click also resets the page, but that happens within the same state update
      // batch, so it costs no extra request.
      expect(requests[3]?.get("page")).toBe("0")
    })

    it("cancelling an item patches state locally without an extra orders request", async () => {
      const user = userEvent.setup()
      const requests = serveOrdersTracking([
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" })],
        }),
      ])
      server.use(
        http.post("*/backend-api/orders/cancelBySeller", () =>
          HttpResponse.json({
            message: "Cancellation queued",
            successCount: 1,
            failureCount: 0,
            cancelledOrderItemIds: ["vitem-1"],
          }),
        ),
      )

      render(<VendorOrdersPage />)
      await waitFor(() => expect(requests.length).toBe(1))
      await expandFirstOrder(userEvent.setup())
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Cancel Item" }))[0] as HTMLElement)
      await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirm cancel" }))

      await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
      expect(requests.length).toBe(1)
    })

    it("approving a return patches state locally without an extra orders request", async () => {
      const user = userEvent.setup()
      const requests = serveOrdersTracking([
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
        }),
      ])

      render(<VendorOrdersPage />)
      await waitFor(() => expect(requests.length).toBe(1))
      await expandFirstOrder(user)
      await user.click(
        (await (await desktopTable()).findAllByRole("button", { name: /Approve Return/ }))[0] as HTMLElement,
      )

      await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
      expect(requests.length).toBe(1)
    })

    it("calling Uber patches state locally without an extra orders request", async () => {
      const user = userEvent.setup()
      const requests = serveOrdersTracking([
        makeVendorOrder({
          orderId: "vorder-1",
          orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_UBER_DIRECT" })],
        }),
      ])

      render(<VendorOrdersPage />)
      await waitFor(() => expect(requests.length).toBe(1))
      const table = await desktopTable()
      await user.click((await table.findAllByRole("button", { name: "Call Uber" }))[0] as HTMLElement)

      await waitFor(() => expect(screen.getByText("Uber Delivery Result")).toBeInTheDocument())
      expect(requests.length).toBe(1)
    })
  })
})
