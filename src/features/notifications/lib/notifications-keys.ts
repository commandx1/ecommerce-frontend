export interface NotificationsListKeyParams {
  page: number
  size: number
  unreadOnly: boolean
}

export const notificationsKeys = {
  all: ["notifications"] as const,
  unreadCount: () => [...notificationsKeys.all, "unread-count"] as const,
  list: (params: NotificationsListKeyParams) => [...notificationsKeys.all, "list", params] as const,
}
