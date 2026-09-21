import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import type {
  CancelBySellerPayload,
  ProcessUberDeliveriesPayload,
  SellerConfirmReturnPayload,
  SellerRejectReturnPayload,
  VendorOrdersResponse,
} from "./vendor-orders"
import { vendorOrdersAPI } from "./vendor-orders"

function makeVendorOrder(overrides: Partial<VendorOrdersResponse["orders"][number]> = {}) {
  return {
    orderId: "order-1",
    orderStatus: "WAITING_FOR_SHIPMENT",
    orderCreatedDate: "2026-08-01T10:00:00Z",
    buyerId: "buyer-1",
    buyerName: "Jane",
    buyerSurname: "Doe",
    totalShippingCost: 12.5,
    cancellationShipmentFee: null,
    cancellationShipmentRefundFee: null,
    autoOrder: false,
    orderItems: [
      {
        id: "item-1",
        userProductId: "up-1",
        productName: "Nitrile Gloves",
        price: 25,
        quantity: 2,
        totalPrice: 50,
        status: "WAITING_FOR_SHIPMENT",
        updatedDate: "2026-08-01T10:00:00Z",
      },
    ],
    ...overrides,
  }
}

const mockOrdersResponse: VendorOrdersResponse = {
  orders: [makeVendorOrder()],
  currentPage: 0,
  totalPages: 3,
  totalElements: 25,
  pageSize: 10,
}

let capturedQuery: URLSearchParams | null = null
let capturedUberPayload: ProcessUberDeliveriesPayload | null = null
let capturedCancelPayload: CancelBySellerPayload | null = null
let capturedConfirmReturnPayload: SellerConfirmReturnPayload | null = null
let capturedRejectReturnPayload: SellerRejectReturnPayload | null = null

beforeEach(() => {
  capturedQuery = null
  capturedUberPayload = null
  capturedCancelPayload = null
  capturedConfirmReturnPayload = null
  capturedRejectReturnPayload = null

  server.use(
    http.get("*/backend-api/orders/seller", ({ request }) => {
      capturedQuery = new URL(request.url).searchParams
      return HttpResponse.json(mockOrdersResponse)
    }),
    http.post("*/backend-api/orders/uber/process-deliveries", async ({ request }) => {
      capturedUberPayload = (await request.json()) as ProcessUberDeliveriesPayload
      return HttpResponse.json({
        message: "Deliveries processed",
        successCount: 1,
        failureCount: 0,
        deliveryId: "uber-delivery-1",
        shippingPrice: 9.99,
        trackingUrl: "https://uber.example.com/track/1",
      })
    }),
    http.post("*/backend-api/orders/cancelBySeller", async ({ request }) => {
      capturedCancelPayload = (await request.json()) as CancelBySellerPayload
      return HttpResponse.json({
        message: "Order items cancelled",
        successCount: 1,
        failureCount: 0,
        cancelledOrderItemIds: ["item-1"],
      })
    }),
    http.post("*/backend-api/orders/sellerConfirmReturn", async ({ request }) => {
      capturedConfirmReturnPayload = (await request.json()) as SellerConfirmReturnPayload
      return HttpResponse.json({ message: "Return confirmed", refundAmount: 50, orderItemIds: ["item-1"] })
    }),
    http.post("*/backend-api/orders/sellerRejectReturn", async ({ request }) => {
      capturedRejectReturnPayload = (await request.json()) as SellerRejectReturnPayload
      return HttpResponse.json({ message: "Return rejected", orderItemIds: ["item-1"] })
    }),
  )
})

