"use client"

import { ArrowRight, Check, MapPin, Plus } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { useCartStore } from "@/stores/cartStore"
import { useAuthStore } from "@/stores/authStore"
import { addressAPI, type Address } from "@/lib/api/address"
import { toast } from "sonner"
import VendorShipmentRates from "./VendorShipmentRates"
import { useRouter } from "next/navigation"

const ShippingDetails = () => {
  const { updateShippingAddress, nextStep, setOrderPayload } = useCheckoutStore()
  const { items, cartId } = useCartStore()
  const { user } = useAuthStore()
  const router = useRouter()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  type SelectedRateInfo = {
    type: "shippo" | "uber"
    rateId: string
  }

  const [selectedRates, setSelectedRates] = useState<Record<string, SelectedRateInfo>>({})

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await addressAPI.getAddresses()
        setAddresses(data)
        const defaultAddress = data.find((a) => a.defaultAddress) || data[0]
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          handleAddressChange(defaultAddress)
        }
      } catch (error) {
        toast.error("Failed to load addresses")
      } finally {
        setIsLoadingAddresses(false)
      }
    }
    fetchAddresses()
  }, [])

  const handleAddressChange = (address: Address) => {
    setSelectedAddressId(address.id)
    updateShippingAddress({
      firstName: address.fullName.split(" ")[0] || "",
      lastName: address.fullName.split(" ").slice(1).join(" ") || "",
      street: address.addressLine,
      city: address.city,
      state: "CA", // Fallback if state is missing in Address
      zipCode: address.postalCode,
      phone: address.phoneNumber,
      company: address.title,
    })
  }

  const handleRateSelect = useCallback((vendorId: string, rate: any) => {
    const isUber = "fee" in rate && "duration" in rate
    const rateId = rate.objectId || rate.id
    const type: SelectedRateInfo["type"] = isUber ? "uber" : "shippo"

    setSelectedRates((prev) => {
      if (prev[vendorId]?.rateId === rateId && prev[vendorId]?.type === type) return prev
      return { ...prev, [vendorId]: { type, rateId } }
    })
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAddressId) {
      toast.error("Please select a shipping address")
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
      } else {
        uberRateOrders.push({
          uberRateId: selection.rateId,
          userId: sellerId,
          products,
        })
      }
    })

    if (shippoRateOrders.length === 0 && uberRateOrders.length === 0) {
      toast.error("Please select at least one shipping method")
      return
    }

    setOrderPayload({
      addressId: selectedAddressId,
      shippoRateOrders,
      uberRateOrders,
    })

    nextStep()
  }

  // Group items by seller
  const sellerGroups = useMemo(() => {
    return items.reduce(
      (groups, item) => {
        // biome-ignore lint/suspicious/noExplicitAny: backend returns seller info
        const up = item.userProduct as any
        // Get seller name and ID from backend fields
        // sellerId usually maps to userProduct.sellerId or userProduct.userId
        const sellerName = up.sellerName || up.vendor || item.product.name.split("-").pop()?.trim() || "Standard Seller"
        const sellerId = up.sellerId || up.userId || sellerName

        if (!groups[sellerId]) {
          groups[sellerId] = {
            name: sellerName,
            items: [],
          }
        }
        groups[sellerId].items.push({
          userProductId: item.userProduct.userProductId,
          name: item.product.name,
          quantity: item.quantity,
        })
        return groups
      },
      {} as Record<string, { name: string; items: { userProductId: string; name: string; quantity: number }[] }>,
    )
  }, [items])

  return (
    <div className="space-y-8">
      {/* Address Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-sm font-semibold">2</span>
            </div>
            <h2 className="text-2xl font-bold text-steel-blue">Select Shipping Address</h2>
          </div>
          <button
            type="button"
            onClick={() => router.push("/buyer-dashboard/settings/addresses")}
            className="flex items-center text-steel-blue hover:underline text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add New Address
          </button>
        </div>

        {isLoadingAddresses ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-gray-100 rounded-xl"></div>
            <div className="h-24 bg-gray-100 rounded-xl"></div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">No addresses found in your account.</p>
            <button
              onClick={() => router.push("/buyer-dashboard/settings/addresses")}
              className="px-6 py-2 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`relative p-6 border rounded-2xl cursor-pointer transition-all hover:border-steel-blue/50 ${
                  selectedAddressId === address.id
                    ? "border-steel-blue bg-blue-50/50 ring-1 ring-steel-blue"
                    : "border-gray-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="shippingAddress"
                  className="sr-only"
                  checked={selectedAddressId === address.id}
                  onChange={() => handleAddressChange(address)}
                />
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{address.title}</h3>
                    <p className="text-sm text-gray-600 font-medium">{address.fullName}</p>
                    <div className="text-sm text-gray-500 mt-2 space-y-1">
                      <p>{address.formattedAddress || address.addressLine}</p>
                      <p>{address.phoneNumber}</p>
                    </div>
                  </div>
                  {selectedAddressId === address.id && (
                    <div className="bg-steel-blue rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Shipment Options by Seller */}
      {selectedAddressId && Object.keys(sellerGroups).length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-sm font-semibold">3</span>
            </div>
            <h2 className="text-2xl font-bold text-steel-blue">Shipping Methods</h2>
          </div>

          <div className="space-y-8">
            {Object.entries(sellerGroups).map(([sellerId, group]) => (
              <VendorShipmentRates
                key={sellerId}
                sellerId={sellerId}
                sellerName={group.name}
                items={group.items}
                addressId={selectedAddressId}
                userId={user?.id || ""}
                cartId={cartId || ""}
                selectedRateId={selectedRates[sellerId]?.rateId}
                onSelect={handleRateSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedAddressId}
          className="flex items-center px-10 py-4 bg-steel-blue text-white rounded-xl hover:bg-opacity-90 font-bold text-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
        >
          Continue to Billing
          <ArrowRight className="ml-2 w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

export default ShippingDetails
