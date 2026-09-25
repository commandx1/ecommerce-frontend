"use client"

import { useQuery } from "@tanstack/react-query"
import { showToast } from "@/components/ui/Toast"
import { paymentMethodsCardsOptions } from "@/lib/query/options/payment-methods"
import { useQueryErrorToast } from "@/lib/query/useQueryErrorToast"
import { addModalDefaults, selectAutoOrderMethod, selectDefault } from "../lib/payment-methods"
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

/** Composes the list query with the mutation and add-card-flow hooks. */
export function usePaymentMethodsPage(): UsePaymentMethodsPageResult {
  const cardsQuery = useQuery(paymentMethodsCardsOptions())
  useQueryErrorToast(cardsQuery, () => showToast.error("Failed to load", "Could not fetch payment methods."))

  const methods = cardsQuery.data ?? []
  const isLoading = cardsQuery.isPending

  const defaultMethod = selectDefault(methods)
  const autoOrderMethod = selectAutoOrderMethod(methods)

  const mutations = usePaymentMethodMutations(methods.length)
  const addCardFlow = useAddCardFlow(addModalDefaults(methods))
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
