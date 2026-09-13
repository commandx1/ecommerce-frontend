import apiClient from "./client"

export type NotificationType = "VENDOR_WAITING_FOR_UBER_DIRECT" | (string & {})

export interface NotificationResponse {
  id: string
  type: NotificationType
  orderId: string | null
  title: string
  message: string
  read: boolean
  readAt: string | null
  createdDate: string
}

export interface NotificationsPageResponse {
  content: NotificationResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  unreadCount: number
}

export interface UnreadNotificationCountResponse {
  unreadCount: number
}

export interface MarkAllNotificationsReadResponse {
  updatedCount: number
}

export interface NotificationPushPayload {
  notificationId: string
  type: NotificationType
  orderId: string | null
  title: string
  message: string
  createdDate: string
  vendorUserId?: string
  waitingForUberDirectOrderCount?: number
}

export interface GetNotificationsParams {
  page?: number
  size?: number
  unreadOnly?: boolean
  type?: NotificationType
}

/**
 * The backend's own doc says the boolean field is `isRead`, but the Jackson wire payload
 * actually serialises it as `read` (verified against NotificationResponse). Normalize
 * defensively so either shape works: prefer `read`, fall back to `isRead`.
 */
export function normalizeNotification(raw: unknown): NotificationResponse {
  const source = (raw ?? {}) as Record<string, unknown>

  return {
    id: typeof source.id === "string" ? source.id : "",
    type: typeof source.type === "string" ? (source.type as NotificationType) : "",
    orderId: typeof source.orderId === "string" ? source.orderId : null,
    title: typeof source.title === "string" ? source.title : "",
    message: typeof source.message === "string" ? source.message : "",
    read: typeof source.read === "boolean" ? source.read : Boolean(source.isRead),
    readAt: typeof source.readAt === "string" ? source.readAt : null,
    createdDate: typeof source.createdDate === "string" ? source.createdDate : "",
  }
}

export function normalizeNotificationsPage(raw: unknown): NotificationsPageResponse {
  const source = (raw ?? {}) as Record<string, unknown>
  const content = Array.isArray(source.content) ? source.content : []

  return {
    content: content.map((item) => normalizeNotification(item)),
    page: typeof source.page === "number" ? source.page : 0,
    size: typeof source.size === "number" ? source.size : 0,
    totalElements: typeof source.totalElements === "number" ? source.totalElements : 0,
    totalPages: typeof source.totalPages === "number" ? source.totalPages : 0,
    unreadCount: typeof source.unreadCount === "number" ? source.unreadCount : 0,
  }
}

class NotificationsAPI {
  async getNotifications(
    { page = 0, size = 20, unreadOnly = false, type }: GetNotificationsParams = {},
    signal?: AbortSignal,
  ): Promise<NotificationsPageResponse> {
    const path = unreadOnly ? "/notifications/unread" : "/notifications"
    const response = await apiClient.get(path, {
      params: {
        page,
        size,
        ...(type ? { type } : {}),
      },
      signal,
    })
    return normalizeNotificationsPage(response.data)
  }

  async getUnreadCount(signal?: AbortSignal): Promise<UnreadNotificationCountResponse> {
    const response = await apiClient.get("/notifications/unread/count", { signal })
    const data = (response.data ?? {}) as Record<string, unknown>
    return {
      unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 0,
    }
  }

  async markRead(id: string): Promise<NotificationResponse> {
    const response = await apiClient.patch(`/notifications/${encodeURIComponent(id)}/read`)
    return normalizeNotification(response.data)
  }

  async markUnread(id: string): Promise<NotificationResponse> {
    const response = await apiClient.patch(`/notifications/${encodeURIComponent(id)}/unread`)
    return normalizeNotification(response.data)
  }

  async markAllRead(): Promise<MarkAllNotificationsReadResponse> {
    const response = await apiClient.patch("/notifications/read-all")
    const data = (response.data ?? {}) as Record<string, unknown>
    return {
      updatedCount: typeof data.updatedCount === "number" ? data.updatedCount : 0,
    }
  }
}

export const notificationsAPI = new NotificationsAPI()
