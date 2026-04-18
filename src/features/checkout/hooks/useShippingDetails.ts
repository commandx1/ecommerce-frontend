"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { SellerGroup, ShippingRate } from "@/features/checkout/types"
import { type Address, addressAPI } from "@/lib/api/address"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

interface UserProductSellerMeta {
  sellerName?: string
  sellerId?: string
  userId?: string
  vendor?: string
}

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
  onAddAddress: () => void
  onAddressChange: (address: Address) => void
  onRateSelect: (vendorId: string, rate: ShippingRate) => void
  onSubmit: (event: React.FormEvent) => void
}

export function useShippingDetails(): UseShippingDetailsResult {
  const router = useRouter()
  const { updateShippingAddress, nextStep, setOrderPayload, setSelectedShippingEtaText, setSelectedShippingCost } =
    useCheckoutStore()
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
        state: "CA",
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
      const userProduct = item.userProduct as UserProductSellerMeta
      const sellerName = userProduct.sellerName || userProduct.vendor || "Standard Seller"
      const sellerId = userProduct.sellerId || userProduct.userId || sellerName

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
    },
    [setSelectedShippingEtaText],
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

      const shippoRateOrders: {
        shippoRateId: string
        userId: string
        products: { userProductId: string; quantity: number }[]
      }[] = []

      const uberRateOrders: {
        uberRateId: string
        userId: string
        products: { userProductId: string; quantity: number }[]
      }[] = []

      Object.entries(sellerGroups).forEach(([sellerId, group]) => {
        const selection = selectedRates[sellerId]
        if (!selection) return

        const products = group.items.map((item) => ({
          userProductId: item.userProductId,
          quantity: item.quantity,
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

  return {
    addresses,
    cartId: cartId || "",
    isLoadingAddresses,
    selectedAddressId,
    selectedRates,
    sellerGroups,
    userId: user?.id || "",
    onAddAddress,
    onAddressChange,
    onRateSelect,
    onSubmit,
  }
}
