import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { showToast } from "@/components/ui/Toast"
import { extractApiErrorMessage } from "@/lib/api/api-error-message"
import type { MarkAllNotificationsReadResponse, NotificationResponse } from "@/lib/api/notifications"
import { notificationsAPI } from "@/lib/api/notifications"
import { notificationsKeys } from "../lib/notifications-keys"

function reportNotificationMutationError(error: unknown): void {
  showToast.error("Could not update notification", extractApiErrorMessage(error) ?? "Please try again.")
}

export function useMarkNotificationRead(): UseMutationResult<NotificationResponse, unknown, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
    onError: reportNotificationMutationError,
  })
}

export function useMarkNotificationUnread(): UseMutationResult<NotificationResponse, unknown, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsAPI.markUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
    onError: reportNotificationMutationError,
  })
}

export function useMarkAllNotificationsRead(): UseMutationResult<MarkAllNotificationsReadResponse, unknown, void> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
    onError: reportNotificationMutationError,
  })
}
