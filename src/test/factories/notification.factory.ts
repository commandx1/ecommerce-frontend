import type {
  NotificationPushPayload,
  NotificationResponse,
  NotificationsPageResponse,
  UnreadNotificationCountResponse,
} from "@/lib/api/notifications"

export function makeNotification(overrides: Partial<NotificationResponse> = {}): NotificationResponse {
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

export function makeNotificationsPage(
  overrides: Partial<NotificationsPageResponse> = {},
  items?: NotificationResponse[],
): NotificationsPageResponse {
  const content = items ?? overrides.content ?? [makeNotification()]
  return {
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    unreadCount: content.filter((item) => !item.read).length,
    ...overrides,
    content,
  }
}

export function makeUnreadCountResponse(count = 0): UnreadNotificationCountResponse {
  return { unreadCount: count }
}

export function makeNotificationPushPayload(overrides: Partial<NotificationPushPayload> = {}): NotificationPushPayload {
  return {
    notificationId: "notif-1",
    type: "VENDOR_WAITING_FOR_UBER_DIRECT",
    orderId: "order-1",
    title: "Vendor waiting for Uber Direct",
    message: "One of your orders is waiting for an Uber Direct pickup.",
    createdDate: "2026-09-13T10:00:00Z",
    ...overrides,
  }
}
