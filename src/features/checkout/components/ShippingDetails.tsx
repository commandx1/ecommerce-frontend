"use client"

import { ArrowRight } from "lucide-react"
import ShippingAddressSection from "@/features/checkout/components/ShippingAddressSection"
import ShippingMethodsSection from "@/features/checkout/components/ShippingMethodsSection"
import { useShippingDetails } from "@/features/checkout/hooks/useShippingDetails"

export default function ShippingDetails() {
  const {
    addresses,
    cartId,
    isLoadingAddresses,
    selectedAddressId,
    selectedRates,
    sellerGroups,
    onAddAddress,
    onAddressChange,
    onRateSelect,
    onSubmit,
  } = useShippingDetails()

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <ShippingAddressSection
        addresses={addresses}
        isLoading={isLoadingAddresses}
        selectedAddressId={selectedAddressId}
        onAddAddress={onAddAddress}
        onSelectAddress={onAddressChange}
      />

      {selectedAddressId && Object.keys(sellerGroups).length > 0 ? (
        <ShippingMethodsSection
          addressId={selectedAddressId}
          cartId={cartId}
          selectedRates={selectedRates}
          sellerGroups={sellerGroups}
          onRateSelect={onRateSelect}
        />
      ) : null}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={!selectedAddressId}
          className="flex items-center px-10 py-4 bg-steel-blue text-white rounded-xl hover:bg-opacity-90 font-bold text-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
        >
          Continue to Billing
          <ArrowRight className="ml-2 w-6 h-6" />
        </button>
      </div>
    </form>
  )
}
