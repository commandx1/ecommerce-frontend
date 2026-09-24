"use client"

import { Bell } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { GlassMorphMenu } from "@/components/ui/glass-morph-menu"
import { Skeleton } from "@/components/ui/skeleton"
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
    <GlassMorphMenu
      open={open}
      onOpenChange={setOpen}
      align="end"
      triggerLabel={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      triggerClassName="w-10 justify-center text-text-secondary transition-colors hover:text-brand"
      panelClassName="w-[calc(100vw-2rem)] max-w-sm"
      trigger={() => (
        <>
          <Bell className="h-4 w-4" />
          {badge ? (
            <span className="absolute -top-2 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-strong px-1 text-[10px] font-bold text-neutral-900">
              {badge}
            </span>
          ) : null}
        </>
      )}
    >
      {(close) => (
        <>
          <div data-menu-head className="flex items-center justify-between border-b border-border-soft px-4 py-3">
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
            <div data-menu-item className="space-y-3 px-4 py-3" aria-busy="true">
              <span className="sr-only">Loading notifications…</span>
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </div>
          ) : recent.isError ? (
            <div data-menu-item className="px-4 py-6 text-center">
              <p className="text-sm text-text-secondary">Couldn't load notifications.</p>
              <button type="button" onClick={() => recent.refetch()} className="mt-2 text-sm font-semibold text-brand">
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <p data-menu-item className="px-4 py-6 text-center text-sm text-text-secondary">
              You're all caught up.
            </p>
          ) : (
            <ul data-menu-item className="max-h-96 divide-y divide-border-soft overflow-y-auto">
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

          <div data-menu-item className="border-t border-border-soft px-4 py-3 text-center">
            <Link href={getNotificationsPageHref(role)} onClick={close} className="text-sm font-semibold text-brand">
              View all notifications
            </Link>
          </div>
        </>
      )}
    </GlassMorphMenu>
  )
}
