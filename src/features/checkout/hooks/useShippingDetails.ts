"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { useCartId, useCartItems } from "@/features/cart/hooks/useCartQueries"
import { useAddressesQuery } from "@/features/checkout/hooks/useAddressesQuery"
import { isShippingQuoteExpired } from "@/features/checkout/lib/shipping-quote-expiry"
import type { SellerGroup, ShippingRate } from "@/features/checkout/types"
import { getSellerGroupKey } from "@/features/checkout/utils/seller-group-key"
import type { Address } from "@/lib/api/address"
import type { ShippoRateOrder, UberRateOrder } from "@/lib/api/orders"
import { useAuthStore } from "@/stores/authStore"
import { type ExcludedSellerLines, useCheckoutStore } from "@/stores/checkoutStore"

interface SelectedRateInfo {
  type: "shippo" | "uber"
  rateId: string
  amount: number
  /** `Date.now()` when the rate response this selection came from landed — see
   * `VendorShipmentRates`'s `onSelect` contract. */
  fetchedAt: number
}

interface UseShippingDetailsResult {
  addresses: Address[]
  cartId: string
  isLoadingAddresses: boolean
  selectedAddressId: string
  selectedRates: Record<string, SelectedRateInfo>
  sellerGroups: Record<string, SellerGroup>
  userId: string
  /**
   * True when this order sets up repeat deliveries but the chosen address is not
   * the primary one — the scheduler always ships auto orders to the primary.
   */
  showAutoOrderAddressNotice: boolean
  /**
   * Bumped whenever a stale quote blocks Continue, so `ShippingMethodsSection` can remount each
   * `VendorShipmentRates` (part of its `key`) and force a fresh fetch — the components no longer
   * cache (see `VendorShipmentRates`), so a remount is a plain refetch.
   */
  refreshKey: number
  onAddAddress: () => void
  onAddressChange: (address: Address) => void
  onRateSelect: (vendorId: string, rate: ShippingRate, fetchedAt: number) => void
  onSubmit: (event: React.FormEvent) => void
}

