"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { extractApiErrorMessage } from "@/lib/api/api-error-message"
import type { AutoOrder, UpdateAutoOrderPayload } from "@/lib/api/auto-orders"
import { queryKeys } from "@/lib/query/keys"
import { addressesListOptions } from "@/lib/query/options/addresses"
import { paymentMethodsCardsOptions } from "@/lib/query/options/payment-methods"
import { useQueryErrorToast } from "@/lib/query/useQueryErrorToast"
import { autoOrdersCommands, autoOrdersListOptions } from "../api/auto-orders-queries"

export type AutoOrderFilter = "all" | "active" | "paused"

/**
 * Mirrors the backend's `validateBuyerCanRunAutoOrders`: the scheduler needs a
 * primary address and a card that is both the auto order card and open to
 * automatic payments, or activating an auto order is rejected with a 400.
 */
export interface AutoOrderReadiness {
  isLoading: boolean
  hasPrimaryAddress: boolean
  hasAutoOrderCard: boolean
  isReady: boolean
}

interface UseAutoOrdersResult {
  autoOrders: AutoOrder[]
  isLoading: boolean
  readiness: AutoOrderReadiness
  pendingId: string | null
  refresh: () => Promise<void>
  updateAutoOrder: (autoOrderId: string, payload: UpdateAutoOrderPayload) => Promise<boolean>
  deleteAutoOrder: (autoOrderId: string) => Promise<boolean>
}

/**
 * Query-backed (Phase 4 §7, B3). Return contract is unchanged from the pre-migration hook so
 * `BuyerAutoOrdersPage` and its components don't change shape. The `.catch(() => [])` readiness
 * fallback that used to live in `fetchReadiness()` now lives in the derivation (`data ?? []`)
 * instead of the queryFn (§2.2) - a failed read must never write an empty wallet/address list
 * into the cache the payment-methods page and checkout also read.
 */
export function useAutoOrders(): UseAutoOrdersResult {
  const queryClient = useQueryClient()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const autoOrdersQuery = useQuery(autoOrdersListOptions())
  useQueryErrorToast(autoOrdersQuery, () =>
    showToast.error("Failed to load auto orders", extractApiErrorMessage(autoOrdersQuery.error) ?? "Please try again."),
  )

  const addressesQuery = useQuery(addressesListOptions())
  const cardsQuery = useQuery(paymentMethodsCardsOptions())

  const autoOrders = autoOrdersQuery.data ?? []
  const isLoading = autoOrdersQuery.isPending

  const addresses = addressesQuery.data ?? []
  const cards = cardsQuery.data ?? []
  const hasPrimaryAddress = addresses.some((address) => address.defaultAddress)
  const hasAutoOrderCard = cards.some((card) => card.autoOrderCard && card.openToAutoPayment)
  const readiness: AutoOrderReadiness = {
    isLoading: addressesQuery.isPending || cardsQuery.isPending,
    hasPrimaryAddress,
    hasAutoOrderCard,
    isReady: hasPrimaryAddress && hasAutoOrderCard,
  }

  const updateAutoOrder = useCallback(async (autoOrderId: string, payload: UpdateAutoOrderPayload) => {
    setPendingId(autoOrderId)
    try {
      await autoOrdersCommands.updateAutoOrder(autoOrderId, payload)
      return true
    } catch (error: unknown) {
      // Activation is rejected with a 400 that explains exactly what's missing
      showToast.error("Could not update auto order", extractApiErrorMessage(error) ?? "Please try again.")
      return false
    } finally {
      setPendingId(null)
    }
  }, [])

  const deleteAutoOrder = useCallback(async (autoOrderId: string) => {
    setPendingId(autoOrderId)
    try {
      await autoOrdersCommands.deleteAutoOrder(autoOrderId)
      return true
    } catch (error: unknown) {
      showToast.error("Could not remove auto order", extractApiErrorMessage(error) ?? "Please try again.")
      return false
    } finally {
      setPendingId(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: queryKeys.autoOrders.list() }),
      queryClient.refetchQueries({ queryKey: queryKeys.addresses.list() }),
      queryClient.refetchQueries({ queryKey: queryKeys.paymentMethods.cards() }),
    ])
    const autoOrdersState = queryClient.getQueryState(queryKeys.autoOrders.list())
    if (autoOrdersState?.status === "error") {
      showToast.error(
        "Failed to load auto orders",
        extractApiErrorMessage(autoOrdersState.error) ?? "Please try again.",
      )
    }
  }, [queryClient])

  return { autoOrders, isLoading, readiness, pendingId, refresh, updateAutoOrder, deleteAutoOrder }
}
