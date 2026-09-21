import { describe, expect, it } from "vitest"
import { getDashboardRole, getNotificationsPageHref, resolveNotificationHref } from "./resolve-notification-href"

describe("getDashboardRole", () => {
  it("maps 'Vendor' to 'vendor'", () => {
    expect(getDashboardRole("Vendor")).toBe("vendor")
  })

  it("maps any other role, undefined or null to 'buyer'", () => {
    expect(getDashboardRole("Buyer")).toBe("buyer")
    expect(getDashboardRole(undefined)).toBe("buyer")
    expect(getDashboardRole(null)).toBe("buyer")
    expect(getDashboardRole("Admin")).toBe("buyer")
  })
})

describe("getNotificationsPageHref", () => {
  it("builds the per-role notifications page path", () => {
    expect(getNotificationsPageHref("vendor")).toBe("/vendor-dashboard/notifications")
    expect(getNotificationsPageHref("buyer")).toBe("/buyer-dashboard/notifications")
  })
})

describe("resolveNotificationHref", () => {
  it("routes a vendor's VENDOR_WAITING_FOR_UBER_DIRECT notification without an orderId to the orders page", () => {
    const href = resolveNotificationHref({ type: "VENDOR_WAITING_FOR_UBER_DIRECT", orderId: null }, "vendor")
    expect(href).toBe("/vendor-dashboard/orders")
  })

  it("falls back to the notifications page for an unknown type without an orderId", () => {
    const href = resolveNotificationHref({ type: "SOME_UNKNOWN_TYPE", orderId: null }, "vendor")
    expect(href).toBe("/vendor-dashboard/notifications")
  })

  it("falls back to the notifications page when a buyer receives a VENDOR_* type without an orderId", () => {
    const href = resolveNotificationHref({ type: "VENDOR_WAITING_FOR_UBER_DIRECT", orderId: null }, "buyer")
    expect(href).toBe("/buyer-dashboard/notifications")
  })

  const VALID_ORDER_ID = "11111111-1111-1111-1111-111111111111"

  it("routes any notification carrying a valid orderId to that role's orders page, regardless of type", () => {
    expect(resolveNotificationHref({ type: "SOME_UNKNOWN_TYPE", orderId: VALID_ORDER_ID }, "vendor")).toBe(
      `/vendor-dashboard/orders?orderId=${VALID_ORDER_ID}`,
    )
    expect(resolveNotificationHref({ type: "SOME_UNKNOWN_TYPE", orderId: VALID_ORDER_ID }, "buyer")).toBe(
      `/buyer-dashboard/orders?orderId=${VALID_ORDER_ID}`,
    )
  })

  it("encodes the (already-validated) orderId in the query string", () => {
    const href = resolveNotificationHref({ type: "SOME_UNKNOWN_TYPE", orderId: VALID_ORDER_ID }, "buyer")
    expect(href).toBe(`/buyer-dashboard/orders?orderId=${encodeURIComponent(VALID_ORDER_ID)}`)
  })

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
    "SOME_FUTURE_TYPE_NOT_YET_KNOWN",
  ])("routes a %s notification with a valid orderId to the orders page for buyer and vendor", (type) => {
    expect(resolveNotificationHref({ type, orderId: VALID_ORDER_ID }, "buyer")).toBe(
      `/buyer-dashboard/orders?orderId=${VALID_ORDER_ID}`,
    )
    expect(resolveNotificationHref({ type, orderId: VALID_ORDER_ID }, "vendor")).toBe(
      `/vendor-dashboard/orders?orderId=${VALID_ORDER_ID}`,
    )
  })

  it.each([
    ["null", null],
    ["empty string", ""],
    ["whitespace only", "   "],
    ["a non-UUID string", "not-a-uuid"],
    ["a hostile string", "<script>alert(1)</script>"],
  ])("falls through to the old behaviour when orderId is %s", (_name, orderId) => {
    expect(resolveNotificationHref({ type: "SOME_UNKNOWN_TYPE", orderId }, "buyer")).toBe(
      "/buyer-dashboard/notifications",
    )
    expect(resolveNotificationHref({ type: "VENDOR_WAITING_FOR_UBER_DIRECT", orderId }, "vendor")).toBe(
      "/vendor-dashboard/orders",
    )
  })

  it("lowercases an upper-case orderId in the resolved URL", () => {
    const href = resolveNotificationHref({ type: "SOME_UNKNOWN_TYPE", orderId: VALID_ORDER_ID.toUpperCase() }, "buyer")
    expect(href).toBe(`/buyer-dashboard/orders?orderId=${VALID_ORDER_ID}`)
  })
})
