import type { ApiMock } from "../fixtures/api-mock.fixture"

/**
 * `NotificationResponse` (src/lib/api/notifications.ts) mirrors the backend
 * shape for `GET /api/notifications`, `GET /api/notifications/unread`,
 * `GET /api/notifications/unread/count`, `PATCH /api/notifications/{id}/read`,
 * `PATCH /api/notifications/{id}/unread` and `PATCH /api/notifications/read-all`.
 * Defaults here are all empty/zero so tests that don't care about
 * notifications see nothing pending.
 */

export interface MockNotification {
  id: string
  type: string
  orderId: string | null
  title: string
  message: string
  read: boolean
  readAt: string | null
  createdDate: string
}

export interface MockNotificationsPage {
  content: MockNotification[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  unreadCount: number
}

export function makeMockNotification(overrides: Partial<MockNotification> = {}): MockNotification {
  return {
    id: "notif-1",
    type: "VENDOR_WAITING_FOR_UBER_DIRECT",
    orderId: "order-1",
    title: "Vendor waiting for Uber Direct",
    message: "One of your orders is waiting for an Uber Direct pickup.",
    read: false,
    readAt: null,
    createdDate: "2026-09-13T10:00:00Z",
    ...overrides,
  }
}

export function makeMockNotificationsPage(overrides: Partial<MockNotificationsPage> = {}): MockNotificationsPage {
  return {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    unreadCount: 0,
    ...overrides,
  }
}

export function registerNotificationsMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/backend-api/notifications/unread/count", () => ({ body: { unreadCount: 0 } }))
  apiMock.on("GET", "/backend-api/notifications/unread", () => ({ body: makeMockNotificationsPage() }))
  apiMock.on("GET", "/backend-api/notifications", () => ({ body: makeMockNotificationsPage() }))
  apiMock.on("PATCH", "/backend-api/notifications/read-all", () => ({ body: { updatedCount: 0 } }))
  apiMock.on("PATCH", "/backend-api/notifications/:id/read", ({ params }) => ({
    body: makeMockNotification({ id: params.id, read: true }),
  }))
  apiMock.on("PATCH", "/backend-api/notifications/:id/unread", ({ params }) => ({
    body: makeMockNotification({ id: params.id, read: false }),
  }))
}
