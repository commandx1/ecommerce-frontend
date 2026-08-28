import NotificationCard from "@/components/feedback/NotificationCard"
import type { ExcludedSellerLines } from "@/stores/checkoutStore"

interface FinalReviewExcludedNoticeProps {
  excludedFromOrder: ExcludedSellerLines[]
}

/**
 * Names the cart lines that will not make it into this order because no shipping rate could be
 * selected for their seller.
 *
 * This is not cosmetic: the backend builds the order only from the products carried inside the
 * rate orders (OrderCreationService:163-173), and on payment success it soft-deletes the whole
 * cart rather than just the ordered lines (CartService.processCartAfterPaymentSuccess:189-204).
 * Without this notice those items are ordered by nobody and still disappear from the cart.
 */
export default function FinalReviewExcludedNotice({ excludedFromOrder }: FinalReviewExcludedNoticeProps) {
  if (excludedFromOrder.length === 0) {
    return null
  }

  return (
    <NotificationCard
      tone="warning"
      title="Some items can't be shipped and won't be ordered"
      description="We couldn't get a shipping rate for these sellers. Placing the order now leaves them out, and they will also be cleared from your cart. Go back and try their shipping options again if you still want them."
      className="mb-6"
    >
      <ul className="mt-2 space-y-1 text-sm text-text-secondary">
        {excludedFromOrder.map((seller) => (
          <li key={seller.sellerName}>
            <span className="font-semibold text-text-primary">{seller.sellerName}</span>
            {seller.itemNames.length > 0 ? <span>: {seller.itemNames.join(", ")}</span> : null}
          </li>
        ))}
      </ul>
    </NotificationCard>
  )
}
