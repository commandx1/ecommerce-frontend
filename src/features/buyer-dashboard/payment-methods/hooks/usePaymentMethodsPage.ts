"use client"

import { useQuery } from "@tanstack/react-query"
import { showToast } from "@/components/ui/Toast"
import { paymentMethodsCardsOptions } from "@/lib/query/options/payment-methods"
import { useQueryErrorToast } from "@/lib/query/useQueryErrorToast"
import type { SavedPaymentMethod } from "../paymentMethodsData"
import { type UseAddCardFlowResult, useAddCardFlow } from "./useAddCardFlow"
import { useCardElementOptions } from "./useCardElementOptions"
import { type UsePaymentMethodMutationsResult, usePaymentMethodMutations } from "./usePaymentMethodMutations"

export interface UsePaymentMethodsPageResult extends UsePaymentMethodMutationsResult {
  methods: SavedPaymentMethod[]
  sortedMethods: SavedPaymentMethod[]
  isLoading: boolean
  defaultMethod: SavedPaymentMethod | null
  autoOrderMethod: SavedPaymentMethod | null
  cardElementOptions: ReturnType<typeof useCardElementOptions>
  addCardFlow: UseAddCardFlowResult
}

/**
 * Composes the list query with the mutation and add-card-flow hooks (Phase 4 §7, B2b). Keeps
 * `BuyerPaymentMethodsPage`'s pre-migration return contract (same field names) so the JSX in that
 * file - split further in B2c - does not have to change shape in this step.
 */
export function usePaymentMethodsPage(): UsePaymentMethodsPageResult {
  const cardsQuery = useQuery(paymentMethodsCardsOptions())
  useQueryErrorToast(cardsQuery, () => showToast.error("Failed to load", "Could not fetch payment methods."))

  const methods = cardsQuery.data ?? []
  const isLoading = cardsQuery.isPending

  const defaultMethod = methods.find((method) => method.status === "default") ?? null
  const autoOrderMethod = methods.find((method) => method.autoOrderCard) ?? null

  const mutations = usePaymentMethodMutations(methods.length)
  const addCardFlow = useAddCardFlow({ hasCards: methods.length > 0, hasAutoOrderCard: Boolean(autoOrderMethod) })
  const cardElementOptions = useCardElementOptions()

  const sortedMethods = [...methods].sort((a, b) => {
    if (a.status === "default") return -1
    if (b.status === "default") return 1
    return a.nickname.localeCompare(b.nickname)
  })

  return {
    methods,
    sortedMethods,
    isLoading,
    defaultMethod,
    autoOrderMethod,
    cardElementOptions,
    addCardFlow,
    ...mutations,
  }
}
