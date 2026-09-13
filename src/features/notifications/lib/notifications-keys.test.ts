import { describe, expect, it } from "vitest"
import { notificationsKeys } from "./notifications-keys"

describe("notificationsKeys", () => {
  it("shares the 'all' prefix across every key", () => {
    expect(notificationsKeys.unreadCount()[0]).toBe(notificationsKeys.all[0])
    expect(notificationsKeys.list({ page: 0, size: 20, unreadOnly: false })[0]).toBe(notificationsKeys.all[0])
  })

  it("builds a stable unread-count key", () => {
    expect(notificationsKeys.unreadCount()).toEqual(["notifications", "unread-count"])
  })

  it("includes the params object in the list key", () => {
    const params = { page: 2, size: 10, unreadOnly: true }
    expect(notificationsKeys.list(params)).toEqual(["notifications", "list", params])
  })
})
