import { describe, expect, it } from "vitest"
import { isNotificationPushPayload } from "./push-payload"

describe("isNotificationPushPayload", () => {
  it("accepts a valid payload", () => {
    expect(
      isNotificationPushPayload({
        notificationId: "notif-1",
        type: "VENDOR_WAITING_FOR_UBER_DIRECT",
        orderId: "order-1",
        title: "Title",
        message: "Message",
        createdDate: "2026-09-13T10:00:00Z",
      }),
    ).toBe(true)
  })

  it("accepts a payload with orderId missing, null or omitted", () => {
    expect(
      isNotificationPushPayload({
        notificationId: "notif-1",
        type: "ANY_TYPE",
        orderId: null,
        title: "Title",
        message: "Message",
      }),
    ).toBe(true)

    expect(
      isNotificationPushPayload({
        notificationId: "notif-1",
        title: "Title",
        message: "Message",
      }),
    ).toBe(true)
  })

  it("accepts extra unknown fields", () => {
    expect(
      isNotificationPushPayload({
        notificationId: "notif-1",
        title: "Title",
        message: "Message",
        vendorUserId: "vendor-1",
        waitingForUberDirectOrderCount: 3,
      }),
    ).toBe(true)
  })

  it("rejects null, undefined, strings and arrays", () => {
    expect(isNotificationPushPayload(null)).toBe(false)
    expect(isNotificationPushPayload(undefined)).toBe(false)
    expect(isNotificationPushPayload("notif-1")).toBe(false)
    expect(isNotificationPushPayload([])).toBe(false)
  })

  it("rejects an object missing required string fields", () => {
    expect(isNotificationPushPayload({ notificationId: "notif-1", message: "Message" })).toBe(false)
    expect(isNotificationPushPayload({ notificationId: "notif-1", title: "Title" })).toBe(false)
    expect(isNotificationPushPayload({ title: "Title", message: "Message" })).toBe(false)
  })
})
