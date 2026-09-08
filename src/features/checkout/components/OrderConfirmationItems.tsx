import OrderConfirmationItemRow from "@/features/checkout/components/OrderConfirmationItemRow"
import type { OrderItem, PlaceOrderResponse } from "@/lib/api/orders"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"

interface OrderConfirmationItemsProps {
  orderResult: PlaceOrderResponse
  /**
   * userProductId → schedule, for the lines the buyer set to repeat. A missing key is a one-off
   * purchase; a `null` value repeats on a schedule this snapshot could not name.
   */
  autoOrderPeriods?: Record<string, AutoOrderPeriod | null>
  /** The schedules are written by a Stripe webhook, so they can still be in flight on this screen. */
  autoOrderPending?: boolean
}

export default function OrderConfirmationItems({
  orderResult,
  autoOrderPeriods,
  autoOrderPending = false,
}: OrderConfirmationItemsProps) {
  // Backend: `OrderMapper.toOrderItemResponse` returns `null` for a null `OrderItem` entity, and
  // that `null` is collected straight into `CreateOrderResponse.orderItems`
  // (`toCreateOrderResponse`: `.stream().map(this::toOrderItemResponse).collect(...)`). A
  // missing/non-array `orderItems` field is guarded the same way the rest of this codebase guards
  // list fields coming back from this backend.
  const orderItems = Array.isArray(orderResult.orderItems)
    ? orderResult.orderItems.filter((item): item is OrderItem => item != null)
    : []

  if (orderItems.length === 0) return null

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Order Items</h3>
        <span className="text-sm text-text-muted">
          {orderItems.length} {orderItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="divide-y divide-border-soft/70 overflow-hidden rounded-2xl border border-border-soft bg-surface">
        {orderItems.map((item, index) => (
          <OrderConfirmationItemRow
            key={`${item.id}-${index}`}
            item={item}
            autoOrderPeriod={
              autoOrderPeriods && item.userProductId in autoOrderPeriods
                ? autoOrderPeriods[item.userProductId]
                : undefined
            }
            autoOrderPending={autoOrderPending}
          />
        ))}
      </div>
    </div>
  )
}
