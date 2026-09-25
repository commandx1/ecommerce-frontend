import { describe, expect, it } from "vitest"
import type { BuyerOrder, BuyerOrderItem } from "@/lib/api/buyer-orders"
import { OrderItemStatus } from "@/lib/constants/order-item-status"
import { defined } from "@/test/defined"
import { applyRefundSubmitted, markItemsCancelRequested } from "./order-patches"

function makeItem(overrides: Partial<BuyerOrderItem> = {}): BuyerOrderItem {
  return {
    id: "item-1",
    userProductId: "up-1",
    productId: "product-1",
    price: 10,
    quantity: 1,
    status: "WAITING_FOR_SHIPMENT",
    productName: "Dental Kit",
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    updatedDate: "2026-05-20T11:00:00Z",
    ...overrides,
  }
}

function makeOrder(overrides: Partial<BuyerOrder> = {}): BuyerOrder {
  return {
    orderId: "order-1",
    totalPrice: 10,
    orderStatus: "PAID",
    createdDate: "2026-05-20T10:30:00Z",
    addressTitle: "Home",
    addressFormattedAddress: "Address",
    ...overrides,
  }
}

describe("markItemsCancelRequested", () => {
  it("flips matching items in the legacy flat orderItems list to CANCEL_REQUESTED", () => {
    const order = makeOrder({ orderItems: [makeItem({ id: "item-1" }), makeItem({ id: "item-2" })] })

    const patched = defined(markItemsCancelRequested([order], new Set(["item-1"]))[0])

    expect(patched.orderItems?.[0]?.status).toBe(OrderItemStatus.CANCEL_REQUESTED)
    expect(patched.orderItems?.[1]?.status).toBe("WAITING_FOR_SHIPMENT")
  })

  it("flips matching items nested under sellerGroups[].orderItems", () => {
    const order = makeOrder({
      sellerGroups: [
        {
          sellerId: "s1",
          sellerName: "Acme",
          sellerSurname: "Store",
          orderItems: [makeItem({ id: "item-1" }), makeItem({ id: "item-2" })],
        },
      ],
    })

    const patched = defined(markItemsCancelRequested([order], new Set(["item-2"]))[0])

    expect(patched.sellerGroups?.[0]?.orderItems[0]?.status).toBe("WAITING_FOR_SHIPMENT")
    expect(patched.sellerGroups?.[0]?.orderItems[1]?.status).toBe(OrderItemStatus.CANCEL_REQUESTED)
  })

  it("leaves orders that carry no matching item id untouched", () => {
    const order = makeOrder({ orderItems: [makeItem({ id: "item-1" })] })

    const patched = defined(markItemsCancelRequested([order], new Set(["item-does-not-exist"]))[0])

    expect(patched.orderItems?.[0]?.status).toBe("WAITING_FOR_SHIPMENT")
  })

  it("tolerates a missing/non-array sellerGroups.orderItems without throwing", () => {
    const order = makeOrder({
      sellerGroups: [
        {
          sellerId: "s1",
          sellerName: "Acme",
          sellerSurname: "Store",
          // biome-ignore lint/suspicious/noExplicitAny: deliberately malformed to mirror a bad 200 body
          orderItems: null as any,
        },
      ],
    })

    expect(() => markItemsCancelRequested([order], new Set(["item-1"]))).not.toThrow()
    const patched = defined(markItemsCancelRequested([order], new Set(["item-1"]))[0])
    expect(patched.sellerGroups?.[0]?.orderItems).toEqual([])
  })

  it("does not mutate the input orders (returns new objects)", () => {
    const order = makeOrder({ orderItems: [makeItem({ id: "item-1" })] })
    const orders = [order]

    markItemsCancelRequested(orders, new Set(["item-1"]))

    expect(order.orderItems?.[0]?.status).toBe("WAITING_FOR_SHIPMENT")
  })
})