describe("vendorOrdersAPI.getVendorOrders contract", () => {
  it("defaults to page 0, size 10, type ALL (0-indexed pagination)", async () => {
    await vendorOrdersAPI.getVendorOrders()

    expect(capturedQuery?.get("page")).toBe("0")
    expect(capturedQuery?.get("size")).toBe("10")
    expect(capturedQuery?.get("type")).toBe("ALL")
    expect(capturedQuery?.has("sortBy")).toBe(false)
    expect(capturedQuery?.has("sortDir")).toBe(false)
  })

  it("sends explicit paging, sorting and filter type", async () => {
    await vendorOrdersAPI.getVendorOrders(2, 25, "orderCreatedDate", "desc", "DELIVERED")

    expect(capturedQuery?.get("page")).toBe("2")
    expect(capturedQuery?.get("size")).toBe("25")
    expect(capturedQuery?.get("sortBy")).toBe("orderCreatedDate")
    expect(capturedQuery?.get("sortDir")).toBe("desc")
    expect(capturedQuery?.get("type")).toBe("DELIVERED")
  })

  it("returns the typed order page", async () => {
    const response = await vendorOrdersAPI.getVendorOrders()

    expect(response.orders).toHaveLength(1)
    expect(response.orders[0]?.orderId).toBe("order-1")
    expect(response.totalPages).toBe(3)
    expect(response.totalElements).toBe(25)
  })

  it("tolerates an empty order list for a new vendor", async () => {
    server.use(
      http.get("*/backend-api/orders/seller", () =>
        HttpResponse.json({ orders: [], currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 10 }),
      ),
    )

    const response = await vendorOrdersAPI.getVendorOrders()

    expect(response.orders).toEqual([])
  })

  it("rejects with a 401 and marks the error auth-handled", async () => {
    server.use(
      http.get("*/backend-api/orders/seller", () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })),
    )

    const error = await vendorOrdersAPI.getVendorOrders().catch((e) => e)

    expect(error.response?.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/backend-api/orders/seller", () => HttpResponse.error()))

    await expect(vendorOrdersAPI.getVendorOrders()).rejects.toThrow()
  })

  it("includes orderId when provided, and omits it otherwise", async () => {
    await vendorOrdersAPI.getVendorOrders(0, 10, "createdDate", "desc", "ALL", undefined, "order-99")
    expect(capturedQuery?.get("orderId")).toBe("order-99")

    await vendorOrdersAPI.getVendorOrders()
    expect(capturedQuery?.has("orderId")).toBe(false)
  })

  it("adds orderId without disturbing the other params", async () => {
    await vendorOrdersAPI.getVendorOrders(
      2,
      25,
      "orderCreatedDate",
      "desc",
      "DELIVERED",
      undefined,
      "11111111-1111-1111-1111-111111111111",
    )

    expect(capturedQuery?.get("page")).toBe("2")
    expect(capturedQuery?.get("size")).toBe("25")
    expect(capturedQuery?.get("sortBy")).toBe("orderCreatedDate")
    expect(capturedQuery?.get("sortDir")).toBe("desc")
    expect(capturedQuery?.get("type")).toBe("DELIVERED")
    expect(capturedQuery?.get("orderId")).toBe("11111111-1111-1111-1111-111111111111")
  })

  it("omits the orderId key for an empty string", async () => {
    await vendorOrdersAPI.getVendorOrders(0, 10, "createdDate", "desc", "ALL", undefined, "")
    expect(capturedQuery?.has("orderId")).toBe(false)
  })

  it("still forwards the abort signal when orderId is set", async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      vendorOrdersAPI.getVendorOrders(
        0,
        10,
        "createdDate",
        "desc",
        "ALL",
        controller.signal,
        "11111111-1111-1111-1111-111111111111",
      ),
    ).rejects.toBeTruthy()
  })
})

describe("vendorOrdersAPI.processUberDeliveries contract", () => {
  it("sends the order item id list and returns the delivery result", async () => {
    const payload: ProcessUberDeliveriesPayload = { orderItemIds: ["item-1", "item-2"] }

    const response = await vendorOrdersAPI.processUberDeliveries(payload)

    expect(capturedUberPayload).toEqual(payload)
    expect(response.deliveryId).toBe("uber-delivery-1")
    expect(response.trackingUrl).toContain("https://")
  })

  it("returns a partial-success result when some deliveries fail", async () => {
    server.use(
      http.post("*/backend-api/orders/uber/process-deliveries", () =>
        HttpResponse.json({
          message: "Some deliveries failed",
          successCount: 1,
          failureCount: 1,
          deliveryId: "uber-delivery-2",
          shippingPrice: 9.99,
          trackingUrl: "https://uber.example.com/track/2",
        }),
      ),
    )

    const response = await vendorOrdersAPI.processUberDeliveries({ orderItemIds: ["item-1", "item-2"] })

    expect(response.successCount).toBe(1)
    expect(response.failureCount).toBe(1)
  })

  it("rejects with a 500 when Uber delivery cannot be scheduled", async () => {
    // OrderUberDeliveryService.java only ever throws ShipmentProcessException (e.g. "No default
    // address found for user", "Error calling Uber delivery API"), which OrderExceptionHandler.java
    // maps to 500 -- there is no 400 or 409 mapping for this endpoint.
    server.use(
      http.post("*/backend-api/orders/uber/process-deliveries", () =>
        HttpResponse.json({ message: "No default address found for user" }, { status: 500 }),
      ),
    )

    await expect(vendorOrdersAPI.processUberDeliveries({ orderItemIds: ["item-1"] })).rejects.toThrow(/500/)
  })
})

