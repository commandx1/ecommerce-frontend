import { queryOptions } from "@tanstack/react-query"
import type { SavedPaymentMethod } from "@/features/buyer-dashboard/payment-methods/paymentMethodsData"
import { paymentMethodsAPI } from "@/lib/api/payment-methods"
import { queryKeys } from "@/lib/query/keys"

/**
 * `GET /cards` (Phase 4 design doc §2.1/K0). Read by the buyer payment-methods page (B2) and by
 * auto-orders readiness (B3) under the same key - a card write from either reader invalidates
 * both. Not wired into either caller yet; this step only adds the shared options object.
 *
 * `staleTime: 0, gcTime: 0, retry: false` (§2.2 fetch policy parity): every mount fetches once,
 * and a failure goes straight to the caller's existing fallback/toast. The `.catch(() => [])`
 * readiness fallback belongs in the DERIVED value at the call site, never in this `queryFn` -
 * putting it here would cache an empty wallet under the key the payment-methods page reads.
 */
export function paymentMethodsCardsOptions(enabled = true) {
  return queryOptions<SavedPaymentMethod[]>({
    queryKey: queryKeys.paymentMethods.cards(),
    queryFn: () => paymentMethodsAPI.getSavedCards(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
