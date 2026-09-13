import { Mail, MailOpen } from "lucide-react"
import Link from "next/link"
import { formatRelativeDate } from "@/features/products/product-detail/utils/relativeDate"
import type { NotificationResponse } from "@/lib/api/notifications"
import { resolveNotificationHref } from "../lib/resolve-notification-href"
import type { DashboardRole } from "../types"

export interface NotificationListItemProps {
  notification: NotificationResponse
  role: DashboardRole
  variant: "compact" | "full"
  onNavigate?: (notification: NotificationResponse) => void
  onToggleRead?: (notification: NotificationResponse) => void
  isToggling?: boolean
}

export default function NotificationListItem({
  notification,
  role,
  variant,
  onNavigate,
  onToggleRead,
  isToggling = false,
}: NotificationListItemProps) {
  const unread = !notification.read
  const href = resolveNotificationHref(notification, role)

  return (
    <li
      data-testid="notification-item"
      data-unread={String(unread)}
      className={`relative flex items-start gap-3 px-4 py-3 ${unread ? "bg-brand/5" : ""}`}
    >
      {unread ? (
        <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
      ) : (
        <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-transparent" />
      )}
      <Link href={href} onClick={() => onNavigate?.(notification)} className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${unread ? "font-semibold text-text-primary" : "font-medium text-text-primary"}`}
        >
          {variant === "compact" && unread ? <span className="sr-only">Unread: </span> : null}
          {notification.title}
        </p>
        <p
          className={
            variant === "compact"
              ? "line-clamp-1 text-xs text-text-secondary"
              : "line-clamp-2 text-sm text-text-secondary"
          }
        >
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-text-muted">{formatRelativeDate(notification.createdDate)}</p>
      </Link>
      {variant === "full" && onToggleRead ? (
        <button
          type="button"
          aria-label={notification.read ? "Mark as unread" : "Mark as read"}
          disabled={isToggling}
          onClick={() => onToggleRead(notification)}
          className="shrink-0 rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand disabled:opacity-50"
        >
          {notification.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
        </button>
      ) : null}
    </li>
  )
}