export function useShippingDetails(): UseShippingDetailsResult {
  const router = useRouter()
  const {
    updateShippingAddress,
    nextStep,
    setOrderPayload,
    setExcludedFromOrder,
    setSelectedShippingEtaText,
    setSelectedShippingCost,
    setSelectedVendorShippingMethods,
    setShippingQuoteFetchedAt,
  } = useCheckoutStore()
  const items = useCartItems()
  const cartId = useCartId()
  const { user } = useAuthStore()

  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [selectedRates, setSelectedRates] = useState<Record<string, SelectedRateInfo>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const onAddressChange = useCallback(
    (address: Address) => {
      setSelectedAddressId(address.id)
      updateShippingAddress({
        firstName: address.fullName.split(" ")[0] || "",
        lastName: address.fullName.split(" ").slice(1).join(" ") || "",
        street: address.addressLine,
        city: address.city,
        // The backend Address has no `state` field.
        state: "",
        zipCode: address.postalCode,
        phone: address.phoneNumber,
        company: address.title,
      })
    },
    [updateShippingAddress],
  )

  const addressesQuery = useAddressesQuery()
  const addresses = addressesQuery.data ?? []
  const isLoadingAddresses = addressesQuery.isFetching
  // Default-address selection runs once per mount, off the first settled fetch - never re-picked
  // on a later background refetch (matches today's mount-only effect; same pattern as
  // `useCartPage`'s default-address selection).
  const hasSelectedDefaultAddressRef = useRef(false)

  useEffect(() => {
    if (hasSelectedDefaultAddressRef.current) {
      return
    }

    if (addressesQuery.isSuccess) {
      const data = addressesQuery.data
      const defaultAddress = data.find((address) => address.defaultAddress) || data[0]
      if (defaultAddress) {
        onAddressChange(defaultAddress)
      }
      hasSelectedDefaultAddressRef.current = true
      return
    }

    if (addressesQuery.isError) {
      showToast.error("Failed to load addresses")
      hasSelectedDefaultAddressRef.current = true
    }
  }, [addressesQuery.isSuccess, addressesQuery.isError, addressesQuery.data, onAddressChange])

  const sellerGroups = useMemo<Record<string, SellerGroup>>(() => {
    return items.reduce<Record<string, SellerGroup>>((groups, item) => {
      const sellerName = item.userProduct.sellerName || "Standard Seller"
      const sellerId = getSellerGroupKey(item)

      if (!groups[sellerId]) {
        groups[sellerId] = {
          name: sellerName,
          sellerId: item.userProduct.sellerId,
          items: [],
        }
      }

      groups[sellerId].items.push({
        userProductId: item.userProduct.userProductId,
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        autoOrder: item.autoOrder,
        shipmentFee: item.userProduct.shipmentFee ?? 0,
      })

      return groups
    }, {})
  }, [items])

  const onRateSelect = useCallback(
    (vendorId: string, rate: ShippingRate, fetchedAt: number) => {
      const isUber = "fee" in rate && "duration" in rate
      const rateId = "objectId" in rate ? rate.objectId : rate.id
      const type: SelectedRateInfo["type"] = isUber ? "uber" : "shippo"
      const amount = isUber ? rate.fee / 100 : Number(rate.amount)
      // Backend: a Shippo rate's `servicelevel` (and the `name` inside it) can be null for a
      // real carrier rate — see the `ShipmentRate` type comment in `lib/api/shipment.ts`. Rates
      // like that are intentionally still selectable (VendorShipmentRates keeps them rather than
      // dropping a deliverable option), so this can't assume `servicelevel.name` is always there.
      const etaText = isUber
        ? "Same-day delivery - Est. 1-4 hours"
        : `${rate.servicelevel?.name ?? "Shipping"} - ${rate.estimatedDays} business days`

      setSelectedRates((prev) => {
        const current = prev[vendorId]
        if (
          current?.rateId === rateId &&
          current?.type === type &&
          current?.amount === amount &&
          current?.fetchedAt === fetchedAt
        ) {
          return prev
        }
        return { ...prev, [vendorId]: { type, rateId, amount, fetchedAt } }
      })

      // `setSelectedRates` updater timing'i ile senkron `didChange` bayrağı güvenilir değil; ETA her seçimde güncellenmeli.
      setSelectedShippingEtaText(etaText)
      setSelectedVendorShippingMethods((prev) => ({
        ...prev,
        [vendorId]: {
          sellerName: sellerGroups[vendorId]?.name || "Seller",
          methodText: etaText,
          amount,
        },
      }))
    },
    [sellerGroups, setSelectedShippingEtaText, setSelectedVendorShippingMethods],
  )

  useEffect(() => {
    const totalShippingCost = Object.values(selectedRates).reduce((sum, selectedRate) => sum + selectedRate.amount, 0)
    setSelectedShippingCost(totalShippingCost)
  }, [selectedRates, setSelectedShippingCost])

  const onSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()

      if (!selectedAddressId) {
        showToast.error("Please select a shipping address")
        return
      }

      // The quote's age is the OLDEST fetch among the currently selected vendors' rates (with
      // several vendors, the slowest-fetched one governs). `null` (nothing selected yet) is never
      // expired — the "select at least one shipping method" check below covers that case instead.
      const oldestFetchedAt = Object.values(selectedRates).reduce<number | null>(
        (oldest, selection) => (oldest === null ? selection.fetchedAt : Math.min(oldest, selection.fetchedAt)),
        null,
      )

      if (isShippingQuoteExpired(oldestFetchedAt, Date.now())) {
        showToast.warning(
          "Shipping rates expired",
          "Shipping prices can change. Please choose a shipping method again.",
        )
        setSelectedRates({})
        setRefreshKey((key) => key + 1)
        return
      }

      const shippoRateOrders: ShippoRateOrder[] = []
      const uberRateOrders: UberRateOrder[] = []
      // Sellers we could not ship for. The backend orders only the products inside the rate orders
      // and soft-deletes the WHOLE cart after payment, so these lines would silently vanish - Final
      // Review names them before the buyer commits.
      const excluded: ExcludedSellerLines[] = []

      Object.entries(sellerGroups).forEach(([sellerId, group]) => {
        const selection = selectedRates[sellerId]
        if (!selection) {
          excluded.push({ sellerName: group.name, itemNames: group.items.map((item) => item.name) })
          return
        }

        // The backend reads the recurrence off the order payload, not the cart,
        // and it looks at both shippo and uber lines.
        const products = group.items.map((item) => ({
          userProductId: item.userProductId,
          quantity: item.quantity,
          autoOrder: item.autoOrder,
        }))

        // `userId` is the raw seller id, never the grouping key above (which can fall back to a
        // display name). The backend types it as `UUID` and rejects the entire body on a non-UUID
        // string; nothing reads the field, so it is omitted when there is no real seller id.
        const userId = group.sellerId || undefined

        if (selection.type === "shippo") {
          shippoRateOrders.push({
            shippoRateId: selection.rateId,
            userId,
            products,
          })
          return
        }

        uberRateOrders.push({
          uberRateId: selection.rateId,
          userId,
          products,
        })
      })

      if (shippoRateOrders.length === 0 && uberRateOrders.length === 0) {
        showToast.error("Please select at least one shipping method")
        return
      }

      setExcludedFromOrder(excluded)
      setOrderPayload({
        addressId: selectedAddressId,
        shippoRateOrders,
        uberRateOrders,
      })
      setShippingQuoteFetchedAt(oldestFetchedAt)
      nextStep()
    },
    [
      nextStep,
      selectedAddressId,
      selectedRates,
      sellerGroups,
      setExcludedFromOrder,
      setOrderPayload,
      setShippingQuoteFetchedAt,
    ],
  )

  const onAddAddress = useCallback(() => {
    router.push("/buyer-dashboard/settings")
  }, [router])

  const showAutoOrderAddressNotice = useMemo(() => {
    if (!items.some((item) => item.autoOrder !== null)) return false
    if (!selectedAddressId) return false

    const primaryAddress = addresses.find((address) => address.defaultAddress)
    return !primaryAddress || primaryAddress.id !== selectedAddressId
  }, [addresses, items, selectedAddressId])

  return {
    addresses,
    cartId: cartId || "",
    isLoadingAddresses,
    selectedAddressId,
    selectedRates,
    sellerGroups,
    userId: user?.id || "",
    showAutoOrderAddressNotice,
    refreshKey,
    onAddAddress,
    onAddressChange,
    onRateSelect,
    onSubmit,
  }
}
