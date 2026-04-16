"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { CartSellerGroup, CartTotals } from "@/features/cart/types"
import { getBlockingCartItems } from "@/features/cart/utils/cart-alerts"
import { useDebouncedPerKeyCallback } from "@/lib/hooks/useDebouncedPerKeyCallback"
import type { CartItem } from "@/stores/cartStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

type CartViewState = "loading" | "empty" | "ready"
const QUANTITY_DEBOUNCE_MS = 450

interface UserProductSellerMeta {
  sellerName?: string
  sellerId?: string
  userId?: string
  vendor?: string
}

interface UseCartPageResult {
  cartId: string | null
  blockingItemsCount: number
  hasBlockingItems: boolean
  isClearConfirmOpen: boolean
  items: CartItem[]
  sellerGroups: Record<string, CartSellerGroup>
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
  const { cartId, items, fetchCart, isLoading, clearCart, updateQuantity, removeFromCart, error } = useCartStore()
  const { setStep } = useCheckoutStore()
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({})

  const { schedule, cancel, cancelAll } = useDebouncedPerKeyCallback<string, number>({
    delayMs: QUANTITY_DEBOUNCE_MS,
    callback: async (nextQuantity, context) => {
      await updateQuantity(context.key, nextQuantity)
      if (!context.isLatest()) {
        return
      }

      setPendingQuantities((prev) => {
        const { [context.key]: _removed, ...rest } = prev
        return rest
      })
    },
  })

  useEffect(() => {
    void fetchCart()
  }, [fetchCart])

  useEffect(() => {
    if (error) {
      showToast.error("Cart unavailable", error)
    }
  }, [error])

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
    const shipping = itemsWithPendingQuantity.reduce(
      (sum, item) => sum + (item.userProduct.shipmentFee ?? 0) * item.quantity,
      0,
    )

    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
    }
  }, [itemsWithPendingQuantity])

  const sellerGroups = useMemo<Record<string, CartSellerGroup>>(() => {
    return itemsWithPendingQuantity.reduce<Record<string, CartSellerGroup>>((groups, item) => {
      const userProduct = item.userProduct as UserProductSellerMeta
      const sellerName = userProduct.sellerName || userProduct.vendor || "Standard Seller"
      const sellerId = userProduct.sellerId || userProduct.userId || sellerName

      if (!groups[sellerId]) {
        groups[sellerId] = {
          name: sellerName,
          items: [],
        }
      }

      groups[sellerId].items.push(item)
      return groups
    }, {})
  }, [itemsWithPendingQuantity])

  const blockingItemsCount = useMemo(() => {
    return getBlockingCartItems(itemsWithPendingQuantity).length
  }, [itemsWithPendingQuantity])

  const hasBlockingItems = blockingItemsCount > 0

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

    const blockingItems = getBlockingCartItems(itemsWithPendingQuantity)
    if (blockingItems.length > 0) {
      const itemWord = blockingItems.length > 1 ? "items" : "item"
      showToast.warning(
        "Checkout unavailable",
        `Please remove ${blockingItems.length} unavailable ${itemWord} from your cart before checkout.`,
      )
      return
    }

    setStep(2)
    router.push("/checkout")
  }, [itemsWithPendingQuantity, router, setStep])

  const onQuantityChange = useCallback(
    (userProductId: string, currentQuantity: number, delta: number) => {
      const baseQuantity = pendingQuantities[userProductId] ?? currentQuantity
      const nextQuantity = Math.max(0, baseQuantity + delta)

      setPendingQuantities((prev) => ({
        ...prev,
        [userProductId]: nextQuantity,
      }))

      schedule(userProductId, nextQuantity)
    },
    [pendingQuantities, schedule],
  )

  const onRemoveItem = useCallback(
    (userProductId: string) => {
      cancel(userProductId)

      setPendingQuantities((prev) => {
        const { [userProductId]: _removed, ...rest } = prev
        return rest
      })
      void removeFromCart(userProductId)
    },
    [cancel, removeFromCart],
  )

  const onOpenClearConfirm = useCallback(() => {
    setIsClearConfirmOpen(true)
  }, [])

  const onCloseClearConfirm = useCallback(() => {
    setIsClearConfirmOpen(false)
  }, [])

  const onConfirmClearCart = useCallback(async () => {
    cancelAll()
    setPendingQuantities({})

    await clearCart()
    setIsClearConfirmOpen(false)
  }, [cancelAll, clearCart])

  return {
    cartId,
    blockingItemsCount,
    hasBlockingItems,
    isClearConfirmOpen,
    items: itemsWithPendingQuantity,
    sellerGroups,
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
