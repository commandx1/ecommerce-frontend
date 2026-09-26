import { describe, expect, it } from "vitest"
import { queryKeys } from "@/lib/query/keys"
import { getOrderInvalidationKeys, isOrderNotificationType, isOrderRelatedPush } from "./order-invalidation"

describe("isOrderNotificationType", () => {
  it.each([
    "VENDOR_WAITING_FOR_UBER_DIRECT",
    "VENDOR_ORDER_ITEM_CANCELLED",
    "VENDOR_RETURN_CREATED",
    "VENDOR_RETURN_DELIVERED",
    "CUSTOMER_ORDER_ITEM_CANCELLED_BY_SELLER",
    "CUSTOMER_RETURN_ACCEPTED",
    "CUSTOMER_RETURN_REJECTED",
    "CUSTOMER_ORDER_SHIPPED",
    "CUSTOMER_ORDER_DELIVERED",
  ])("recognizes %s as an order notification type", (type) => {
    expect(isOrderNotificationType(type)).toBe(true)
  })

  it("rejects an unrecognized type", () => {
    expect(isOrderNotificationType("SOME_UNKNOWN_TYPE")).toBe(false)
  })
})

describe("isOrderRelatedPush", () => {
  it("is true for a known order type even without an orderId", () => {
    expect(isOrderRelatedPush({ type: "CUSTOMER_ORDER_SHIPPED", orderId: null })).toBe(true)
  })

  it("is true for an unrecognized type that still carries a resolvable orderId", () => {
    expect(isOrderRelatedPush({ type: "SOME_UNKNOWN_TYPE", orderId: "order-1" })).toBe(true)
  })

  it("is false for an unrecognized type with no orderId", () => {
    expect(isOrderRelatedPush({ type: "SOME_UNKNOWN_TYPE", orderId: null })).toBe(false)
  })
})

describe("getOrderInvalidationKeys", () => {
  it("returns only the buyer orders root for the buyer role", () => {
    expect(getOrderInvalidationKeys("buyer")).toEqual([queryKeys.orders.all])
  })

  it("returns the vendor orders and overview roots for the vendor role", () => {
    expect(getOrderInvalidationKeys("vendor")).toEqual([queryKeys.vendor.orders.all, queryKeys.vendor.overview.all])
  })
})
