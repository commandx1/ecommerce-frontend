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
  it("routes a vendor's VENDOR_WAITING_FOR_UBER_DIRECT notification to the orders page", () => {
    const href = resolveNotificationHref({ type: "VENDOR_WAITING_FOR_UBER_DIRECT", orderId: "order-1" }, "vendor")
    expect(href).toBe("/vendor-dashboard/orders")
  })

  it("falls back to the notifications page for an unknown type", () => {
    const href = resolveNotificationHref({ type: "SOME_UNKNOWN_TYPE", orderId: null }, "vendor")
    expect(href).toBe("/vendor-dashboard/notifications")
  })

  it("falls back to the notifications page when a buyer receives a VENDOR_* type", () => {
    const href = resolveNotificationHref({ type: "VENDOR_WAITING_FOR_UBER_DIRECT", orderId: "order-1" }, "buyer")
    expect(href).toBe("/buyer-dashboard/notifications")
  })
})
