"use client"

import { Bell } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuthStore } from "@/stores/authStore"
import { useMarkAllNotificationsRead, useMarkNotificationRead } from "../hooks/useNotificationMutations"
import { useRecentNotifications, useUnreadNotificationCount } from "../hooks/useNotificationQueries"
import { formatUnreadBadge } from "../lib/format-unread-badge"
import { getDashboardRole, getNotificationsPageHref } from "../lib/resolve-notification-href"
import type { NotificationResponse } from "../types"
import NotificationListItem from "./NotificationListItem"

export default function NotificationBell() {
  const role = getDashboardRole(useAuthStore((state) => state.user?.roleName))
  const [open, setOpen] = useState(false)

  const { count } = useUnreadNotificationCount()
  const badge = formatUnreadBadge(count)

  const recent = useRecentNotifications(open)
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const handleNavigate = (notification: NotificationResponse) => {
    if (!notification.read) {
      markRead.mutate(notification.id)
    }
    setOpen(false)
  }

  const items = recent.data?.content ?? []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
          className="relative flex items-center rounded-full border border-border-soft bg-surface px-2.5 py-2 text-sm text-text-secondary shadow-soft transition-colors hover:text-brand"
        >
          <Bell className="h-4 w-4" />
          {badge ? (
            <span className="absolute -top-2 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-strong px-1 text-[10px] font-bold text-accent-foreground">
              {badge}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[calc(100vw-2rem)] max-w-sm p-0">
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
          <p className="text-sm font-semibold text-text-primary">Notifications</p>
          <button
            type="button"
            disabled={count === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
            className="text-xs font-semibold text-brand disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>

        {recent.isPending ? (
          <div className="space-y-3 px-4 py-3">
            <div className="h-10 animate-pulse rounded-md bg-surface-muted" />
            <div className="h-10 animate-pulse rounded-md bg-surface-muted" />
            <div className="h-10 animate-pulse rounded-md bg-surface-muted" />
          </div>
        ) : recent.isError ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-text-secondary">Couldn't load notifications.</p>
            <button type="button" onClick={() => recent.refetch()} className="mt-2 text-sm font-semibold text-brand">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-text-secondary">You're all caught up.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-border-soft overflow-y-auto">
            {items.map((notification) => (
              <NotificationListItem
                key={notification.id}
                variant="compact"
                role={role}
                notification={notification}
                onNavigate={handleNavigate}
              />
            ))}
          </ul>
        )}

        <div className="border-t border-border-soft px-4 py-3 text-center">
          <Link
            href={getNotificationsPageHref(role)}
            onClick={() => setOpen(false)}
            className="text-sm font-semibold text-brand"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
