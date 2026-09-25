import { keepPreviousData, type UseQueryResult, useQuery } from "@tanstack/react-query"
import { notificationsAPI } from "@/lib/api/notifications"
import { useAuthStore } from "@/stores/authStore"
import { notificationsKeys } from "../lib/notifications-keys"
import type { NotificationsPageResponse } from "../types"

const RECENT_NOTIFICATIONS_SIZE = 6

interface UnreadNotificationCountResult {
  count: number
  isPending: boolean
  isError: boolean
  refetch: () => void
}

export function useUnreadNotificationCount(): UnreadNotificationCountResult {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: notificationsKeys.unreadCount(),
    queryFn: ({ signal }) => notificationsAPI.getUnreadCount(signal),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    select: (response) => response.unreadCount,
  })

  return {
    count: data ?? 0,
    isPending,
    isError,
    refetch: () => {
      void refetch()
    },
  }
}

interface NotificationsPageQueryParams {
  page: number
  size?: number
  unreadOnly: boolean
}

export function useNotificationsPage(params: NotificationsPageQueryParams): UseQueryResult<NotificationsPageResponse> {
  const { page, size = 20, unreadOnly } = params
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: notificationsKeys.list({ page, size, unreadOnly }),
    queryFn: ({ signal }) => notificationsAPI.getNotifications({ page, size, unreadOnly }, signal),
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
  })
}

export function useRecentNotifications(enabled: boolean): UseQueryResult<NotificationsPageResponse> {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: notificationsKeys.list({ page: 0, size: RECENT_NOTIFICATIONS_SIZE, unreadOnly: false }),
    queryFn: ({ signal }) =>
      notificationsAPI.getNotifications({ page: 0, size: RECENT_NOTIFICATIONS_SIZE, unreadOnly: false }, signal),
    enabled: isAuthenticated && enabled,
  })
}
