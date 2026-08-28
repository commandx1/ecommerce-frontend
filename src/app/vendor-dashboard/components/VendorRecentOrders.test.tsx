import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorOrder, makeVendorOrderItem } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import VendorRecentOrders from "./VendorRecentOrders"

const ORDERS_URL = "*/backend-api/orders/seller"

const signInVendor = () => {
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "token",
    isAuthenticated: true,
  })
}

const serveOrders = (body: unknown) => {
  const requests: URLSearchParams[] = []
  server.use(
    http.get(ORDERS_URL, ({ request }) => {
      requests.push(new URL(request.url).searchParams)
      return HttpResponse.json(body as object)
    }),
  )
  return requests
}

const ordersResponse = (orders: unknown) => ({
  orders,
  currentPage: 0,
  totalPages: 1,
  totalElements: Array.isArray(orders) ? orders.length : 0,
  pageSize: 4,
})

beforeEach(() => {
  signInVendor()
})

describe("VendorRecentOrders", () => {
  it("shows loading skeletons before the orders resolve", () => {
    serveOrders(ordersResponse([makeVendorOrder()]))
    const { container } = render(<VendorRecentOrders />)

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })

  it("requests the four most recent orders across all statuses", async () => {
    const requests = serveOrders(ordersResponse([makeVendorOrder()]))
    render(<VendorRecentOrders />)

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]?.get("size")).toBe("4")
    expect(requests[0]?.get("type")).toBe("ALL")
    expect(requests[0]?.get("sortBy")).toBe("createdDate")
    expect(requests[0]?.get("sortDir")).toBe("desc")
  })

  it("renders the buyer name, initials, order total and status from the backend order", async () => {
    serveOrders(
      ordersResponse([
        makeVendorOrder({
          orderId: "vorder-42",
          buyerName: "Jane",
          buyerSurname: "Doe",
          orderStatus: "DELIVERED",
          orderItems: [
            makeVendorOrderItem({ totalPrice: 120 }),
            makeVendorOrderItem({ id: "vitem-2", totalPrice: 80 }),
          ],
        }),
      ]),
    )
    render(<VendorRecentOrders />)

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument()
    expect(screen.getByText("JD")).toBeInTheDocument()
    expect(screen.getByText("$200.00")).toBeInTheDocument()
    expect(screen.getByText("DELIVERED")).toBeInTheDocument()
    expect(screen.getByText("Order #vorder-4")).toBeInTheDocument()
  })

  it("renders no order rows instead of crashing when the vendor has no orders yet", async () => {
    serveOrders(ordersResponse([]))
    render(<VendorRecentOrders />)

    await waitFor(() => {
      expect(screen.queryByText(/Order #/)).not.toBeInTheDocument()
    })
    expect(screen.getByText("Recent Orders")).toBeInTheDocument()
  })

  it("shows an error message and a Retry button instead of the orders when the request fails", async () => {
    server.use(http.get(ORDERS_URL, () => new HttpResponse(null, { status: 400 })))
    render(<VendorRecentOrders />)

    expect(await screen.findByText("Couldn't load recent orders. Please try again.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    expect(screen.queryByText(/Order #/)).not.toBeInTheDocument()
    expect(screen.queryByText(/bad request/i)).not.toBeInTheDocument()
  })

  it("re-requests the orders and renders them after a successful retry", async () => {
    server.use(http.get(ORDERS_URL, () => new HttpResponse(null, { status: 400 })))
    render(<VendorRecentOrders />)
    await screen.findByText("Couldn't load recent orders. Please try again.")

    serveOrders(ordersResponse([makeVendorOrder({ orderId: "vorder-42", buyerName: "Jane", buyerSurname: "Doe" })]))
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Retry" }))

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument()
    expect(screen.queryByText("Couldn't load recent orders. Please try again.")).not.toBeInTheDocument()
  })

  it.each([
    ["orders missing entirely", undefined],
    ["orders null", null],
    ["orders not an array", { orderId: "vorder-1" }],
  ])("renders no order rows instead of crashing when %s", async (_label, ordersOverride) => {
    const body: Record<string, unknown> = { ...ordersResponse([makeVendorOrder()]), orders: ordersOverride }
    if (ordersOverride === undefined) delete body.orders
    serveOrders(body)
    render(<VendorRecentOrders />)

    await waitFor(() => {
      expect(screen.queryByText(/Order #/)).not.toBeInTheDocument()
    })
    expect(screen.getByText("Recent Orders")).toBeInTheDocument()
  })

  it.each([
    ["orderItems missing entirely", undefined],
    ["orderItems null", null],
    ["orderItems not an array", { totalPrice: 50 }],
  ])("shows $0.00 instead of crashing when an order's %s", async (_label, orderItemsOverride) => {
    const order: Record<string, unknown> = { ...makeVendorOrder(), orderItems: orderItemsOverride }
    if (orderItemsOverride === undefined) delete order.orderItems
    serveOrders(ordersResponse([order]))
    render(<VendorRecentOrders />)

    expect(await screen.findByText("$0.00")).toBeInTheDocument()
  })

  it("treats a non-finite totalPrice on an order item as 0 instead of crashing or showing NaN", async () => {
    serveOrders(
      ordersResponse([
        makeVendorOrder({
          orderItems: [
            // biome-ignore lint/suspicious/noExplicitAny: intentionally malformed backend payload
            makeVendorOrderItem({ totalPrice: Number.NaN as any }),
          ],
        }),
      ]),
    )
    render(<VendorRecentOrders />)

    expect(await screen.findByText("$0.00")).toBeInTheDocument()
  })

  it.each([
    ["buyerName null", { buyerName: null, buyerSurname: "Doe" }, "D"],
    ["buyerSurname null", { buyerName: "Jane", buyerSurname: null }, "J"],
    ["both null", { buyerName: null, buyerSurname: null }, "—"],
  ])("does not crash when %s, showing whatever initials it can", async (_label, overrides, expectedInitials) => {
    const order = { ...makeVendorOrder(), ...overrides }
    serveOrders(ordersResponse([order]))
    render(<VendorRecentOrders />)

    await screen.findByText("Recent Orders")
    expect(await screen.findByText(expectedInitials)).toBeInTheDocument()
  })

  it("does not request order data for an unauthenticated visitor", async () => {
    useAuthStore.getState().clearAuth()
    const requests = serveOrders(ordersResponse([]))
    render(<VendorRecentOrders />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(requests).toHaveLength(0)
  })
})