describe("applyRefundSubmitted", () => {
  const submittedAt = "2026-05-21T10:00:00Z"

  it("marks only the matching order's matching items as PENDING, leaving other orders untouched", () => {
    const targetOrder = makeOrder({ orderId: "order-1", orderItems: [makeItem({ id: "item-1" })] })
    const otherOrder = makeOrder({ orderId: "order-2", orderItems: [makeItem({ id: "item-2" })] })

    const [patchedTargetRaw, patchedOther] = applyRefundSubmitted([targetOrder, otherOrder], {
      orderId: "order-1",
      refundedItemIds: new Set(["item-1"]),
      refundReasonByOrderItemId: new Map([["item-1", "DAMAGED"]]),
      submittedAt,
      linksByItemId: new Map(),
    })
    const patchedTarget = defined(patchedTargetRaw)

    expect(patchedTarget.orderItems?.[0]).toMatchObject({
      refundStatus: "PENDING",
      returnRefundStatus: "PENDING",
      returnReason: "DAMAGED",
      returnDate: submittedAt,
    })
    expect(patchedOther).toBe(otherOrder)
  })

  it("applies the patch to nested sellerGroups[].orderItems as well as the flat list", () => {
    const order = makeOrder({
      orderId: "order-1",
      sellerGroups: [
        {
          sellerId: "s1",
          sellerName: "Acme",
          sellerSurname: "Store",
          orderItems: [makeItem({ id: "item-1" }), makeItem({ id: "item-2" })],
        },
      ],
    })

    const [patchedRaw] = applyRefundSubmitted([order], {
      orderId: "order-1",
      refundedItemIds: new Set(["item-1"]),
      refundReasonByOrderItemId: new Map(),
      submittedAt,
      linksByItemId: new Map(),
    })
    const patched = defined(patchedRaw)

    expect(patched.sellerGroups?.[0]?.orderItems[0]?.returnRefundStatus).toBe("PENDING")
    expect(patched.sellerGroups?.[0]?.orderItems[1]?.returnRefundStatus).toBeUndefined()
  })

  it("carries returnTrackingLinks/returnShippingLinks through when the backend returns them", () => {
    const order = makeOrder({ orderId: "order-1", orderItems: [makeItem({ id: "item-1" })] })

    const [patchedRaw] = applyRefundSubmitted([order], {
      orderId: "order-1",
      refundedItemIds: new Set(["item-1"]),
      refundReasonByOrderItemId: new Map(),
      submittedAt,
      linksByItemId: new Map([
        [
          "item-1",
          {
            orderItemId: "item-1",
            returnTrackingLinks: [{ trackingUrl: "https://track/return" }],
            returnShippingLinks: [{ shippingUrl: "https://ship/return" }],
          },
        ],
      ]),
    })
    const patched = defined(patchedRaw)

    expect(patched.orderItems?.[0]?.returnTrackingLinks).toEqual([{ trackingUrl: "https://track/return" }])
    expect(patched.orderItems?.[0]?.returnShippingLinks).toEqual([{ shippingUrl: "https://ship/return" }])
  })

  it("keeps the previous returnReason when no new reason is provided for that item", () => {
    const order = makeOrder({
      orderId: "order-1",
      orderItems: [makeItem({ id: "item-1", returnReason: "OLD_REASON" })],
    })

    const [patchedRaw] = applyRefundSubmitted([order], {
      orderId: "order-1",
      refundedItemIds: new Set(["item-1"]),
      refundReasonByOrderItemId: new Map(),
      submittedAt,
      linksByItemId: new Map(),
    })
    const patched = defined(patchedRaw)

    expect(patched.orderItems?.[0]?.returnReason).toBe("OLD_REASON")
  })

  it("is a no-op when no order matches the given orderId", () => {
    const order = makeOrder({ orderId: "order-1", orderItems: [makeItem({ id: "item-1" })] })

    const [patchedRaw] = applyRefundSubmitted([order], {
      orderId: "order-does-not-exist",
      refundedItemIds: new Set(["item-1"]),
      refundReasonByOrderItemId: new Map(),
      submittedAt,
      linksByItemId: new Map(),
    })
    const patched = defined(patchedRaw)

    expect(patched).toBe(order)
  })
})
