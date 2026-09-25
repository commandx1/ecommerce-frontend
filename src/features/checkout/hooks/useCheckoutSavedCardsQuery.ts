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
    // Array.isArray: a malformed 200 with a non-array `cards` would blank the payment step.
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
 * `GET /orders/saved-cards`, resolving to the card list. Not cached (cards change on the buyer
 * settings pages) and not retried: one request, then "Failed to load saved cards.".
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
