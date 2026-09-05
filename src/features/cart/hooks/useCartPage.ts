"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { CartSellerGroup, CartTotals } from "@/features/cart/types"
import { getBlockingCartItems } from "@/features/cart/utils/cart-alerts"
import { cartRequiresDentalLicense } from "@/features/cart/utils/license-check"
import { addressAPI } from "@/lib/api/address"
import { cartAPI } from "@/lib/api/cart"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import type { DentalLicenseStatus } from "@/lib/helpers/dentalLicense"
import { useDebouncedPerKeyCallback } from "@/lib/hooks/useDebouncedPerKeyCallback"
import { useDentalLicenseGate } from "@/lib/hooks/useDentalLicenseGate"
import type { CartItem } from "@/stores/cartStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

type CartViewState = "loading" | "empty" | "ready"
const QUANTITY_DEBOUNCE_MS = 450

// Toast copy for each resolved licence status, shown only at the moment a blocked buyer clicks
// "Proceed to Checkout" — matches the titles/wording used in CartSummaryPanel's persistent
// notice so the toast and the card never contradict each other.
const LICENSE_BLOCK_TOAST_COPY: Record<"checkFailed" | DentalLicenseStatus, { title: string; description: string }> = {
  checkFailed: {
    title: "Couldn't verify your dental license",
    description:
      "One or more items in your cart require an approved dental license, and we couldn't check yours just now. Please try again in a moment.",
  },
  valid: {
    title: "Dental license required",
    description: "One or more items in your cart require a valid, approved dental license.",
  },
  missing: {
    title: "Dental license required",
    description: "One or more items in your cart require a valid, approved dental license.",
  },
  pending: {
    title: "License awaiting approval",
    description:
      "One or more items in your cart require an approved dental license. Yours is under review — checkout unlocks as soon as it's approved.",
  },
  expired: {
    title: "Your dental license expired",
    description: "One or more items in your cart require a valid dental license. Renew yours to continue.",
  },
  rejected: {
    title: "Your dental license wasn't approved",
    description: "One or more items in your cart require an approved dental license.",
  },
}

interface UseCartPageResult {
  cartId: string | null
  autoOrderItemsCount: number
  blockingItemsCount: number
  hasBlockingItems: boolean
  isClearConfirmOpen: boolean
  isLicenseBlocked: boolean
  licenseCheckFailed: boolean
  licenseStatus: DentalLicenseStatus | null
  licenseRejectionReason: string | null
  licenseRequiredProductIds: Set<string>
  isLicenseChecking: boolean
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
  // null = not yet estimated (no address/items) or the estimate call failed — distinct from a
  // real $0 estimate the backend returned. `totals.tax` carries this through unchanged so the
  // panel can render "calculated at checkout" instead of a misleading $0.00.
  const [taxAmount, setTaxAmount] = useState<number | null>(null)
  const [isTaxLoading, setIsTaxLoading] = useState(false)
  const licenseGate = useDentalLicenseGate()
  // Distinguishes the click-time await inside `onCheckout` (guards a double-click and drives the
  // button spinner) from `licenseGate.isChecking`, which only covers the initial background fetch.
  const [isLicenseChecking, setIsLicenseChecking] = useState(false)
  // A ref mirror of `isLicenseChecking`: the state update from a click is not visible to a second
  // click handled in the same synchronous burst, so the guard reads the ref instead of state.
  const isLicenseCheckInFlightRef = useRef(false)

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
      // The real charge is computed and collected server-side, so this total is a display-only
      // estimate. An unknown tax (null) is treated as 0 here so the number stays finite; the
      // panel is responsible for telling the buyer tax is still to be added.
      total: subtotal + totalShipmentFee + (taxAmount ?? 0),
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
    if (!defaultAddressId || itemsWithPendingQuantity.length === 0) {
      setTaxAmount(null)
      setIsTaxLoading(false)
      return
    }

