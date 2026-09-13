import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeNotification, makeNotificationsPage, makeUnreadCountResponse } from "@/test/factories"
import { notificationsAPI } from "./notifications"

const mockPage = makeNotificationsPage({}, [makeNotification()])

let capturedQuery: URLSearchParams | null = null
let capturedPath: string | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. They are registered per test because the global setup resets handlers after every
 * test case.
 */
beforeEach(() => {
  capturedQuery = null
  capturedPath = null

  server.use(
    http.get("*/backend-api/notifications", ({ request }) => {
      capturedPath = new URL(request.url).pathname
      capturedQuery = new URL(request.url).searchParams
      return HttpResponse.json(mockPage)
    }),
    http.get("*/backend-api/notifications/unread", ({ request }) => {
      capturedPath = new URL(request.url).pathname
      capturedQuery = new URL(request.url).searchParams
      return HttpResponse.json(mockPage)
    }),
    http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json(makeUnreadCountResponse(3))),
    http.patch("*/backend-api/notifications/read-all", () => HttpResponse.json({ updatedCount: 5 })),
    http.patch("*/backend-api/notifications/:id/read", ({ params }) =>
      HttpResponse.json(makeNotification({ id: params.id as string, read: true })),
    ),
    http.patch("*/backend-api/notifications/:id/unread", ({ params }) =>
      HttpResponse.json(makeNotification({ id: params.id as string, read: false })),
    ),
  )
})

describe("notificationsAPI contract", () => {
  it("calls the all-notifications path with page and size params by default", async () => {
    const response = await notificationsAPI.getNotifications()

    expect(capturedPath).toBe("/backend-api/notifications")
    expect(capturedQuery?.get("page")).toBe("0")
    expect(capturedQuery?.get("size")).toBe("20")
    expect(capturedQuery?.has("type")).toBe(false)
    expect(response.content).toHaveLength(1)
  })

  it("calls the unread path when unreadOnly is true", async () => {
    await notificationsAPI.getNotifications({ unreadOnly: true })

    expect(capturedPath).toBe("/backend-api/notifications/unread")
  })

  it("sends exactly page and size when type is not provided", async () => {
    await notificationsAPI.getNotifications({ page: 2, size: 10 })

    expect([...(capturedQuery?.keys() ?? [])].sort()).toEqual(["page", "size"])
    expect(capturedQuery?.get("page")).toBe("2")
    expect(capturedQuery?.get("size")).toBe("10")
  })

  it("includes type only when supplied", async () => {
    await notificationsAPI.getNotifications({ type: "VENDOR_WAITING_FOR_UBER_DIRECT" })

    expect(capturedQuery?.get("type")).toBe("VENDOR_WAITING_FOR_UBER_DIRECT")
    expect([...(capturedQuery?.keys() ?? [])].sort()).toEqual(["page", "size", "type"])
  })

  it("fetches the unread count", async () => {
    const response = await notificationsAPI.getUnreadCount()

    expect(response.unreadCount).toBe(3)
  })

  it("marks a notification read via PATCH and URL-encodes the id", async () => {
    let capturedUrl: string | null = null
    server.use(
      http.patch("*/backend-api/notifications/:id/read", ({ request, params }) => {
        capturedUrl = new URL(request.url).pathname
        return HttpResponse.json(makeNotification({ id: params.id as string, read: true }))
      }),
    )

    const response = await notificationsAPI.markRead("notif with space")

    expect(capturedUrl).toBe("/backend-api/notifications/notif%20with%20space/read")
    expect(response.read).toBe(true)
  })

  it("marks a notification unread via PATCH", async () => {
    const response = await notificationsAPI.markUnread("notif-1")

    expect(response.read).toBe(false)
  })

  it("marks all notifications read via PATCH read-all", async () => {
    const response = await notificationsAPI.markAllRead()

    expect(response.updatedCount).toBe(5)
  })

  it("rejects when the backend returns a 500", async () => {
    server.use(http.get("*/backend-api/notifications", () => HttpResponse.json({ message: "Boom" }, { status: 500 })))

    await expect(notificationsAPI.getNotifications()).rejects.toThrow(/500/)
  })
})

describe("notificationsAPI normalization", () => {
  it("normalizes a body that only has isRead into read", async () => {
    server.use(
      http.patch("*/backend-api/notifications/:id/read", ({ params }) =>
        HttpResponse.json({
          id: params.id,
          type: "VENDOR_WAITING_FOR_UBER_DIRECT",
          orderId: null,
          title: "Title",
          message: "Message",
          isRead: true,
          readAt: null,
          createdDate: "2026-09-13T10:00:00Z",
        }),
      ),
    )

    const response = await notificationsAPI.markRead("notif-1")

    expect(response.read).toBe(true)
  })

  it("normalizes a non-array content field to an empty array", async () => {
    server.use(
      http.get("*/backend-api/notifications", () =>
        HttpResponse.json({
          content: null,
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
          unreadCount: 0,
        }),
      ),
    )

    const response = await notificationsAPI.getNotifications()

    expect(response.content).toEqual([])
  })

  it("tolerates a missing unreadCount field and defaults it to 0", async () => {
    server.use(http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json({})))

    const response = await notificationsAPI.getUnreadCount()

    expect(response.unreadCount).toBe(0)
  })
})

describe("notificationsAPI error paths", () => {
  it("flags a 401 as auth-handled", async () => {
    server.use(
      http.get("*/backend-api/notifications", () => HttpResponse.json({ message: "Expired" }, { status: 401 })),
    )

    const error = await notificationsAPI.getNotifications().catch((caught: unknown) => caught)

    expect((error as { authHandled?: boolean }).authHandled).toBe(true)
  })

  it("aborts in flight when the caller's signal fires", async () => {
    const controller = new AbortController()
    const pending = notificationsAPI.getNotifications({}, controller.signal)
    controller.abort()

    const error = await pending.catch((caught: unknown) => caught)

    expect((error as { code?: string }).code).toBe("ERR_CANCELED")
  })
})
