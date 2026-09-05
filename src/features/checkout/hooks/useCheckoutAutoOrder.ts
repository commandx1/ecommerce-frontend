"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { SavedCard } from "@/lib/api/orders"
import { AUTO_ORDER_PERIOD_LABELS, type AutoOrderPeriod } from "@/lib/constants/auto-order"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

export interface AutoOrderLine {
  userProductId: string
  productName: string
  quantity: number
  period: AutoOrderPeriod
  periodLabel: string
}

export interface CheckoutAutoOrderState {
  hasAutoOrderItems: boolean
  autoOrderLines: AutoOrderLine[]
  /** userProductIds with a schedule write in flight, so the row can be disabled while it saves. */
  pendingUserProductIds: Set<string>
  onPeriodChange: (userProductId: string, period: AutoOrderPeriod) => Promise<void>
  onCancelRecurrence: (userProductId: string) => Promise<void>
}

/**
 * The recurring lines the buyer picked in the cart, plus the ability to change or cancel a
 * schedule from Final Review (step 4). Checkout used to only READ these — that stopped being true
 * once the per-line controls landed here, because a write must reach both the live cart (so the
 * next `GET /cart` reflects it) AND the frozen `orderPayload` snapshot `useFinalReview` actually
 * sends (`checkoutStore.setPayloadAutoOrder`) — the snapshot is captured at the shipping step and
 * is never re-derived from the cart before `placeOrder`.
 */
export function useCheckoutAutoOrder(): CheckoutAutoOrderState {
  const items = useCartStore((state) => state.items)
  const setItemAutoOrder = useCartStore((state) => state.setItemAutoOrder)
  const setPayloadAutoOrder = useCheckoutStore((state) => state.setPayloadAutoOrder)

  const [pendingUserProductIds, setPendingUserProductIds] = useState<Set<string>>(new Set())
  // Mirrors `pendingUserProductIds` for a synchronous, always-current membership check inside
  // `applySchedule` — reading the state value there would close over a stale Set and let a
  // second click on the same row slip through before the re-render carrying the first click's
  // pending id ever lands.
  const pendingRef = useRef<Set<string>>(new Set())

  const autoOrderLines = useMemo<AutoOrderLine[]>(() => {
    return items
      .filter((item): item is typeof item & { autoOrder: AutoOrderPeriod } => item.autoOrder !== null)
      .map((item) => ({
        userProductId: item.userProduct.userProductId,
        productName: item.product.name,
        quantity: item.quantity,
        period: item.autoOrder,
        periodLabel: AUTO_ORDER_PERIOD_LABELS[item.autoOrder],
      }))
  }, [items])

  const applySchedule = useCallback(
    async (userProductId: string, value: AutoOrderPeriod | null) => {
      // Ignore a second call for a row whose write is already in flight — the Set carries only
      // pending ids, so a concurrent write on a different row can't clobber this one's entry.
      if (pendingRef.current.has(userProductId)) return

      pendingRef.current.add(userProductId)
      setPendingUserProductIds((prev) => {
        const next = new Set(prev)
        next.add(userProductId)
        return next
      })

      try {
        // The cart write must succeed BEFORE the frozen payload is patched — a failed write must
        // never desync the request `placeOrder` will send from what the server actually has.
        await setItemAutoOrder(userProductId, value)
        setPayloadAutoOrder(userProductId, value)
      } catch {
        showToast.error("Could not update the auto-order schedule. Please try again.")
      } finally {
        pendingRef.current.delete(userProductId)
        setPendingUserProductIds((prev) => {
          const next = new Set(prev)
          next.delete(userProductId)
          return next
        })
      }
    },
    [setItemAutoOrder, setPayloadAutoOrder],
  )

  const onPeriodChange = useCallback(
    (userProductId: string, period: AutoOrderPeriod) => applySchedule(userProductId, period),
    [applySchedule],
  )

  const onCancelRecurrence = useCallback((userProductId: string) => applySchedule(userProductId, null), [applySchedule])

  return {
    hasAutoOrderItems: autoOrderLines.length > 0,
    autoOrderLines,
    pendingUserProductIds,
    onPeriodChange,
    onCancelRecurrence,
  }
}

/**
 * A saved card that already carries an off-session mandate needs no extra
 * consent; one that does not can only cover auto orders when the buyer
 * explicitly allows future automatic charges (`openToAutoOrder`).
 */
export function savedCardNeedsAutoOrderConsent(card: SavedCard | undefined): boolean {
  if (!card) return false
  return !card.openToAutoPayment
}