    const shipping = itemsWithPendingQuantity.reduce(
      (sum, item) =>
        sum + ((item.userProduct.shipmentFee ?? 0) + (item.userProduct.heavyShippingSurcharge ?? 0)) * item.quantity,
      0,
    )

    // Backend: CartTaxEstimateRequest.shippingAmount is a Double (@NotNull @PositiveOrZero) — an
    // unserializable shipping figure (NaN/Infinity) or a negative one can never be estimated, so
    // skip the request instead of sending a value the backend would 400 on.
    if (!Number.isFinite(shipping) || shipping < 0) {
      setTaxAmount(null)
      setIsTaxLoading(false)
      return
    }

    let isCancelled = false
    const fetchTaxEstimate = async () => {
      setIsTaxLoading(true)
      try {
        const estimate = await cartAPI.getTaxEstimate({
          addressId: defaultAddressId,
          shippingAmount: shipping,
        })
        if (!isCancelled) {
          // The estimate is money the buyer reads: a non-numeric `taxAmount` from a malformed 200
          // must fall through to "Calculated at checkout" rather than being stored, where it would
          // string-concatenate into the total (100 + 5 + "5" -> "1055") and then be floored to
          // $0.00 by formatCurrency (infra note #26, numeric form).
          setTaxAmount(Number.isFinite(estimate.taxAmount) ? estimate.taxAmount : null)
        }
      } catch (_error) {
        if (!isCancelled) {
          setTaxAmount(null)
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

  const cartRequiresLicense = useMemo(() => {
    return cartRequiresDentalLicense(itemsWithPendingQuantity)
  }, [itemsWithPendingQuantity])

  const licenseRequiredProductIds = useMemo(() => {
    return new Set(
      itemsWithPendingQuantity
        .filter((item) => cartRequiresDentalLicense([item]))
        .map((item) => item.userProduct.userProductId),
    )
  }, [itemsWithPendingQuantity])

  // Render-time signal for the persistent cart banner only. Deliberately excludes
  // `licenseGate.isChecking`'s in-flight window (a licensed buyer must not see a block flash
  // before the background check settles) — the actual gate enforcement happens in `onCheckout`,
  // which awaits the settled result directly instead of trusting this derived value.
  const isLicenseBlocked = useMemo(() => {
    if (!cartRequiresLicense || licenseGate.isChecking) return false
    return licenseGate.checkFailed || licenseGate.status !== "valid"
  }, [cartRequiresLicense, licenseGate.isChecking, licenseGate.checkFailed, licenseGate.status])

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

    if (cartRequiresLicense) {
      // A second click while the first is still awaiting `ensureChecked` must not fire a second
      // request or double-navigate; the ref (not state) catches a click inside the same tick.
      if (isLicenseCheckInFlightRef.current) return
      isLicenseCheckInFlightRef.current = true
      setIsLicenseChecking(true)

      void (async () => {
        try {
          // THE RACE FIX: await the actual settled licence result instead of reading
          // `isLicenseBlocked`, which can still hold its initial "not blocked" default the
          // instant a buyer clicks before the background licence fetch has resolved.
          const { status: resolvedStatus, checkFailed: resolvedCheckFailed } = await licenseGate.ensureChecked()

          if (resolvedCheckFailed || resolvedStatus !== "valid") {
            const copy = LICENSE_BLOCK_TOAST_COPY[resolvedCheckFailed ? "checkFailed" : (resolvedStatus ?? "missing")]
            showToast.warning(copy.title, copy.description)
            return
          }

          setStep(2)
          router.push("/checkout")
        } finally {
          isLicenseCheckInFlightRef.current = false
          setIsLicenseChecking(false)
        }
      })()
      return
    }

    setStep(2)
    router.push("/checkout")
  }, [itemsWithPendingQuantity, cartRequiresLicense, licenseGate.ensureChecked, router, setStep])

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
    licenseCheckFailed: licenseGate.checkFailed,
    licenseStatus: licenseGate.status,
    licenseRejectionReason: licenseGate.rejectionReason,
    licenseRequiredProductIds,
    isLicenseChecking,
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
