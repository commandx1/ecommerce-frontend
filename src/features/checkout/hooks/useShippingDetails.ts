"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { SellerGroup, ShippingRate } from "@/features/checkout/types"
import { type Address, addressAPI } from "@/lib/api/address"
import type { ShippoRateOrder, UberRateOrder } from "@/lib/api/orders"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

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
        state: address.state,
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
          items: [],
        }
      }

      groups[sellerId].items.push({
        userProductId: item.userProduct.userProductId,
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        autoOrder: item.autoOrder,
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
      const etaText = isUber
        ? `Same-day delivery - ${rate.duration} mins`
        : `${rate.servicelevel.name} - ${rate.estimatedDays} business days`

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

      Object.entries(sellerGroups).forEach(([sellerId, group]) => {
        const selection = selectedRates[sellerId]
        if (!selection) return

        // The backend reads the recurrence off the order payload, not the cart,
        // and it looks at both shippo and uber lines.
        const products = group.items.map((item) => ({
          userProductId: item.userProductId,
          quantity: item.quantity,
          autoOrder: item.autoOrder,
        }))

        if (selection.type === "shippo") {
          shippoRateOrders.push({
            shippoRateId: selection.rateId,
            userId: sellerId,
            products,
          })
          return
        }

        uberRateOrders.push({
          uberRateId: selection.rateId,
          userId: sellerId,
          products,
        })
      })

      if (shippoRateOrders.length === 0 && uberRateOrders.length === 0) {
        showToast.error("Please select at least one shipping method")
        return
      }

      setOrderPayload({
        addressId: selectedAddressId,
        shippoRateOrders,
        uberRateOrders,
      })
      nextStep()
    },
    [nextStep, selectedAddressId, selectedRates, sellerGroups, setOrderPayload],
  )

  const onAddAddress = useCallback(() => {
    router.push("/buyer-dashboard/settings/addresses")
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
