"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { SellerGroup, ShippingRate } from "@/features/checkout/types"
import { type Address, addressAPI } from "@/lib/api/address"
import type { ShippoRateOrder, UberRateOrder } from "@/lib/api/orders"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { type ExcludedSellerLines, useCheckoutStore } from "@/stores/checkoutStore"

interface SelectedRateInfo {
  type: "shippo" | "uber"
  rateId: string
  amount: number
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
  onAddAddress: () => void
  onAddressChange: (address: Address) => void
  onRateSelect: (vendorId: string, rate: ShippingRate) => void
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
  } = useCheckoutStore()
  const { items, cartId } = useCartStore()
  const { user } = useAuthStore()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const [selectedRates, setSelectedRates] = useState<Record<string, SelectedRateInfo>>({})

  const onAddressChange = useCallback(
    (address: Address) => {
      setSelectedAddressId(address.id)
      updateShippingAddress({
        firstName: address.fullName.split(" ")[0] || "",
        lastName: address.fullName.split(" ").slice(1).join(" ") || "",
        street: address.addressLine,
        city: address.city,
        // Address (backend AddressResponse) has no `state` field - this was already always
        // `undefined` at runtime despite the old `Address.state: string` type promise; kept as
        // "" here for the same no-value behavior now that the type says so honestly. Out of
        // scope for this pass (cart/checkout); not otherwise touched.
        state: "",
        zipCode: address.postalCode,
        phone: address.phoneNumber,
        company: address.title,
      })
    },
    [updateShippingAddress],
  )

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await addressAPI.getAddresses()
        setAddresses(data)
        const defaultAddress = data.find((address) => address.defaultAddress) || data[0]
        if (defaultAddress) {
          onAddressChange(defaultAddress)
        }
      } catch (_error) {
        showToast.error("Failed to load addresses")
      } finally {
        setIsLoadingAddresses(false)
      }
    }

    void fetchAddresses()
  }, [onAddressChange])

  const sellerGroups = useMemo<Record<string, SellerGroup>>(() => {
    return items.reduce<Record<string, SellerGroup>>((groups, item) => {
      const sellerName = item.userProduct.sellerName || "Standard Seller"
      const sellerId = item.userProduct.sellerId || sellerName

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
    (vendorId: string, rate: ShippingRate) => {
      const isUber = "fee" in rate && "duration" in rate
      const rateId = "objectId" in rate ? rate.objectId : rate.id
      const type: SelectedRateInfo["type"] = isUber ? "uber" : "shippo"
      const amount = isUber ? rate.fee / 100 : Number(rate.amount)
      // Backend: a Shippo rate's `servicelevel` (and the `name` inside it) can be null for a
      // real carrier rate — see the `ShipmentRate` type comment in `lib/api/shipment.ts`. Rates
      // like that are intentionally still selectable (VendorShipmentRates keeps them rather than
      // dropping a deliverable option), so this can't assume `servicelevel.name` is always there.
      const etaText = isUber
        ? `Same-day delivery - ${rate.duration} mins`
        : `${rate.servicelevel?.name ?? "Shipping"} - ${rate.estimatedDays} business days`

      setSelectedRates((prev) => {
        if (prev[vendorId]?.rateId === rateId && prev[vendorId]?.type === type && prev[vendorId]?.amount === amount) {
          return prev
        }
        return { ...prev, [vendorId]: { type, rateId, amount } }
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

      const shippoRateOrders: ShippoRateOrder[] = []
      const uberRateOrders: UberRateOrder[] = []
      // Sellers we could not ship for. The backend builds the order purely from the products
      // carried inside the rate orders below (OrderCreationService:163-173), and once payment
      // succeeds it soft-deletes the ENTIRE cart, not just the ordered lines
      // (CartService.processCartAfterPaymentSuccess:189-204). So a line dropped here is lost
      // twice: never ordered, and gone from the cart. Final Review names them before the buyer
      // commits, instead of letting them disappear silently.
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

        // `userId` on the wire is `group.sellerId` (the cart line's raw seller id), never the
        // `sellerId` grouping key above — that key falls back to the seller's display name (or
        // "Standard Seller") when the cart line carries no seller id (see the `sellerGroups`
        // memo). Sending that fallback text through as `userId` broke the whole order: backend
        // types `ShippoRateOrder.userId`/`UberRateOrder.userId` as `UUID`, and Jackson rejects
        // the *entire* request body if any one field fails to parse as its declared type — a
        // non-UUID string here 400s the whole order, not just this vendor's line. Neither
        // `OrderCreationService` nor any other backend code calls `getUserId()` on either DTO
        // (the one call site is commented out — `OrderUberDeliveryService.java:242`), so the
        // field is safe to omit entirely when there is no real seller id to send.
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
      nextStep()
    },
    [nextStep, selectedAddressId, selectedRates, sellerGroups, setExcludedFromOrder, setOrderPayload],
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
    onAddAddress,
    onAddressChange,
    onRateSelect,
    onSubmit,
  }
}
