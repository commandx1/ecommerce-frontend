"use client"

import { useCallback, useEffect, useState } from "react"
import { extractApiErrorMessage } from "@/app/buyer-dashboard/orders/lib/order-view-utils"
import { showToast } from "@/components/ui/Toast"
import { addressAPI } from "@/lib/api/address"
import { type AutoOrder, autoOrdersAPI, type UpdateAutoOrderPayload } from "@/lib/api/auto-orders"
import { paymentMethodsAPI } from "@/lib/api/payment-methods"

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

export function useAutoOrders(): UseAutoOrdersResult {
  const [autoOrders, setAutoOrders] = useState<AutoOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<AutoOrderReadiness>({
    isLoading: true,
    hasPrimaryAddress: false,
    hasAutoOrderCard: false,
    isReady: false,
  })

  const fetchAutoOrders = useCallback(async (signal?: AbortSignal) => {
    const response = await autoOrdersAPI.getAutoOrders(signal)
    setAutoOrders(response.autoOrders ?? [])
  }, [])

  const fetchReadiness = useCallback(async () => {
    setReadiness((current) => ({ ...current, isLoading: true }))
    const [addresses, cards] = await Promise.all([
      addressAPI.getAddresses().catch(() => []),
      paymentMethodsAPI.getSavedCards().catch(() => []),
    ])

    const hasPrimaryAddress = addresses.some((address) => address.defaultAddress)
    const hasAutoOrderCard = cards.some((card) => card.autoOrderCard && card.openToAutoPayment)

    setReadiness({
      isLoading: false,
      hasPrimaryAddress,
      hasAutoOrderCard,
      isReady: hasPrimaryAddress && hasAutoOrderCard,
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchAutoOrders(controller.signal)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        showToast.error("Failed to load auto orders", extractApiErrorMessage(error) ?? "Please try again.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    void fetchReadiness()

    return () => controller.abort()
  }, [fetchAutoOrders, fetchReadiness])

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchAutoOrders().catch((error: unknown) => {
        showToast.error("Failed to load auto orders", extractApiErrorMessage(error) ?? "Please try again.")
      }),
      fetchReadiness(),
    ])
  }, [fetchAutoOrders, fetchReadiness])

  const updateAutoOrder = useCallback(
    async (autoOrderId: string, payload: UpdateAutoOrderPayload) => {
      setPendingId(autoOrderId)
      try {
        const updated = await autoOrdersAPI.updateAutoOrder(autoOrderId, payload)
        setAutoOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        return true
      } catch (error: unknown) {
        // Activation is rejected with a 400 that explains exactly what's missing
        showToast.error("Could not update auto order", extractApiErrorMessage(error) ?? "Please try again.")
        void fetchReadiness()
        return false
      } finally {
        setPendingId(null)
      }
    },
    [fetchReadiness],
  )

  const deleteAutoOrder = useCallback(async (autoOrderId: string) => {
    setPendingId(autoOrderId)
    try {
      await autoOrdersAPI.deleteAutoOrder(autoOrderId)
      setAutoOrders((current) => current.filter((item) => item.id !== autoOrderId))
      return true
    } catch (error: unknown) {
      showToast.error("Could not remove auto order", extractApiErrorMessage(error) ?? "Please try again.")
      return false
    } finally {
      setPendingId(null)
    }
  }, [])

  return { autoOrders, isLoading, readiness, pendingId, refresh, updateAutoOrder, deleteAutoOrder }
}
