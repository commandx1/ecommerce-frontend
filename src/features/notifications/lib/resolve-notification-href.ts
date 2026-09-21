import type { NotificationResponse } from "@/lib/api/notifications"
import { parseOrderIdParam } from "@/lib/api/orders"
import type { DashboardRole } from "../types"

export function getDashboardRole(roleName?: string | null): DashboardRole {
  return roleName === "Vendor" ? "vendor" : "buyer"
}

export function getNotificationsPageHref(role: DashboardRole): string {
  return `/${role}-dashboard/notifications`
}

export function resolveNotificationHref(
  notification: Pick<NotificationResponse, "type" | "orderId">,
  role: DashboardRole,
): string {
  const orderId = parseOrderIdParam(notification.orderId)
  if (orderId) {
    return `/${role}-dashboard/orders?orderId=${encodeURIComponent(orderId)}`
  }

  if (notification.type === "VENDOR_WAITING_FOR_UBER_DIRECT" && role === "vendor") {
    return "/vendor-dashboard/orders"
  }

  return getNotificationsPageHref(role)
}
