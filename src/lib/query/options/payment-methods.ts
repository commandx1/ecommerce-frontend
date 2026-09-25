import { queryOptions } from "@tanstack/react-query"
import type { SavedPaymentMethod } from "@/features/buyer-dashboard/payment-methods/paymentMethodsData"
import { paymentMethodsAPI } from "@/lib/api/payment-methods"
import { queryKeys } from "@/lib/query/keys"
import { FETCH_ONCE_PER_MOUNT } from "@/lib/query/query-client"

/**
 * `GET /cards`, shared by the payment-methods page and auto-orders readiness, so a card write from
 * either invalidates both. A readiness `[]` fallback belongs in the derived value at the call site,
 * never in this `queryFn` - it would cache an empty wallet under the key the page reads.
 */
export function paymentMethodsCardsOptions(enabled = true) {
  return queryOptions<SavedPaymentMethod[]>({
    queryKey: queryKeys.paymentMethods.cards(),
    queryFn: () => paymentMethodsAPI.getSavedCards(),
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
  })
}
