import type { NotificationPushPayload } from "@/lib/api/notifications"

export function isNotificationPushPayload(value: unknown): value is NotificationPushPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const source = value as Record<string, unknown>

  return (
    typeof source.notificationId === "string" && typeof source.title === "string" && typeof source.message === "string"
  )
}