describe("vendorOrdersAPI.cancelBySeller contract", () => {
  it("sends the order item id list and returns the cancellation result", async () => {
    const payload: CancelBySellerPayload = { orderItemIds: ["item-1"] }

    const response = await vendorOrdersAPI.cancelBySeller(payload)

    expect(capturedCancelPayload).toEqual(payload)
    expect(response.cancelledOrderItemIds).toEqual(["item-1"])
    expect(response.successCount).toBe(1)
  })

  it("rejects with a 400 when the order item's cancellation window has expired", async () => {
    // OrderCancellationService.java:427 (`validateSellerOwnershipAndEligibility`) throws
    // OrderCancellationException for a stale or non-cancellable item, which OrderExceptionHandler.java
    // maps to 400 -- there is no 409 or 500 mapping for cancelBySeller (Shippo/Stripe failures in
    // this flow are also wrapped into OrderCancellationException, e.g. line 656 "Stripe refund failed").
    server.use(
      http.post("*/backend-api/orders/cancelBySeller", () =>
        HttpResponse.json({ message: "Order item cancellation window expired: item-1" }, { status: 400 }),
      ),
    )

    await expect(vendorOrdersAPI.cancelBySeller({ orderItemIds: ["item-1"] })).rejects.toThrow(/400/)
  })

  it("rejects with a 403 when the order item belongs to another seller", async () => {
    server.use(
      http.post("*/backend-api/orders/cancelBySeller", () =>
        HttpResponse.json({ message: "Order item does not belong to the current seller" }, { status: 403 }),
      ),
    )

    const error = await vendorOrdersAPI.cancelBySeller({ orderItemIds: ["item-1"] }).catch((e) => e)

    expect(error.response?.status).toBe(403)
  })
})

describe("vendorOrdersAPI.sellerConfirmReturn contract", () => {
  it("sends the order item id list and returns the refund amount", async () => {
    const payload: SellerConfirmReturnPayload = { orderItemIds: ["item-1"] }

    const response = await vendorOrdersAPI.sellerConfirmReturn(payload)

    expect(capturedConfirmReturnPayload).toEqual(payload)
    expect(response.refundAmount).toBe(50)
    expect(response.orderItemIds).toEqual(["item-1"])
  })

  it("rejects with a 400 when the return window has already closed", async () => {
    server.use(
      http.post("*/backend-api/orders/sellerConfirmReturn", () =>
        HttpResponse.json({ message: "Return window closed" }, { status: 400 }),
      ),
    )

    await expect(vendorOrdersAPI.sellerConfirmReturn({ orderItemIds: ["item-1"] })).rejects.toThrow(/400/)
  })
})

describe("vendorOrdersAPI.sellerRejectReturn contract", () => {
  it("sends the per-item reject reason payload shape", async () => {
    const payload: SellerRejectReturnPayload = {
      items: [{ orderItemId: "item-1", returnRejectReason: "Item shows signs of use" }],
    }

    const response = await vendorOrdersAPI.sellerRejectReturn(payload)

    expect(capturedRejectReturnPayload).toEqual(payload)
    expect(response.orderItemIds).toEqual(["item-1"])
  })

  it("sends multiple items with distinct reject reasons", async () => {
    const payload: SellerRejectReturnPayload = {
      items: [
        { orderItemId: "item-1", returnRejectReason: "Used" },
        { orderItemId: "item-2", returnRejectReason: "Missing packaging" },
      ],
    }

    await vendorOrdersAPI.sellerRejectReturn(payload)

    expect(capturedRejectReturnPayload).toEqual(payload)
  })

  it("rejects with a 400 when the order item does not exist", async () => {
    // OrderRefundService.java (sellerRejectReturn validation, ~line 836) throws
    // OrderCancellationException for an unknown order item, which OrderExceptionHandler.java
    // maps to 400 -- there is no 404 mapping for sellerRejectReturn.
    server.use(
      http.post("*/backend-api/orders/sellerRejectReturn", () =>
        HttpResponse.json({ message: "Order item not found: missing" }, { status: 400 }),
      ),
    )

    await expect(
      vendorOrdersAPI.sellerRejectReturn({ items: [{ orderItemId: "missing", returnRejectReason: "x" }] }),
    ).rejects.toThrow(/400/)
  })

  it("rejects on a network failure", async () => {
    server.use(http.post("*/backend-api/orders/sellerRejectReturn", () => HttpResponse.error()))

    await expect(
      vendorOrdersAPI.sellerRejectReturn({ items: [{ orderItemId: "item-1", returnRejectReason: "x" }] }),
    ).rejects.toThrow()
  })
})
