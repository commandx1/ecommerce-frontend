import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorOrder, makeVendorOrderItem } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
import VendorOrdersPage from "./page"

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
        HttpResponse.json({ message: "Already shipped." }, { status: 409 }),
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
    // The same order cannot be dispatched twice
    expect(table.getAllByRole("button", { name: "Call Uber" })[0]).toBeDisabled()
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
    // The field starts at 1; appending "3" makes it 13, which is what must reach QZ.
    await user.type(screen.getByLabelText("Copies"), "3")
    await user.click(screen.getByRole("button", { name: /Print/ }))

    expect(qzMocks.printShippingLabel).toHaveBeenCalledWith("https://labels.example/label-1.pdf", {
      printer: "Zebra ZD410",
      copies: 13,
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

  it("offers no way to reject a return, even though the reject flow is fully built", async () => {
    const user = userEvent.setup()
    serveOrders(
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
      }),
    )
    const rejected = vi.fn()
    server.use(
      http.post("*/backend-api/orders/sellerRejectReturn", () => {
        rejected()
        return HttpResponse.json({ message: "Return rejected", orderItemIds: ["vitem-1"] })
      }),
    )

    render(<VendorOrdersPage />)
    await expandFirstOrder(user)

    // BUG (locked, not fixed): the "Reject Return" button is commented out in
    // `components/order-expanded-content.tsx` (~line 238), so the reject modal, its
    // reason validation and `POST /orders/sellerRejectReturn` are all unreachable dead code.
    const table = await desktopTable()
    expect((await table.findAllByRole("button", { name: /Approve Return/ }))[0]).toBeInTheDocument()
    expect(table.queryByRole("button", { name: /Reject Return/ })).not.toBeInTheDocument()
    expect(screen.queryByText("Reject return request")).not.toBeInTheDocument()
    expect(rejected).not.toHaveBeenCalled()
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

  it("shows an empty table rather than stale rows when the fetch fails", async () => {
    server.use(http.get("*/backend-api/orders/seller", () => new HttpResponse(null, { status: 500 })))

    render(<VendorOrdersPage />)

    expect((await screen.findAllByText("No orders found.")).length).toBeGreaterThan(0)
    expect(screen.getByText("Showing 0 results")).toBeInTheDocument()
  })
})
