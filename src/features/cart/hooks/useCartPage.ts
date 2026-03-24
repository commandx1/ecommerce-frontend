"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { CartTotals } from "@/features/cart/types"
import type { CartItem } from "@/stores/cartStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

const FREE_SHIPPING_THRESHOLD = 1000
const STANDARD_SHIPPING_FEE = 50
const TAX_RATE = 0.18

type CartViewState = "loading" | "empty" | "ready"

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
  const { setStep } = useCheckoutStore()
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)

  useEffect(() => {
    void fetchCart()
  }, [fetchCart])

  const totals = useMemo<CartTotals>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.userProduct.price * item.quantity, 0)
    const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE
    const tax = subtotal * TAX_RATE

    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
    }
  }, [items])

  const viewState: CartViewState = useMemo(() => {
    if (isLoading && items.length === 0) {
      return "loading"
    }

    if (items.length === 0) {
      return "empty"
    }

    return "ready"
  }, [isLoading, items.length])

  const onContinueShopping = useCallback(() => {
    router.push("/")
  }, [router])

  const onCheckout = useCallback(() => {
    if (items.length === 0) return
    setStep(2)
    router.push("/checkout")
  }, [items.length, router, setStep])

  const onQuantityChange = useCallback(
    (userProductId: string, currentQuantity: number, delta: number) => {
      void updateQuantity(userProductId, currentQuantity + delta)
    },
    [updateQuantity],
  )

  const onRemoveItem = useCallback(
    (userProductId: string) => {
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
    await clearCart()
    setIsClearConfirmOpen(false)
  }, [clearCart])

  return {
    cartId,
    isClearConfirmOpen,
    items,
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
