import { HttpResponse, http } from "msw"
import { makeNotification, makeNotificationsPage, makeUnreadCountResponse } from "@/test/factories/notification.factory"

export const notificationsHandlers = [
  http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json(makeUnreadCountResponse(0))),

  http.get("*/backend-api/notifications/unread", () =>
    HttpResponse.json(makeNotificationsPage({ content: [], totalElements: 0, totalPages: 0, unreadCount: 0 }, [])),
  ),

  http.get("*/backend-api/notifications", () =>
    HttpResponse.json(makeNotificationsPage({ content: [], totalElements: 0, totalPages: 0, unreadCount: 0 }, [])),
  ),

  http.patch("*/backend-api/notifications/read-all", () => HttpResponse.json({ updatedCount: 0 })),

  http.patch("*/backend-api/notifications/:id/read", ({ params }) =>
    HttpResponse.json(makeNotification({ id: params.id as string, read: true })),
  ),

  http.patch("*/backend-api/notifications/:id/unread", ({ params }) =>
    HttpResponse.json(makeNotification({ id: params.id as string, read: false })),
  ),
]
