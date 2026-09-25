import { describe, expect, it } from "vitest"
import { makeVendorOrder, makeVendorOrderItem } from "@/test/factories"
import { patchCancelledItems, patchConfirmedReturns, patchRejectedReturns } from "./order-patches"

describe("patchCancelledItems", () => {
  it("moves only the confirmed item ids to CANCEL_REQUESTED, leaving siblings untouched", () => {
    const before = [
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [
          makeVendorOrderItem({ id: "vitem-1", status: "WAITING_FOR_SHIPMENT" }),
          makeVendorOrderItem({ id: "vitem-2", status: "WAITING_FOR_SHIPMENT" }),
        ],
      }),
    ]

    const after = patchCancelledItems(before, ["vitem-1"])

    const items = after[0]?.orderItems ?? []
    expect(items.find((item) => item.id === "vitem-1")?.status).toBe("CANCEL_REQUESTED")
    expect(items.find((item) => item.id === "vitem-2")?.status).toBe("WAITING_FOR_SHIPMENT")
  })

  it("leaves every order untouched when no ids match", () => {
    const before = [makeVendorOrder({ orderId: "vorder-1", orderItems: [makeVendorOrderItem({ id: "vitem-1" })] })]
    const after = patchCancelledItems(before, ["does-not-exist"])
    expect(after).toEqual(before)
  })
})

describe("patchConfirmedReturns", () => {
  it("approves only the matching item, clearing any prior rejection reason", () => {
    const before = [
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [
          makeVendorOrderItem({
            id: "vitem-1",
            status: "DELIVERED",
            returnRefundStatus: "DELIVERED",
            returnRejectReason: "too late",
          }),
        ],
      }),
    ]

    const after = patchConfirmedReturns(before, ["vitem-1"])

    const item = after[0]?.orderItems[0]
    expect(item?.returnRefundStatus).toBe("APPROVED")
    expect(item?.sellerConfirmedReturn).toBe(true)
    expect(item?.returnRejectReason).toBeNull()
  })
})

describe("patchRejectedReturns", () => {
  it("rejects only the matching item with the given reason and a reject date", () => {
    const before = [
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [makeVendorOrderItem({ id: "vitem-1", status: "DELIVERED", returnRefundStatus: "DELIVERED" })],
      }),
    ]

    const after = patchRejectedReturns(before, ["vitem-1"], "Item was used")

    const item = after[0]?.orderItems[0]
    expect(item?.returnRefundStatus).toBe("REJECTED_BY_SELLER")
    expect(item?.returnRejectReason).toBe("Item was used")
    expect(typeof item?.returnRejectDate).toBe("string")
  })

  it("does not touch a sibling item that was not rejected", () => {
    const before = [
      makeVendorOrder({
        orderId: "vorder-1",
        orderItems: [
          makeVendorOrderItem({ id: "vitem-1", returnRefundStatus: "DELIVERED" }),
          makeVendorOrderItem({ id: "vitem-2", returnRefundStatus: "DELIVERED" }),
        ],
      }),
    ]

    const after = patchRejectedReturns(before, ["vitem-1"], "reason")

    expect(after[0]?.orderItems.find((item) => item.id === "vitem-2")?.returnRefundStatus).toBe("DELIVERED")
  })
})
