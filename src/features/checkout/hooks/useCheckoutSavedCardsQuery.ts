"use client"

import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { ordersAPI, type SavedCard } from "@/lib/api/orders"
import { queryKeys } from "@/lib/query/keys"

function isNoActiveCardsError(error: unknown): boolean {
  const maybeError = error as { response?: { data?: { message?: string } } } | null
  return maybeError?.response?.data?.message?.includes("No active cards") ?? false
}

async function fetchCheckoutSavedCards(): Promise<SavedCard[]> {
  try {
    const response = await ordersAPI.getSavedCards()
    // Array.isArray, not `|| []`: a malformed 200 with a non-array `cards` would reach
    // .map() in the saved-card picker and blank the payment step (infra note #26).
    return Array.isArray(response.cards) ? response.cards : []
  } catch (error: unknown) {
    // The backend answers a buyer with no cards with an error instead of an empty list.
    if (isNoActiveCardsError(error)) {
      return []
    }
    throw error
  }
}

/**
 * `GET /orders/saved-cards` as a query (Phase 2 design doc §6), resolving to the card list itself.
 *
 * `staleTime: 0, gcTime: 0`: cards are still added/removed through the unmigrated buyer settings
 * pages, so a cached list could hide a change made there; `gcTime: 0` reproduces today's
 * per-mount fetch. `retry: false` mirrors the old bare `.catch` (one request, immediate
 * "Failed to load saved cards." on any failure).
 */
export function useCheckoutSavedCardsQuery(): UseQueryResult<SavedCard[]> {
  return useQuery({
    queryKey: queryKeys.paymentMethods.checkoutSavedCards(),
    queryFn: fetchCheckoutSavedCards,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
