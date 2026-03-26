"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CartTotals } from "@/features/cart/types"
import type { CartItem } from "@/stores/cartStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

type CartViewState = "loading" | "empty" | "ready"
const QUANTITY_DEBOUNCE_MS = 450

interface UseCartPageResult {
  cartId: string | null
  isClearConfirmOpen: boolean
  items: CartItem[]
  totals: CartTotals
  viewState: CartViewState
  onCheckout: () => void
  onCloseClearConfirm: () => void
  onConfirmClearCart: () => Promise<void>
  onContinueShopping: () => void
  onOpenClearConfirm: () => void
  onQuantityChange: (userProductId: string, currentQuantity: number, delta: number) => void
  onRemoveItem: (userProductId: string) => void
}

export function useCartPage(): UseCartPageResult {
  const router = useRouter()
  const { cartId, items, fetchCart, isLoading, clearCart, updateQuantity, removeFromCart } = useCartStore()
  const { selectedShippingCost, setStep } = useCheckoutStore()
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({})
  const quantityTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const quantityRequestVersionRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    return () => {
      for (const timeoutId of quantityTimersRef.current.values()) {
        clearTimeout(timeoutId)
      }
      quantityTimersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    void fetchCart()
  }, [fetchCart])

  const itemsWithPendingQuantity = useMemo<CartItem[]>(() => {
    return items.map((item) => {
      const pendingQuantity = pendingQuantities[item.userProduct.userProductId]
      if (pendingQuantity === undefined) {
        return item
      }

      return {
        ...item,
        quantity: pendingQuantity,
      }
    })
  }, [items, pendingQuantities])

  const totals = useMemo<CartTotals>(() => {
    const subtotal = itemsWithPendingQuantity.reduce((sum, item) => sum + item.userProduct.price * item.quantity, 0)
    const shipping = selectedShippingCost

    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
    }
  }, [itemsWithPendingQuantity, selectedShippingCost])

  const viewState: CartViewState = useMemo(() => {
    if (isLoading && itemsWithPendingQuantity.length === 0) {
      return "loading"
    }

    if (itemsWithPendingQuantity.length === 0) {
      return "empty"
    }

    return "ready"
  }, [isLoading, itemsWithPendingQuantity.length])

  const onContinueShopping = useCallback(() => {
    router.push("/")
  }, [router])

  const onCheckout = useCallback(() => {
    if (itemsWithPendingQuantity.length === 0) return
    setStep(2)
    router.push("/checkout")
  }, [itemsWithPendingQuantity.length, router, setStep])

  const onQuantityChange = useCallback(
    (userProductId: string, currentQuantity: number, delta: number) => {
      const baseQuantity = pendingQuantities[userProductId] ?? currentQuantity
      const nextQuantity = Math.max(0, baseQuantity + delta)

      setPendingQuantities((prev) => ({
        ...prev,
        [userProductId]: nextQuantity,
      }))

      const existingTimeout = quantityTimersRef.current.get(userProductId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      const requestVersion = (quantityRequestVersionRef.current.get(userProductId) ?? 0) + 1
      quantityRequestVersionRef.current.set(userProductId, requestVersion)

      const timeoutId = setTimeout(() => {
        void (async () => {
          await updateQuantity(userProductId, nextQuantity)

          if (quantityRequestVersionRef.current.get(userProductId) !== requestVersion) {
            return
          }

          quantityTimersRef.current.delete(userProductId)
          setPendingQuantities((prev) => {
            const { [userProductId]: _removed, ...rest } = prev
            return rest
          })
        })()
      }, QUANTITY_DEBOUNCE_MS)

      quantityTimersRef.current.set(userProductId, timeoutId)
    },
    [pendingQuantities, updateQuantity],
  )

  const onRemoveItem = useCallback(
    (userProductId: string) => {
      const existingTimeout = quantityTimersRef.current.get(userProductId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        quantityTimersRef.current.delete(userProductId)
      }

      setPendingQuantities((prev) => {
        const { [userProductId]: _removed, ...rest } = prev
        return rest
      })
      void removeFromCart(userProductId)
    },
    [removeFromCart],
  )

  const onOpenClearConfirm = useCallback(() => {
    setIsClearConfirmOpen(true)
  }, [])

  const onCloseClearConfirm = useCallback(() => {
    setIsClearConfirmOpen(false)
  }, [])

  const onConfirmClearCart = useCallback(async () => {
    for (const timeoutId of quantityTimersRef.current.values()) {
      clearTimeout(timeoutId)
    }
    quantityTimersRef.current.clear()
    setPendingQuantities({})

    await clearCart()
    setIsClearConfirmOpen(false)
  }, [clearCart])

  return {
    cartId,
    isClearConfirmOpen,
    items: itemsWithPendingQuantity,
    totals,
    viewState,
    onCheckout,
    onCloseClearConfirm,
    onConfirmClearCart,
    onContinueShopping,
    onOpenClearConfirm,
    onQuantityChange,
    onRemoveItem,
  }
}
