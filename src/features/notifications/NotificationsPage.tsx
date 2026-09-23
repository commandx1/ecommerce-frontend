"use client"

import { useEffect, useState } from "react"
import DashboardPagination from "@/components/dashboard-shared/DashboardPagination"
import EmptyStateCard from "@/components/feedback/EmptyStateCard"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { showToast } from "@/components/ui/Toast"
import { useAuthStore } from "@/stores/authStore"
import NotificationListItem from "./components/NotificationListItem"
import NotificationsListSkeleton from "./components/NotificationsListSkeleton"
import NotificationsTabs from "./components/NotificationsTabs"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationUnread,
} from "./hooks/useNotificationMutations"
import { useNotificationsPage, useUnreadNotificationCount } from "./hooks/useNotificationQueries"
import { getDashboardRole } from "./lib/resolve-notification-href"
import type { NotificationResponse, NotificationsTab } from "./types"

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotificationsTab>("all")
  const [page, setPage] = useState(0)

  const role = getDashboardRole(useAuthStore((state) => state.user?.roleName))

  const query = useNotificationsPage({ page, size: PAGE_SIZE, unreadOnly: tab === "unread" })
  const { count: unreadCount } = useUnreadNotificationCount()

  const markRead = useMarkNotificationRead()
  const markUnread = useMarkNotificationUnread()
  const markAll = useMarkAllNotificationsRead()

  useEffect(() => {
    if (query.isError) {
      showToast.error("Failed to load notifications", "Please refresh the page.")
    }
  }, [query.isError])

  const handleTabChange = (nextTab: NotificationsTab) => {
    setTab(nextTab)
    setPage(0)
  }

  const handleToggleRead = (notification: NotificationResponse) => {
    if (notification.read) {
      markUnread.mutate(notification.id)
    } else {
      markRead.mutate(notification.id)
    }
  }

  const isToggling = (notification: NotificationResponse) =>
    (markRead.isPending && markRead.variables === notification.id) ||
    (markUnread.isPending && markUnread.variables === notification.id)

  const data = query.data
  const content = data?.content ?? []

  return (
    <div data-testid="notifications-page">
      <SectionHeading
        titleAs="h1"
        variant="technical"
        title="Notifications"
        description="Updates about your orders and account."
        actions={
          <button
            type="button"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
            className="glass-panel flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-brand/35 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all as read
          </button>
        }
        className="mb-8"
      />

      <SurfaceCard as="section" variant="glass" className="overflow-hidden">
        <div className="border-b border-border-soft px-6 py-4">
          <NotificationsTabs value={tab} onChange={handleTabChange} unreadCount={unreadCount} />
        </div>

        {query.isPending && !query.data ? (
          <NotificationsListSkeleton />
        ) : content.length === 0 ? (
          <div className="p-6">
            <EmptyStateCard
              title={tab === "unread" ? "No unread notifications" : "No notifications yet"}
              description={
                tab === "unread" ? "You're all caught up." : "We'll let you know when something needs your attention."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border-soft">
            {content.map((notification) => (
              <NotificationListItem
                key={notification.id}
                variant="full"
                role={role}
                notification={notification}
                onToggleRead={handleToggleRead}
                isToggling={isToggling(notification)}
              />
            ))}
          </ul>
        )}

        {data ? (
          <div className="border-t border-border-soft px-6 py-4">
            <DashboardPagination
              currentPage={page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </SurfaceCard>
    </div>
  )
}
