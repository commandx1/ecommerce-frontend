import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { buyerOrdersAPI, type CancelDuringDeliveryByCustomerPayload, type RefundOrderPayload } from "./buyer-orders"

const mockOrdersResponse = {
  orders: [
    {
      orderId: "order-1",
      totalPrice: 240,
      orderStatus: "PAID",
      createdDate: "2026-05-20T10:30:00Z",
      addressTitle: "Home",
      addressFormattedAddress: "Bagdat Caddesi 10, Kadikoy / Istanbul",
      sellerGroups: [
        {
          sellerId: "seller-1",
          sellerName: "Acme",
          sellerSurname: "Store",
          orderItems: [
            {
              id: "item-1",
              userProductId: "up-1",
              price: 100,
              quantity: 2,
              status: "WAITING_FOR_SHIPMENT",
              productName: "Dental Kit",
              productCoverPhotoPath: null,
              sellerName: "Acme",
              sellerSurname: "Store",
              updatedDate: "2026-05-20T11:00:00Z",
            },
          ],
        },
      ],
    },
  ],
  currentPage: 1,
  totalPages: 5,
  totalElements: 42,
  pageSize: 10,
}

const mockCancelResponse = {
  message: "Cancellation queued",
  successCount: 1,
  failureCount: 0,
  cancelledOrderItemIds: ["item-1"],
}

let capturedQuery: URLSearchParams | null = null
let capturedCancelPayload: CancelDuringDeliveryByCustomerPayload | null = null
let capturedRefundPayload: RefundOrderPayload | null = null

const server = setupServer(
  http.get("*/backend-api/orders/buyer", ({ request }) => {
    const url = new URL(request.url)
    capturedQuery = url.searchParams
    return HttpResponse.json(mockOrdersResponse)
  }),
  http.post("*/backend-api/orders/cancelDuringDeliveryByCustomer", async ({ request }) => {
    capturedCancelPayload = (await request.json()) as CancelDuringDeliveryByCustomerPayload
    return HttpResponse.json(mockCancelResponse)
  }),
  http.post("*/backend-api/orders/refundOrder", async ({ request }) => {
    capturedRefundPayload = (await request.json()) as RefundOrderPayload
    return HttpResponse.json({ message: "Return created" })
  }),
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  capturedQuery = null
  capturedCancelPayload = null
  capturedRefundPayload = null
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe("buyerOrdersAPI contract", () => {
  it("sends expected query parameters and returns typed buyer orders response", async () => {
    const response = await buyerOrdersAPI.getBuyerOrders(1, 10, "createdDate", "asc")

    expect(capturedQuery?.get("page")).toBe("1")
    expect(capturedQuery?.get("size")).toBe("10")
    expect(capturedQuery?.get("sortBy")).toBe("createdDate")
    expect(capturedQuery?.get("sortDir")).toBe("asc")

    expect(response.currentPage).toBe(1)
    expect(response.totalPages).toBe(5)
    expect(response.totalElements).toBe(42)
    expect(response.orders).toHaveLength(1)
    expect(response.orders[0]?.orderId).toBe("order-1")
    expect(response.orders[0]?.sellerGroups?.[0]?.orderItems[0]?.productName).toBe("Dental Kit")
  })

  it("sends expected cancellation payload and returns cancellation contract response", async () => {
    const payload: CancelDuringDeliveryByCustomerPayload = { orderItemIds: ["item-1"] }
    const response = await buyerOrdersAPI.cancelDuringDeliveryByCustomer(payload)

    expect(capturedCancelPayload).toEqual(payload)
    expect(response.message).toBe("Cancellation queued")
    expect(response.cancelledOrderItemIds).toEqual(["item-1"])
    expect(response.successCount).toBe(1)
    expect(response.failureCount).toBe(0)
  })

  it("sends expected refund payload and returns refund contract response", async () => {
    const payload: RefundOrderPayload = {
      items: [
        {
          orderItemId: "item-1",
          quantity: 1,
          returnReason: "Damaged product",
        },
      ],
    }

    const response = await buyerOrdersAPI.refundOrder(payload)

    expect(capturedRefundPayload).toEqual(payload)
    expect(response.message).toBe("Return created")
  })

  it("rejects when backend returns an error status", async () => {
    server.use(
      http.get("*/backend-api/orders/buyer", () =>
        HttpResponse.json(
          {
            message: "Internal server error",
          },
          { status: 500 },
        ),
      ),
    )

    await expect(buyerOrdersAPI.getBuyerOrders()).rejects.toThrow(/500/)
  })
})
