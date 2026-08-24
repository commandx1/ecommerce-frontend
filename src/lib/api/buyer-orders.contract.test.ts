import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import {
  makeBuyerOrder,
  makeBuyerOrderItem,
  makeBuyerOrderSellerGroup,
  makeBuyerOrdersResponse,
  makeCancelDuringDeliveryByCustomerResponse,
} from "@/test/factories"
import { buyerOrdersAPI, type CancelDuringDeliveryByCustomerPayload, type RefundOrderPayload } from "./buyer-orders"

const mockOrdersResponse = makeBuyerOrdersResponse({
  orders: [
    makeBuyerOrder({
      sellerGroups: [makeBuyerOrderSellerGroup({ orderItems: [makeBuyerOrderItem()] })],
    }),
  ],
  currentPage: 1,
  totalPages: 5,
  totalElements: 42,
})

const mockCancelResponse = makeCancelDuringDeliveryByCustomerResponse()

let capturedQuery: URLSearchParams | null = null
let capturedCancelPayload: CancelDuringDeliveryByCustomerPayload | null = null
let capturedRefundPayload: RefundOrderPayload | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. They are registered per test because the global setup resets handlers after every
 * test case.
 */
beforeEach(() => {
  capturedQuery = null
  capturedCancelPayload = null
  capturedRefundPayload = null

  server.use(
    http.get("*/backend-api/orders/buyer", ({ request }) => {
      capturedQuery = new URL(request.url).searchParams
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
})

describe("buyerOrdersAPI contract", () => {
  it("sends expected query parameters and returns typed buyer orders response", async () => {
    const response = await buyerOrdersAPI.getBuyerOrders(1, 10, "createdDate", "asc", "RETURNED")

    expect(capturedQuery?.get("page")).toBe("1")
    expect(capturedQuery?.get("size")).toBe("10")
    expect(capturedQuery?.get("sortBy")).toBe("createdDate")
    expect(capturedQuery?.get("sortDir")).toBe("asc")
    expect(capturedQuery?.get("type")).toBe("RETURNED")

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

describe("buyerOrdersAPI pagination and filter serialisation", () => {
  it("uses a 0-indexed first page, a size of 10 and type=ALL by default", async () => {
    await buyerOrdersAPI.getBuyerOrders()

    // Pagination is 0-indexed on the wire: the first page is page=0, not page=1.
    expect(capturedQuery?.get("page")).toBe("0")
    expect(capturedQuery?.get("size")).toBe("10")
    expect(capturedQuery?.get("type")).toBe("ALL")
  })

  it("omits sortBy and sortDir entirely when they are not supplied", async () => {
    await buyerOrdersAPI.getBuyerOrders(2, 50)

    expect(capturedQuery?.get("page")).toBe("2")
    expect(capturedQuery?.get("size")).toBe("50")
    expect(capturedQuery?.has("sortBy")).toBe(false)
    expect(capturedQuery?.has("sortDir")).toBe(false)
    expect(capturedQuery?.get("type")).toBe("ALL")
  })

  it.each(["ALL", "WAITING_FOR_SHIPMENT", "ON_WAY", "DELIVERED", "CANCELLED", "RETURNED"] as const)(
    "serialises the %s filter",
    async (type) => {
      await buyerOrdersAPI.getBuyerOrders(0, 10, "createdDate", "desc", type)

      expect(capturedQuery?.get("type")).toBe(type)
      expect(capturedQuery?.get("sortDir")).toBe("desc")
    },
  )

  it("sends exactly the five supported query params and nothing else", async () => {
    await buyerOrdersAPI.getBuyerOrders(1, 20, "totalPrice", "asc", "DELIVERED")

    expect([...(capturedQuery?.keys() ?? [])].sort()).toEqual(["page", "size", "sortBy", "sortDir", "type"])
  })

  it("aborts in flight when the caller's signal fires", async () => {
    const controller = new AbortController()
    const pending = buyerOrdersAPI.getBuyerOrders(0, 10, undefined, undefined, "ALL", controller.signal)
    controller.abort()

    const error = await pending.catch((caught: unknown) => caught)

    expect((error as { code?: string }).code).toBe("ERR_CANCELED")
  })
})

describe("buyerOrdersAPI response tolerance", () => {
  it("returns an empty page without throwing", async () => {
    server.use(
      http.get("*/backend-api/orders/buyer", () =>
        HttpResponse.json(
          makeBuyerOrdersResponse({ orders: [], currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 10 }),
        ),
      ),
    )

    const response = await buyerOrdersAPI.getBuyerOrders()

    expect(response.orders).toEqual([])
    expect(response.totalElements).toBe(0)
    expect(typeof response.totalPages).toBe("number")
  })

  it("keeps numeric money and count fields numeric", async () => {
    const response = await buyerOrdersAPI.getBuyerOrders()
    const item = response.orders[0]?.sellerGroups?.[0]?.orderItems[0]

    expect(typeof response.orders[0]?.totalPrice).toBe("number")
    expect(typeof item?.price).toBe("number")
    expect(typeof item?.quantity).toBe("number")
  })

  it("tolerates an order shaped as a flat orderItems list with no sellerGroups", async () => {
    server.use(
      http.get("*/backend-api/orders/buyer", () =>
        HttpResponse.json(
          makeBuyerOrdersResponse({
            orders: [makeBuyerOrder({ sellerGroups: undefined, orderItems: [makeBuyerOrderItem()] })],
          }),
        ),
      ),
    )

    const response = await buyerOrdersAPI.getBuyerOrders()

    expect(response.orders[0]?.sellerGroups).toBeUndefined()
    expect(response.orders[0]?.orderItems).toHaveLength(1)
  })

  it("tolerates null optional item fields and a missing cover photo", async () => {
    server.use(
      http.get("*/backend-api/orders/buyer", () =>
        HttpResponse.json(
          makeBuyerOrdersResponse({
            orders: [
              makeBuyerOrder({
                autoOrder: true,
                cardLast4: null,
                cardExpMonth: null,
                sellerGroups: [
                  makeBuyerOrderSellerGroup({
                    cancellationShipmentFee: null,
                    orderItems: [
                      makeBuyerOrderItem({
                        productCoverPhotoPath: null,
                        shipmentPrice: null,
                        refundStatus: null,
                        returnReason: null,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ),
      ),
    )

    const response = await buyerOrdersAPI.getBuyerOrders()
    const order = response.orders[0]

    expect(order?.autoOrder).toBe(true)
    expect(order?.cardLast4).toBeNull()
    expect(order?.sellerGroups?.[0]?.cancellationShipmentFee).toBeNull()
    expect(order?.sellerGroups?.[0]?.orderItems[0]?.productCoverPhotoPath).toBeNull()
  })
})

describe("buyerOrdersAPI error paths", () => {
  it("flags a 401 as auth-handled", async () => {
    server.use(http.get("*/backend-api/orders/buyer", () => HttpResponse.json({ message: "Expired" }, { status: 401 })))

    const error = await buyerOrdersAPI.getBuyerOrders().catch((caught: unknown) => caught)

    expect((error as { authHandled?: boolean }).authHandled).toBe(true)
  })

  it("leaves a 403 for the caller to surface inline", async () => {
    server.use(
      http.get("*/backend-api/orders/buyer", () => HttpResponse.json({ message: "Not a buyer" }, { status: 403 })),
    )

    const error = await buyerOrdersAPI.getBuyerOrders().catch((caught: unknown) => caught)

    expect((error as { response?: { status?: number } }).response?.status).toBe(403)
    expect((error as { authHandled?: boolean }).authHandled).toBeUndefined()
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/backend-api/orders/buyer", () => HttpResponse.error()))

    await expect(buyerOrdersAPI.getBuyerOrders()).rejects.toThrow()
  })

  it.each([
    [400, "No cancellable items in the request"],
    [404, "Order item not found"],
    [409, "Item has already been delivered"],
  ])("rejects a cancellation on %i", async (status, message) => {
    server.use(
      http.post("*/backend-api/orders/cancelDuringDeliveryByCustomer", () =>
        HttpResponse.json({ message }, { status }),
      ),
    )

    await expect(buyerOrdersAPI.cancelDuringDeliveryByCustomer({ orderItemIds: ["item-1"] })).rejects.toMatchObject({
      response: { status, data: { message } },
    })
  })

  it("reports a partial cancellation without rejecting", async () => {
    server.use(
      http.post("*/backend-api/orders/cancelDuringDeliveryByCustomer", () =>
        HttpResponse.json(
          makeCancelDuringDeliveryByCustomerResponse({
            successCount: 1,
            failureCount: 1,
            cancelledOrderItemIds: ["item-1"],
          }),
        ),
      ),
    )

    const response = await buyerOrdersAPI.cancelDuringDeliveryByCustomer({ orderItemIds: ["item-1", "item-2"] })

    expect(response.successCount).toBe(1)
    expect(response.failureCount).toBe(1)
    expect(response.cancelledOrderItemIds).toEqual(["item-1"])
  })

  it("sends an empty cancellation list verbatim", async () => {
    await buyerOrdersAPI.cancelDuringDeliveryByCustomer({ orderItemIds: [] })

    expect(capturedCancelPayload).toEqual({ orderItemIds: [] })
  })

  it("returns a refund response with tracking links attached", async () => {
    server.use(
      http.post("*/backend-api/orders/refundOrder", () =>
        HttpResponse.json({
          message: "Return created",
          itemLinks: [
            {
              orderItemId: "item-1",
              returnTrackingLinks: [{ trackingUrl: "https://track.example.com/r1", status: "CREATED" }],
              returnShippingLinks: [{ shippingUrl: "https://label.example.com/r1" }],
            },
          ],
        }),
      ),
    )

    const response = await buyerOrdersAPI.refundOrder({
      items: [{ orderItemId: "item-1", quantity: 1, returnReason: "Damaged" }],
    })

    expect(response.itemLinks?.[0]?.orderItemId).toBe("item-1")
    expect(response.itemLinks?.[0]?.returnTrackingLinks[0]?.trackingUrl).toBe("https://track.example.com/r1")
  })

  it("returns a refund response with neither message nor links", async () => {
    let emptyRefundPayload: RefundOrderPayload | null = null
    server.use(
      http.post("*/backend-api/orders/refundOrder", async ({ request }) => {
        emptyRefundPayload = (await request.json()) as RefundOrderPayload
        return HttpResponse.json({})
      }),
    )

    const response = await buyerOrdersAPI.refundOrder({ items: [] })

    expect(response.message).toBeUndefined()
    expect(response.itemLinks).toBeUndefined()
    expect(emptyRefundPayload).toEqual({ items: [] })
  })

  it("rejects a refund that the backend refuses", async () => {
    server.use(
      http.post("*/backend-api/orders/refundOrder", () =>
        HttpResponse.json({ message: "The return window has closed" }, { status: 409 }),
      ),
    )

    await expect(
      buyerOrdersAPI.refundOrder({ items: [{ orderItemId: "item-1", quantity: 1, returnReason: "Late" }] }),
    ).rejects.toMatchObject({ response: { status: 409 } })
  })
})
