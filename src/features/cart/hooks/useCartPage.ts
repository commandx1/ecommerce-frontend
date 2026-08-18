"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { CartSellerGroup, CartTotals } from "@/features/cart/types"
import { getBlockingCartItems } from "@/features/cart/utils/cart-alerts"
import { cartRequiresDentalLicense, hasValidDentalLicense } from "@/features/cart/utils/license-check"
import { addressAPI } from "@/lib/api/address"
import { cartAPI } from "@/lib/api/cart"
import { licenseAPI } from "@/lib/api/licenses"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import { useDebouncedPerKeyCallback } from "@/lib/hooks/useDebouncedPerKeyCallback"
import type { CartItem } from "@/stores/cartStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

type CartViewState = "loading" | "empty" | "ready"
const QUANTITY_DEBOUNCE_MS = 450

interface UseCartPageResult {
  cartId: string | null
  autoOrderItemsCount: number
  blockingItemsCount: number
  hasBlockingItems: boolean
  isClearConfirmOpen: boolean
  isLicenseBlocked: boolean
  isTaxLoading: boolean
  items: CartItem[]
  sellerGroups: Record<string, CartSellerGroup>
  totals: CartTotals
  viewState: CartViewState
  onAutoOrderChange: (userProductId: string, period: AutoOrderPeriod | null) => Promise<void>
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
  const { cartId, items, fetchCart, isLoading, clearCart, updateQuantity, setItemAutoOrder, removeFromCart, error } =
    useCartStore()
  const { setStep } = useCheckoutStore()
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({})
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null)
  const [taxAmount, setTaxAmount] = useState(0)
  const [isTaxLoading, setIsTaxLoading] = useState(false)
  const [hasValidLicense, setHasValidLicense] = useState(true)

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
    const shipmentFee = itemsWithPendingQuantity.reduce(
      (sum, item) => sum + (item.userProduct.shipmentFee ?? 0) * item.quantity,
      0,
    )
    const heavyShipmentFee = itemsWithPendingQuantity.reduce(
      (sum, item) => sum + (item.userProduct.heavyShippingSurcharge ?? 0) * item.quantity,
      0,
    )
    const totalShipmentFee = shipmentFee + heavyShipmentFee

    return {
      subtotal,
      shipmentFee,
      heavyShipmentFee,
      totalShipmentFee,
      tax: taxAmount,
      total: subtotal + totalShipmentFee + taxAmount,
    }
  }, [itemsWithPendingQuantity, taxAmount])

  useEffect(() => {
    const fetchDefaultAddress = async () => {
      try {
        const addresses = await addressAPI.getAddresses()
        const defaultAddress = addresses.find((address) => address.defaultAddress) || addresses[0]
        setDefaultAddressId(defaultAddress?.id ?? null)
      } catch (_error) {
        setDefaultAddressId(null)
      }
    }

    void fetchDefaultAddress()
  }, [])

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const licenses = await licenseAPI.getLicenses()
        setHasValidLicense(hasValidDentalLicense(licenses))
      } catch (_error) {
        setHasValidLicense(false)
      }
    }

    void fetchLicenses()
  }, [])

  useEffect(() => {
    if (!defaultAddressId || itemsWithPendingQuantity.length === 0) {
      setTaxAmount(0)
      setIsTaxLoading(false)
      return
    }

    const shipping = itemsWithPendingQuantity.reduce(
      (sum, item) =>
        sum + ((item.userProduct.shipmentFee ?? 0) + (item.userProduct.heavyShippingSurcharge ?? 0)) * item.quantity,
      0,
    )

    let isCancelled = false
    const fetchTaxEstimate = async () => {
      setIsTaxLoading(true)
      try {
        const estimate = await cartAPI.getTaxEstimate({
          addressId: defaultAddressId,
          shippingAmount: String(shipping),
        })
        if (!isCancelled) {
          setTaxAmount(estimate.taxAmount)
        }
      } catch (_error) {
        if (!isCancelled) {
          setTaxAmount(0)
        }
      } finally {
        if (!isCancelled) {
          setIsTaxLoading(false)
        }
      }
    }

    void fetchTaxEstimate()

    return () => {
      isCancelled = true
    }
  }, [defaultAddressId, itemsWithPendingQuantity])

  const sellerGroups = useMemo<Record<string, CartSellerGroup>>(() => {
    return itemsWithPendingQuantity.reduce<Record<string, CartSellerGroup>>((groups, item) => {
      const sellerName = item.userProduct.sellerName || "Standard Seller"
      const sellerId = item.userProduct.sellerId || sellerName

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

  const autoOrderItemsCount = useMemo(() => {
    return itemsWithPendingQuantity.filter((item) => item.autoOrder !== null).length
  }, [itemsWithPendingQuantity])

  const hasBlockingItems = blockingItemsCount > 0

  const isLicenseBlocked = useMemo(() => {
    return cartRequiresDentalLicense(itemsWithPendingQuantity) && !hasValidLicense
  }, [itemsWithPendingQuantity, hasValidLicense])

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

    if (isLicenseBlocked) {
      showToast.warning(
        "Dental license required",
        "Add a valid, approved dental license in your account settings before checking out.",
      )
      return
    }

    setStep(2)
    router.push("/checkout")
  }, [itemsWithPendingQuantity, isLicenseBlocked, router, setStep])

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

  const onAutoOrderChange = useCallback(
    async (userProductId: string, period: AutoOrderPeriod | null) => {
      // Quantity and schedule go through the same endpoint, and the backend
      // replaces the schedule on every write. Flush any still-debounced quantity
      // edit into this single write instead of letting the two race.
      cancel(userProductId)
      const pendingQuantity = pendingQuantities[userProductId]

      try {
        await setItemAutoOrder(userProductId, period, pendingQuantity)
        if (pendingQuantity !== undefined) {
          setPendingQuantities((prev) => {
            const { [userProductId]: _removed, ...rest } = prev
            return rest
          })
        }
      } catch (error) {
        showToast.error("Could not update auto-reorder", "We couldn't save the schedule for this item. Try again.")
        throw error
      }
    },
    [cancel, pendingQuantities, setItemAutoOrder],
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
    autoOrderItemsCount,
    blockingItemsCount,
    hasBlockingItems,
    isClearConfirmOpen,
    isLicenseBlocked,
    isTaxLoading,
    items: itemsWithPendingQuantity,
    sellerGroups,
    totals,
    viewState,
    onAutoOrderChange,
    onCheckout,
    onCloseClearConfirm,
    onConfirmClearCart,
    onContinueShopping,
    onOpenClearConfirm,
    onQuantityChange,
    onRemoveItem,
  }
}
