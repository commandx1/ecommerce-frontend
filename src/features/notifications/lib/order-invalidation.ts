import type { NotificationType } from "@/lib/api/notifications"
import { queryKeys } from "@/lib/query/keys"
import type { DashboardRole } from "../types"

/**
 * Mirrors `NotificationType` in the backend (`notification/enums/NotificationType.java`): every
 * value that exists there today is order-related, but this stays an explicit allowlist rather
 * than "anything not obviously else" so a type added on either side doesn't silently start (or
 * stop) refreshing order data - `isOrderRelatedPush` also treats a valid `orderId` as sufficient,
 * so an unrecognized future type still refreshes correctly as long as it carries one.
 */
const ORDER_NOTIFICATION_TYPES = new Set<string>([
  "VENDOR_WAITING_FOR_UBER_DIRECT",
  "VENDOR_ORDER_ITEM_CANCELLED",
  "VENDOR_RETURN_CREATED",
  "VENDOR_RETURN_DELIVERED",
  "CUSTOMER_ORDER_ITEM_CANCELLED_BY_SELLER",
  "CUSTOMER_RETURN_ACCEPTED",
  "CUSTOMER_RETURN_REJECTED",
  "CUSTOMER_ORDER_SHIPPED",
  "CUSTOMER_ORDER_DELIVERED",
])

export function isOrderNotificationType(type: NotificationType): boolean {
  return ORDER_NOTIFICATION_TYPES.has(type)
}

/** A push is order-related when its type is a known order type, or it carries a resolvable order id. */
export function isOrderRelatedPush(params: { type: NotificationType; orderId: string | null }): boolean {
  return isOrderNotificationType(params.type) || Boolean(params.orderId)
}

/**
 * Query key roots to invalidate, per dashboard role, when an order-related push arrives - list
 * pages, single-order queries and (for vendor) the overview widgets derived from orders all key
 * off these prefixes via `@/lib/query/keys`, the shared factory both dashboards already read
 * from. Kept here rather than imported per-caller so the "which keys for which role" mapping has
 * exactly one place to change.
 */
export function getOrderInvalidationKeys(role: DashboardRole): ReadonlyArray<readonly unknown[]> {
  if (role === "vendor") {
    return [queryKeys.vendor.orders.all, queryKeys.vendor.overview.all]
  }
  return [queryKeys.orders.all]
}
